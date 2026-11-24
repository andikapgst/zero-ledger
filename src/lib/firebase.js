// src/lib/firebase.js
// Firebase initialization & service exports with atomic multi-document transactions

import { initializeApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut as firebaseSignOut,
} from 'firebase/auth';
import {
  getFirestore,
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
  Timestamp,
  runTransaction,
  writeBatch,
} from 'firebase/firestore';

// ─── Firebase Config ────────────────────────────────────────────────────────
const firebaseConfig = {
  apiKey:            import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyAE5aUEc3EKI40klKFoEcN5vW2jQX-5jTw',
  authDomain:        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'zero-ledger-20.firebaseapp.com',
  projectId:         import.meta.env.VITE_FIREBASE_PROJECT_ID || 'zero-ledger-20',
  storageBucket:     import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'zero-ledger-20.firebasestorage.app',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '190318528794',
  appId:             import.meta.env.VITE_FIREBASE_APP_ID || '1:190318528794:web:594bb1eb910d49d79d04a3',
  measurementId:     import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || 'G-SBL08SV1JR',
};

// ─── App Initialization ──────────────────────────────────────────────────────
const app  = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db   = getFirestore(app);

// ─── Auth Helpers ─────────────────────────────────────────────────────────────
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

export const signInWithGoogle = () => signInWithPopup(auth, googleProvider);
export const signOut = () => firebaseSignOut(auth);

// ─── Firestore Collection References ─────────────────────────────────────────
export const usersCol        = collection(db, 'users');
export const walletsCol      = collection(db, 'wallets');
export const transactionsCol = collection(db, 'transactions');
export const budgetsCol      = collection(db, 'budgets');
export const debtsCol        = collection(db, 'debts');

// ─── User Profile ─────────────────────────────────────────────────────────────
export async function upsertUserProfile(user) {
  const ref = doc(db, 'users', user.uid);
  const snap = await getDoc(ref);
  if (!snap.exists()) {
    await setDoc(ref, {
      uid:         user.uid,
      displayName: user.displayName,
      email:       user.email,
      photoURL:    user.photoURL,
      currency:    'IDR',
      createdAt:   serverTimestamp(),
    });
  }
  return ref;
}

// ─── Wallet Helpers ───────────────────────────────────────────────────────────
export async function getWallets(uid) {
  try {
    const q = query(walletsCol, where('uid', '==', uid));
    const snap = await getDocs(q);
    const items = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    // Client-side sort by createdAt asc (no composite index needed)
    return items.sort((a, b) => {
      const tA = a.createdAt?.toMillis ? a.createdAt.toMillis() : (a.createdAt?.seconds ? a.createdAt.seconds * 1000 : 0);
      const tB = b.createdAt?.toMillis ? b.createdAt.toMillis() : (b.createdAt?.seconds ? b.createdAt.seconds * 1000 : 0);
      return tA - tB;
    });
  } catch (err) {
    console.error('getWallets query error:', err);
    throw err;
  }
}

