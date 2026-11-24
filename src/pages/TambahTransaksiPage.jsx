// src/pages/TambahTransaksiPage.jsx
// Add new transaction form (Income, Expense, Transfer)

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Check, ArrowDownUp } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { addTransaction, getWallets, transferBetweenWallets } from '../lib/firebase';
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES, formatRupiah } from '../lib/utils';
import { Timestamp } from 'firebase/firestore';
import WalletPicker from '../components/wallet/WalletPicker';

const TYPES = [
  { value: 'expense',  label: 'Pengeluaran', color: 'text-red-400',   activeBg: 'bg-red-500/10 border-red-500/30' },
  { value: 'income',   label: 'Pemasukan',   color: 'text-green-400', activeBg: 'bg-green-500/10 border-green-500/30' },
  { value: 'transfer', label: 'Transfer',    color: 'text-teal',      activeBg: 'bg-teal/10 border-teal/30' },
];

export default function TambahTransaksiPage() {
  const { user }     = useAuth();
  const navigate     = useNavigate();

  const [type,         setType]         = useState('expense');
  const [amount,       setAmount]       = useState('');
  const [category,     setCategory]     = useState('');
  const [note,         setNote]         = useState('');
  const [date,         setDate]         = useState(new Date().toISOString().split('T')[0]);
  const [walletId,     setWalletId]     = useState('');
  const [toWalletId,   setToWalletId]   = useState('');
  const [adminFee,     setAdminFee]     = useState('');
  const [wallets,      setWallets]      = useState([]);
  const [saving,       setSaving]       = useState(false);
  const [error,        setError]        = useState('');

  useEffect(() => {
    if (!user) return;
    getWallets(user.uid).then((wList) => {
      setWallets(wList);
      if (wList.length > 0) {
        const defaultW = wList.find(w => w.isDefault) || wList[0];
        setWalletId(defaultW.id);
        const secondW = wList.find(w => w.id !== defaultW.id);
        if (secondW) setToWalletId(secondW.id);
      }
    });
  }, [user]);

  const categories = type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;

  const handleAmountChange = (e) => {
    const raw = e.target.value.replace(/\D/g, '');
    setAmount(raw);
  };

  const handleAdminFeeChange = (e) => {
    const raw = e.target.value.replace(/\D/g, '');
    setAdminFee(raw);
  };

  const formatDisplayAmount = (raw) => {
    if (!raw) return '';
    return new Intl.NumberFormat('id-ID').format(parseInt(raw, 10));
  };

  const handleSave = async () => {
    const numAmount = parseInt(amount, 10) || 0;
    if (numAmount <= 0) { setError('Masukkan nominal yang valid'); return; }

    // If type is Transfer
    if (type === 'transfer') {
      if (!walletId) { setError('Pilih wallet asal'); return; }
      if (!toWalletId) { setError('Pilih wallet tujuan'); return; }
      if (walletId === toWalletId) { setError('Wallet asal dan tujuan tidak boleh sama'); return; }

      const fromW = wallets.find(w => w.id === walletId);
      const toW   = wallets.find(w => w.id === toWalletId);
      const numAdmin = parseInt(adminFee, 10) || 0;

      setError('');
      setSaving(true);
      try {
        await transferBetweenWallets(user.uid, {
          fromWalletId: walletId,
          toWalletId: toWalletId,
          fromWalletName: fromW?.name || '',
          toWalletName: toW?.name || '',
          amount: numAmount,
          adminFee: numAdmin,
          date: new Date(date),
          note,
        });
        navigate(-1);
      } catch (err) {
        setError(err.message || 'Gagal melakukan transfer');
        console.error(err);
      } finally {
        setSaving(false);
      }
      return;
    }

    // Normal Income / Expense
    if (!category) { setError('Pilih kategori terlebih dahulu'); return; }

    setError('');
    setSaving(true);
    try {
      await addTransaction(user.uid, {
        type,
        amount:   numAmount,
        category,
        note,
        date:     Timestamp.fromDate(new Date(date)),
        walletId: walletId || '',
      });
      navigate(-1);
    } catch (err) {
      setError('Gagal menyimpan transaksi. Coba lagi.');
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const fromWallet = wallets.find(w => w.id === walletId);
  const toWallet   = wallets.find(w => w.id === toWalletId);

  return (
    <div className="min-h-screen bg-bg px-4 pt-12 pb-8 max-w-lg mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <button onClick={() => navigate(-1)} className="w-9 h-9 bg-surface rounded-xl flex items-center justify-center border border-white/5">
          <X size={18} className="text-muted" />
        </button>
        <h1 className="text-white font-bold text-lg">
          {type === 'transfer' ? 'Transfer Saldo' : 'Tambah Transaksi'}
        </h1>
        <button
          onClick={handleSave}
          disabled={saving}
          className="w-9 h-9 bg-teal rounded-xl flex items-center justify-center shadow-md shadow-teal/30 disabled:opacity-50 active:scale-95 transition-transform"
        >
          <Check size={18} className="text-bg stroke-[2.5]" />
        </button>
      </div>

      {/* Type Tabs */}
      <div className="flex gap-2 mb-6">
        {TYPES.map(t => (
          <button
            key={t.value}
            onClick={() => { setType(t.value); setCategory(''); }}
            className={`flex-1 py-2.5 rounded-xl text-xs font-semibold border transition-all duration-150
              ${type === t.value
                ? `${t.activeBg} ${t.color}`
                : 'bg-surface border-white/5 text-muted'
              }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Amount Input */}
      <div className="bg-surface rounded-2xl p-5 border border-white/5 mb-4">
        <p className="text-muted text-xs mb-2">Nominal</p>
        <div className="flex items-center gap-2">
          <span className="text-white/40 text-xl font-bold">Rp</span>
          <input
            inputMode="numeric"
            value={formatDisplayAmount(amount)}
            onChange={handleAmountChange}
            placeholder="0"
            className="flex-1 bg-transparent text-white text-3xl font-bold outline-none placeholder:text-white/10"
          />
        </div>
      </div>

      {/* If Transfer: Wallet Asal & Tujuan */}
      {type === 'transfer' ? (
        <div className="bg-surface rounded-2xl p-4 border border-bline mb-4 space-y-3">
          <WalletPicker
            label="Dari Wallet (Asal)"
            wallets={wallets}
            value={walletId}
            onChange={setWalletId}
            placeholder="Pilih Wallet Asal"
          />

          <WalletPicker
            label="Ke Wallet (Tujuan)"
            wallets={wallets}
            value={toWalletId}
            onChange={setToWalletId}
            disabledId={walletId}
            placeholder="Pilih Wallet Tujuan"
          />

          <div>
            <label className="text-muted text-xs block mb-1">Biaya Admin (Opsional)</label>
            <div className="flex items-center gap-2 bg-bg border border-bline rounded-xl px-3 py-2">
              <span className="text-muted text-xs font-bold">Rp</span>
              <input
                inputMode="numeric"
                value={formatDisplayAmount(adminFee)}
                onChange={handleAdminFeeChange}
                placeholder="0"
                className="bg-transparent text-main text-xs outline-none flex-1"
              />
            </div>
          </div>
        </div>
      ) : (
        /* Category selection for Income/Expense */
        <>
          {/* Wallet account option */}
          {wallets.length > 0 && (
            <div className="bg-surface rounded-2xl p-4 border border-bline mb-4">
              <WalletPicker
                label="Pilih Wallet"
                wallets={wallets}
                value={walletId}
                onChange={setWalletId}
                placeholder="Pilih Wallet"
              />
            </div>
          )}

          <div className="bg-surface rounded-2xl p-4 border border-white/5 mb-4">
            <p className="text-muted text-xs mb-3">Kategori</p>
            <div className="flex flex-wrap gap-2">
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setCategory(cat)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all duration-100
                    ${category === cat
                      ? 'bg-teal/20 text-teal border-teal/30'
                      : 'bg-white/5 text-muted border-white/5 hover:border-white/10'
                    }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Date */}
      <div className="bg-surface rounded-2xl p-4 border border-white/5 mb-4">
        <p className="text-muted text-xs mb-2">Tanggal</p>
        <input
          type="date"
          value={date}
          onChange={e => setDate(e.target.value)}
          className="bg-transparent text-white text-sm outline-none w-full"
          style={{ colorScheme: 'dark' }}
        />
      </div>

      {/* Note */}
      <div className="bg-surface rounded-2xl p-4 border border-white/5 mb-4">
        <p className="text-muted text-xs mb-2">Catatan (opsional)</p>
        <input
          value={note}
          onChange={e => setNote(e.target.value)}
          placeholder="Tambah catatan…"
          className="bg-transparent text-white text-sm outline-none w-full placeholder:text-muted"
        />
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 mb-4">
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}

      {/* Save Button */}
      <button
        onClick={handleSave}
        disabled={saving}
        className="w-full bg-teal hover:bg-teal/90 active:bg-teal/80 text-bg font-bold py-4 rounded-2xl shadow-lg shadow-teal/30 transition-all disabled:opacity-50"
      >
        {saving ? 'Menyimpan…' : type === 'transfer' ? 'Kirim Transfer' : 'Simpan Transaksi'}
      </button>
    </div>
  );
}