export async function addWallet(uid, data) {
  return addDoc(walletsCol, {
    uid,
    name:      data.name,
    type:      data.type || 'bank',
    balance:   Number(data.balance) || 0,
    color:     data.color || '#2DD4BF',
    isDefault: data.isDefault ?? false,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

export async function updateWallet(walletId, data) {
  const updateData = {
    ...data,
    updatedAt: serverTimestamp(),
  };
  if (data.balance !== undefined) {
    updateData.balance = Number(data.balance);
  }
  return updateDoc(doc(db, 'wallets', walletId), updateData);
}

export async function deleteWallet(walletId) {
  return deleteDoc(doc(db, 'wallets', walletId));
}

// ─── Transaction Helpers & Atomic Ledger Operations ───────────────────────────

export async function getTransactions(uid, options = {}) {
  try {
    const { limitCount = 300, walletId = null } = options;
    let q;
    if (walletId) {
      q = query(transactionsCol, where('uid', '==', uid), where('walletId', '==', walletId));
    } else {
      q = query(transactionsCol, where('uid', '==', uid));
    }
    const snap = await getDocs(q);
    const items = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    // Client-side sort by date desc (no composite index needed)
    items.sort((a, b) => {
      const tA = a.date?.toMillis ? a.date.toMillis() : (a.date?.seconds ? a.date.seconds * 1000 : (new Date(a.date || a.createdAt || 0)).getTime());
      const tB = b.date?.toMillis ? b.date.toMillis() : (b.date?.seconds ? b.date.seconds * 1000 : (new Date(b.date || b.createdAt || 0)).getTime());
      return tB - tA;
    });
    return limitCount ? items.slice(0, limitCount) : items;
  } catch (err) {
    console.error('getTransactions query error:', err);
    throw err;
  }
}

/**
 * Catat Transaksi dengan Firestore runTransaction agar atomic:
 * - Update saldo wallet terkait secara real-time
 * - Tambahkan dokumen ke koleksi 'transactions'
 */
export async function recordTransactionAtomic(uid, data) {
  const {
    type,           // 'expense' | 'income' | 'transfer' | 'savings' | 'debt'
    amount,
    category,
    walletId,
    toWalletId = null,
    adminFee = 0,
    date = new Date(),
    note = '',
    debtPerson = '',
    debtType = 'debt', // 'debt' | 'receivable'
    isPaid = false,
  } = data;

  const numAmount   = Number(amount);
  const numAdminFee = Number(adminFee) || 0;
  if (numAmount <= 0) throw new Error('Nominal transaksi harus lebih besar dari 0');

  const newTxRef = doc(transactionsCol);

  return runTransaction(db, async (transaction) => {
    // ── 1. TRANSFER ─────────────────────────────────────────────
    if (type === 'transfer') {
      if (!walletId || !toWalletId) throw new Error('Pilih wallet asal dan wallet tujuan');
      if (walletId === toWalletId) throw new Error('Wallet asal dan tujuan tidak boleh sama');

      const fromRef = doc(db, 'wallets', walletId);
      const toRef   = doc(db, 'wallets', toWalletId);

      const fromDoc = await transaction.get(fromRef);
      const toDoc   = await transaction.get(toRef);

      if (!fromDoc.exists()) throw new Error('Wallet asal tidak ditemukan');
      if (!toDoc.exists()) throw new Error('Wallet tujuan tidak ditemukan');

      const fromData = fromDoc.data();
      const toData   = toDoc.data();

      const totalDeduct = numAmount + numAdminFee;
      const currentFromBalance = Number(fromData.balance) || 0;
      const currentToBalance   = Number(toData.balance) || 0;

      if (currentFromBalance < totalDeduct) {
        throw new Error(`Saldo ${fromData.name} tidak cukup (${currentFromBalance} < ${totalDeduct})`);
      }

      transaction.update(fromRef, {
        balance: currentFromBalance - totalDeduct,
        updatedAt: serverTimestamp(),
      });

      transaction.update(toRef, {
        balance: currentToBalance + numAmount,
        updatedAt: serverTimestamp(),
      });

      const finalNote = note
        ? `${note} (${fromData.name} ➔ ${toData.name})`
        : `Transfer ${fromData.name} ke ${toData.name}`;

      transaction.set(newTxRef, {
        uid,
        type: 'transfer',
        category: category || 'Transfer Antar Wallet',
        amount: numAmount,
        adminFee: numAdminFee,
        walletId,
        toWalletId,
        walletName: fromData.name,
        toWalletName: toData.name,
        note: finalNote,
        date: Timestamp.fromDate(date instanceof Date ? date : new Date(date)),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      return { txId: newTxRef.id };
    }

    // ── 2. PENGELUARAN (EXPENSE) / TARGET TABUNGAN (SAVINGS) ────
    if (type === 'expense' || type === 'savings') {
      if (!walletId) throw new Error('Pilih wallet sumber dana');
      const wRef = doc(db, 'wallets', walletId);
      const wDoc = await transaction.get(wRef);

      if (!wDoc.exists()) throw new Error('Wallet sumber dana tidak ditemukan');
      const wData = wDoc.data();
      const currentBalance = Number(wData.balance) || 0;

      transaction.update(wRef, {
        balance: currentBalance - numAmount,
        updatedAt: serverTimestamp(),
      });

      transaction.set(newTxRef, {
        uid,
        type: type === 'savings' ? 'savings' : 'expense',
        category: category || (type === 'savings' ? 'Target Tabungan' : 'Lainnya'),
        amount: numAmount,
        walletId,
        walletName: wData.name,
        toWalletId: null,
        note: note.trim(),
        date: Timestamp.fromDate(date instanceof Date ? date : new Date(date)),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      return { txId: newTxRef.id };
    }

    // ── 3. PEMASUKAN (INCOME) ───────────────────────────────────
    if (type === 'income') {
      if (!walletId) throw new Error('Pilih wallet tujuan dana masuk');
      const wRef = doc(db, 'wallets', walletId);
      const wDoc = await transaction.get(wRef);

      if (!wDoc.exists()) throw new Error('Wallet tidak ditemukan');
      const wData = wDoc.data();
      const currentBalance = Number(wData.balance) || 0;

      transaction.update(wRef, {
        balance: currentBalance + numAmount,
        updatedAt: serverTimestamp(),
      });

      transaction.set(newTxRef, {
        uid,
        type: 'income',
        category: category || 'Gaji Utama',
        amount: numAmount,
        walletId,
        walletName: wData.name,
        toWalletId: null,
        note: note.trim(),
        date: Timestamp.fromDate(date instanceof Date ? date : new Date(date)),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      return { txId: newTxRef.id };
    }

    // ── 4. HUTANG / PIUTANG (DEBT) ──────────────────────────────
    if (type === 'debt') {
      let isCashOut = category === 'Bayar Hutang' || category === 'Piutang Dipinjamkan';
      let walletName = '';

      if (walletId) {
        const wRef = doc(db, 'wallets', walletId);
        const wDoc = await transaction.get(wRef);
        if (wDoc.exists()) {
          const wData = wDoc.data();
          walletName = wData.name;
          const currentBalance = Number(wData.balance) || 0;
          const newBalance = isCashOut ? currentBalance - numAmount : currentBalance + numAmount;
          transaction.update(wRef, {
            balance: newBalance,
            updatedAt: serverTimestamp(),
          });
        }
      }

      transaction.set(newTxRef, {
        uid,
        type: 'debt',
        category: category || 'Hutang / Piutang',
        amount: numAmount,
        walletId: walletId || null,
        walletName: walletName || null,
        debtPerson: debtPerson.trim(),
        debtType,
        isCashOut,
        note: note.trim(),
        date: Timestamp.fromDate(date instanceof Date ? date : new Date(date)),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      if (debtPerson.trim()) {
        const debtRef = doc(debtsCol);
        transaction.set(debtRef, {
          uid,
          type: debtType,
          person: debtPerson.trim(),
          amount: numAmount,
          paidAmount: 0,
          note: note.trim(),
          isPaid,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }

      return { txId: newTxRef.id };
    }

    throw new Error(`Tipe transaksi tidak dikenali: ${type}`);
  });
}

export async function transferBetweenWallets(uid, params) {
  return recordTransactionAtomic(uid, {
    type: 'transfer',
    ...params,
    walletId: params.fromWalletId,
    toWalletId: params.toWalletId,
  });
}

export async function addTransaction(uid, data) {
  return recordTransactionAtomic(uid, data);
}

export async function updateTransaction(txId, data) {
  return updateDoc(doc(db, 'transactions', txId), {
    ...data,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteTransaction(txId) {
  return deleteDoc(doc(db, 'transactions', txId));
}

// ─── Budget Helpers ───────────────────────────────────────────────────────────
export async function getBudgets(uid, month) {
  const q = query(budgetsCol, where('uid', '==', uid), where('month', '==', month));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function saveMonthlyBudgets(uid, month, budgetItems) {
  const batch = writeBatch(db);

  for (const item of budgetItems) {
    if (item.id) {
      const bRef = doc(db, 'budgets', item.id);
      batch.update(bRef, {
        limit: Number(item.limit) || 0,
        updatedAt: serverTimestamp(),
      });
    } else {
      const bRef = doc(budgetsCol);
      batch.set(bRef, {
        uid,
        category: item.category,
        limit: Number(item.limit) || 0,
        spent: 0,
        period: 'monthly',
        month,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }
  }

  return batch.commit();
}

// ─── Debt / Receivable Helpers (Atomic Settlement) ───────────────────────────
export async function getDebts(uid) {
  try {
    const q = query(debtsCol, where('uid', '==', uid));
    const snap = await getDocs(q);
    const items = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    // Client-side sort by createdAt desc (no composite index needed)
    return items.sort((a, b) => {
      const tA = a.createdAt?.toMillis ? a.createdAt.toMillis() : (a.createdAt?.seconds ? a.createdAt.seconds * 1000 : 0);
      const tB = b.createdAt?.toMillis ? b.createdAt.toMillis() : (b.createdAt?.seconds ? b.createdAt.seconds * 1000 : 0);
      return tB - tA;
    });
  } catch (err) {
    console.error('getDebts query error:', err);
    throw err;
  }
}

/**
 * Catat Hutang atau Piutang baru secara Atomic:
 * - Update saldo wallet yang dipakai talangan (keluar) atau pinjaman diterima (masuk)
 * - Simpan dokumen di koleksi debts
 * - Catat ke koleksi transactions
 */
export async function createDebtAtomic(uid, {
  type, // 'debt' (Saya Berhutang) | 'receivable' (Orang Berhutang)
  person,
  amount,
  note = '',
  walletId = null,
  dueDate = null,
}) {
  const numAmount = Number(amount);
  if (numAmount <= 0) throw new Error('Nominal harus lebih besar dari 0');
  if (!person.trim()) throw new Error('Nama orang / pihak terkait harus diisi');

  const newDebtRef = doc(debtsCol);
  const newTxRef   = doc(transactionsCol);

  return runTransaction(db, async (transaction) => {
    let walletName = '';

    if (walletId) {
      const wRef = doc(db, 'wallets', walletId);
      const wDoc = await transaction.get(wRef);
      if (wDoc.exists()) {
        const wData = wDoc.data();
        walletName = wData.name;
        const currentBalance = Number(wData.balance) || 0;

        // Jika 'receivable' (Orang pinjam ke saya / Talangan): Saldo wallet saya BERKURANG
        // Jika 'debt' (Saya pinjam uang dari orang): Saldo wallet saya BERTAMBAH
        const newBalance = type === 'receivable' ? currentBalance - numAmount : currentBalance + numAmount;

        transaction.update(wRef, {
          balance: newBalance,
          updatedAt: serverTimestamp(),
        });
      }
    }

    // Catat di koleksi debts
    transaction.set(newDebtRef, {
      uid,
      type,
      person: person.trim(),
      amount: numAmount,
      paidAmount: 0,
      note: note.trim(),
      walletId: walletId || null,
      walletName: walletName || null,
      dueDate: dueDate ? Timestamp.fromDate(new Date(dueDate)) : null,
      isPaid: false,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    // Catat ke transaksi agar terlihat di riwayat mutasi
    const categoryName = type === 'receivable' ? 'Piutang Dipinjamkan' : 'Tambah Pinjaman/Hutang';
    transaction.set(newTxRef, {
      uid,
      type: 'debt',
      category: categoryName,
      amount: numAmount,
      walletId: walletId || null,
      walletName: walletName || null,
      debtId: newDebtRef.id,
      debtPerson: person.trim(),
      debtType: type,
      isCashOut: type === 'receivable',
      note: note ? `${note} (${person.trim()})` : `Pencatatan ${type === 'receivable' ? 'piutang/talangan' : 'pinjaman'} ke ${person.trim()}`,
      date: serverTimestamp(),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    return { debtId: newDebtRef.id, txId: newTxRef.id };
  });
}

/**
 * Bayar atau Terima Pembayaran Hutang/Piutang (Bisa Cicil atau Lunas) secara Atomic:
 * - Update paidAmount dan isPaid di dokumen debts
 * - Update saldo wallet terkait secara real-time
 * - Buat catatan transaksi pembayaran
 */
export async function settleDebtAtomic(uid, {
  debtId,
  settleAmount,
  walletId,
  note = '',
  date = new Date(),
}) {
  const numSettle = Number(settleAmount);
  if (numSettle <= 0) throw new Error('Nominal pembayaran harus lebih besar dari 0');
  if (!walletId) throw new Error('Pilih wallet untuk transaksi pembayaran');

  const debtRef = doc(db, 'debts', debtId);
  const wRef    = doc(db, 'wallets', walletId);
  const newTxRef = doc(transactionsCol);

  return runTransaction(db, async (transaction) => {
    const debtDoc = await transaction.get(debtRef);
    const wDoc    = await transaction.get(wRef);

    if (!debtDoc.exists()) throw new Error('Data hutang/piutang tidak ditemukan');
    if (!wDoc.exists()) throw new Error('Wallet tidak ditemukan');

    const debtData = debtDoc.data();
    const wData    = wDoc.data();

    const totalAmount = Number(debtData.amount) || 0;
    const prevPaid    = Number(debtData.paidAmount) || 0;
    const remaining   = totalAmount - prevPaid;

    if (numSettle > remaining) {
      throw new Error(`Nominal melebihi sisa tanggungan (${remaining})`);
    }

    const newPaidAmount = prevPaid + numSettle;
    const isNowPaid = newPaidAmount >= totalAmount;

    // Update Saldo Wallet:
    // Jika type === 'debt' (Saya bayar hutang saya): Saldo wallet BERKURANG
    // Jika type === 'receivable' (Saya terima uang piutang): Saldo wallet BERTAMBAH
    const currentBalance = Number(wData.balance) || 0;
    const isPayingMyDebt = debtData.type === 'debt';
    const newBalance = isPayingMyDebt ? currentBalance - numSettle : currentBalance + numSettle;

    transaction.update(wRef, {
      balance: newBalance,
      updatedAt: serverTimestamp(),
    });

    // Update dokumen debt
    transaction.update(debtRef, {
      paidAmount: newPaidAmount,
      isPaid: isNowPaid,
      updatedAt: serverTimestamp(),
    });

    // Catat ke transaksi
    const txCategory = isPayingMyDebt ? 'Bayar Hutang' : 'Terima Bayaran Piutang';
    const finalNote = note.trim()
      ? `${note.trim()} (${debtData.person})`
      : `${isPayingMyDebt ? 'Bayar hutang' : 'Terima pembayaran piutang'} dari/ke ${debtData.person}${isNowPaid ? ' (Lunas)' : ' (Cicilan)'}`;

    transaction.set(newTxRef, {
      uid,
      type: 'debt',
      category: txCategory,
      amount: numSettle,
      walletId,
      walletName: wData.name,
      debtId,
      debtPerson: debtData.person,
      debtType: debtData.type,
      isCashOut: isPayingMyDebt,
      note: finalNote,
      date: Timestamp.fromDate(date instanceof Date ? date : new Date(date)),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    return { success: true, isPaid: isNowPaid, remaining: totalAmount - newPaidAmount };
  });
}

export async function deleteDebt(debtId) {
  return deleteDoc(doc(db, 'debts', debtId));
}

export { serverTimestamp, Timestamp };
