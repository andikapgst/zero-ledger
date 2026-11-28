// src/pages/HomePage.jsx
// Dashboard: Balance of All Wallets + Eye Toggle, Theme Toggle, Monthly In/Out, Quick Shortcuts,
// "Needs Attention" Alerts, and 5 Recent Transactions (English UI)

import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Eye,
  EyeOff,
  TrendingUp,
  TrendingDown,
  ArrowRight,
  Landmark,
  PieChart,
  HandCoins,
  Target,
  AlertTriangle,
  Clock,
  ChevronRight,
  AlertCircle,
  PiggyBank,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useTransactionModal } from '../contexts/TransactionModalContext';
import { getWallets, getTransactions, getDebts, getBudgets, subscribeWallets } from '../lib/firebase';
import { formatRupiah, formatDate, getYearMonth, SAVINGS_TARGET_CATEGORIES } from '../lib/utils';
import { toIdr, getStoredUsdRate, fetchLiveUsdRate } from '../lib/currency';
import CategoryIcon from '../components/transaction/CategoryIcon';
import EditTransactionModal from '../components/transaction/EditTransactionModal';
import ThemeToggle from '../components/layout/ThemeToggle';

export default function HomePage() {
  const { user, displayName, photoURL } = useAuth();
  const { openModal, refreshTrigger } = useTransactionModal();
  const navigate = useNavigate();

  const [wallets,      setWallets]      = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [debts,        setDebts]        = useState([]);
  const [budgets,      setBudgets]      = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [hideBalance,  setHideBalance]  = useState(
    () => localStorage.getItem('zl_hide_balance_default') === 'true'
  );
  const [usdRate,      setUsdRate]      = useState(() => getStoredUsdRate());
  const [editingTx,    setEditingTx]    = useState(null);

  const currentYearMonth = getYearMonth(new Date());

  useEffect(() => {
    fetchLiveUsdRate().then(setUsdRate);
  }, []);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    // Live real-time wallet balance subscription
    const unsubWallets = subscribeWallets(
      user.uid,
      (wList) => setWallets(wList),
      (err) => console.error('HomePage live wallets error:', err)
    );

    // Fetch dashboard records with resilient allSettled
    Promise.allSettled([
      getWallets(user.uid),
      getTransactions(user.uid, { limitCount: 200 }),
      getDebts(user.uid),
      getBudgets(user.uid, currentYearMonth),
    ]).then(([wRes, txRes, dRes, bRes]) => {
      if (wRes.status === 'fulfilled') setWallets(wRes.value);
      if (txRes.status === 'fulfilled') setTransactions(txRes.value);
      if (dRes.status === 'fulfilled') setDebts(dRes.value);
      if (bRes.status === 'fulfilled') setBudgets(bRes.value);
      setLoading(false);
    });

    return () => {
      unsubWallets();
    };
  }, [user, refreshTrigger, currentYearMonth]);

  // Total balance of all wallets (converting USD wallets to IDR)
  const totalBalance = wallets.reduce((s, w) => s + toIdr(w.balance, w.currency, usdRate), 0);

  // Month transactions (current month)
  const currentMonthTxs = useMemo(() => {
    return transactions.filter(t => getYearMonth(t.date) === currentYearMonth);
  }, [transactions, currentYearMonth]);

  // Income & Expense summary for current month
  const incomeMonth = useMemo(() => {
    return currentMonthTxs
      .filter(t => t.type === 'income')
      .reduce((s, t) => s + (Number(t.amount) || 0), 0);
  }, [currentMonthTxs]);

  const expenseMonth = useMemo(() => {
    return currentMonthTxs
      .filter(t => t.type === 'expense' || t.type === 'savings')
      .reduce((s, t) => s + (Number(t.amount) || 0), 0);
  }, [currentMonthTxs]);

  // Separate Savings summary (all transactions in savings type or savings categories)
  const { totalSavings, savingsMonth } = useMemo(() => {
    const savingCategoryNames = new Set([
      ...SAVINGS_TARGET_CATEGORIES.map(c => c.name),
      'Tabungan Nikah',
      'Tabungan Dika & Diana',
      'Simpanan Darurat',
      'Investasi Kripto',
    ]);
    const isSavingsTx = (t) =>
      t.type === 'savings' || (t.type === 'expense' && savingCategoryNames.has(t.category));

    const total = transactions
      .filter(isSavingsTx)
      .reduce((s, t) => s + (Number(t.amount) || 0), 0);

    const month = currentMonthTxs
      .filter(isSavingsTx)
      .reduce((s, t) => s + (Number(t.amount) || 0), 0);

    return { totalSavings: total, savingsMonth: month };
  }, [transactions, currentMonthTxs]);

  // ── "Needs Attention" Alerts ─────────────────────────────────
  const attentionItems = useMemo(() => {
    const items = [];

    const spendingMap = {};
    currentMonthTxs.forEach(tx => {
      if (tx.type === 'expense' || tx.type === 'savings') {
        const cat = tx.category || 'Other';
        spendingMap[cat] = (spendingMap[cat] || 0) + (Number(tx.amount) || 0);
      }
    });

    budgets.forEach(b => {
      const limit = Number(b.limit) || 0;
      if (limit > 0) {
        const spent = spendingMap[b.category] || 0;
        const pct = (spent / limit) * 100;
        if (pct >= 80) {
          const isOver = pct > 100;
          items.push({
            id: `budget-${b.id}`,
            type: 'budget',
            title: b.category,
            subtitle: isOver
              ? `Exceeded budget by ${pct.toFixed(0)}% (Over ${formatRupiah(spent - limit)})`
              : `Approaching limit ${pct.toFixed(0)}% (Spent ${formatRupiah(spent)} of ${formatRupiah(limit)})`,
            isDanger: isOver,
            link: '/budget',
          });
        }
      }
    });

    // Unpaid receivables
    debts
      .filter(d => d.type === 'receivable' && !d.isPaid)
      .forEach(d => {
        const remaining = Math.max(0, (Number(d.amount) || 0) - (Number(d.paidAmount) || 0));
        if (remaining > 0) {
          items.push({
            id: `debt-${d.id}`,
            type: 'receivable',
            title: `Receivable: ${d.person}`,
            subtitle: `Uncollected: ${formatRupiah(remaining)}${d.note ? ` ("${d.note}")` : ''}`,
            isDanger: false,
            link: '/hutang',
          });
        }
      });

    return items;
  }, [budgets, currentMonthTxs, debts]);

  // 5 Recent Transactions
  const recentTransactions = useMemo(() => {
    return transactions.slice(0, 5);
  }, [transactions]);

  const fullName = displayName || user?.displayName || 'Hello';
  const firstName = fullName.split(' ')[0] || 'Hello';
  const userInitials = fullName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map(w => w[0].toUpperCase())
    .join('') || 'ZL';

  return (
    <div className="px-4 pt-12 pb-8 space-y-6 max-w-lg mx-auto">
      {/* ── Top Header with Profile & Theme Switcher ────────────── */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/profile')}
          className="flex items-center gap-3 text-left group cursor-pointer"
          title="View Profile & Settings"
        >
          {(photoURL || user?.photoURL) ? (
            <img
              src={photoURL || user.photoURL}
              alt={fullName}
              referrerPolicy="no-referrer"
              className="w-10 h-10 rounded-full object-cover border-2 border-teal/40 group-hover:border-teal transition-colors shrink-0"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-teal/15 border-2 border-teal/40 group-hover:border-teal flex items-center justify-center text-teal font-bold text-sm transition-colors shrink-0">
              {userInitials}
            </div>
          )}
          <div>
            <p className="text-muted text-xs">Welcome back 👋</p>
            <h1 className="text-main font-bold text-xl group-hover:text-teal transition-colors">{firstName}</h1>
          </div>
        </button>
        <div className="flex items-center gap-2">
          {/* Light / Dark Mode Toggle */}
          <ThemeToggle />
          <button
            onClick={() => navigate('/wallet')}
            className="px-3 py-1.5 rounded-xl bg-surface hover:bg-white/5 border border-white/10 text-xs text-muted hover:text-white flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Landmark size={14} className="text-teal" />
            <span>Wallets</span>
          </button>
        </div>
      </div>

      {/* ── 1. MAIN CARD: TOTAL BALANCE OF ALL WALLETS ─────────── */}
      <div className="bg-gradient-to-br from-[#121A1E] via-[#0f171b] to-[#122324] border border-teal/20 rounded-3xl p-6 relative overflow-hidden shadow-xl">
        <div className="absolute -right-8 -top-8 w-36 h-36 bg-teal/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex items-center justify-between mb-1">
          <p className="text-muted text-xs uppercase tracking-wider font-semibold">
            Total Balance
          </p>
          <button
            onClick={() => setHideBalance(h => !h)}
            className="text-muted hover:text-white transition-colors p-1 cursor-pointer"
            title={hideBalance ? 'Show Balance' : 'Hide Balance'}
          >
            {hideBalance ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>

        <p className="text-white text-3xl sm:text-4xl font-extrabold tracking-tight mt-1">
          {hideBalance ? '• • • • • • •' : formatRupiah(totalBalance)}
        </p>

        <div className="flex items-center justify-between text-xs mt-4 pt-3 border-t border-white/5">
          <span className="text-muted text-[11px]">{wallets.length} active wallets</span>
          <button
            onClick={() => navigate('/wallet')}
            className="text-teal text-[11px] font-semibold hover:underline flex items-center gap-0.5 cursor-pointer"
          >
            Asset Breakdown <ChevronRight size={13} />
          </button>
        </div>
      </div>

      {/* ── 2. MONTHLY INCOME & EXPENSE SUMMARY ───────────────── */}
      <div className="grid grid-cols-2 gap-3">
        {/* Income */}
        <div className="bg-surface rounded-2xl p-4 border border-white/5">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-xl bg-green-500/10 flex items-center justify-center text-green-400">
              <TrendingUp size={16} />
            </div>
            <span className="text-muted text-xs font-medium">Income</span>
          </div>
          <p className="text-white font-bold text-base truncate">
            {hideBalance ? '••••••' : formatRupiah(incomeMonth)}
          </p>
          <p className="text-muted/60 text-[10px] mt-0.5">This month</p>
        </div>

        {/* Expense */}
        <div className="bg-surface rounded-2xl p-4 border border-white/5">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-xl bg-red-500/10 flex items-center justify-center text-red-400">
              <TrendingDown size={16} />
            </div>
            <span className="text-muted text-xs font-medium">Expense</span>
          </div>
          <p className="text-white font-bold text-base truncate">
            {hideBalance ? '••••••' : formatRupiah(expenseMonth)}
          </p>
          <p className="text-muted/60 text-[10px] mt-0.5">This month</p>
        </div>
      </div>

      {/* ── 2B. SEPARATE TOTAL SAVINGS CARD ────────────────────── */}
      <div className="bg-surface rounded-2xl p-4 border border-teal/20 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-teal/15 flex items-center justify-center text-teal shrink-0">
            <PiggyBank size={20} />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-muted text-xs font-medium">Total Savings</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-teal/10 text-teal font-semibold">
                {hideBalance ? '••••' : `+${formatRupiah(savingsMonth, { compact: true })} this mo`}
              </span>
            </div>
            <p className="text-main font-bold text-lg truncate mt-0.5">
              {hideBalance ? '••••••' : formatRupiah(totalSavings)}
            </p>
          </div>
        </div>
        <button
          onClick={() => openModal('savings')}
          className="px-3 py-1.5 rounded-xl bg-teal/10 hover:bg-teal/20 text-teal text-xs font-semibold shrink-0 transition-colors cursor-pointer"
        >
          + Save
        </button>
      </div>

      {/* ── 3. QUICK SHORTCUTS (BUDGET, HUTANG, TARGET, WALLET) ── */}
      <div>
        <h2 className="text-muted font-semibold text-xs uppercase tracking-wider mb-2.5">
          Quick Shortcuts
        </h2>
        <div className="grid grid-cols-4 gap-2.5">
          {[
            {
              label: 'Budget',
              icon: PieChart,
              action: () => navigate('/budget'),
              color: 'text-purple-600 dark:text-purple-400',
              bg: 'bg-purple-500/10 dark:bg-purple-500/15',
              border: 'border-purple-500/20 dark:border-purple-500/30',
            },
            {
              label: 'Debts',
              icon: HandCoins,
              action: () => navigate('/hutang'),
              color: 'text-amber-600 dark:text-amber-400',
              bg: 'bg-amber-500/10 dark:bg-amber-500/15',
              border: 'border-amber-500/20 dark:border-amber-500/30',
            },
            {
              label: 'Goals',
              icon: Target,
              action: () => openModal('savings'),
              color: 'text-teal dark:text-teal',
              bg: 'bg-teal/10 dark:bg-teal/15',
              border: 'border-teal/20 dark:border-teal/30',
            },
            {
              label: 'Wallets',
              icon: Landmark,
              action: () => navigate('/wallet'),
              color: 'text-sky-600 dark:text-sky-400',
              bg: 'bg-sky-500/10 dark:bg-sky-500/15',
              border: 'border-sky-500/20 dark:border-sky-500/30',
            },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.label}
                onClick={item.action}
                className={`bg-surface hover:bg-subcard active:scale-95 border ${item.border} rounded-2xl p-3 flex flex-col items-center justify-center gap-1.5 transition-all shadow-sm cursor-pointer`}
              >
                <div className={`w-9 h-9 rounded-xl ${item.bg} flex items-center justify-center ${item.color}`}>
                  <Icon size={18} />
                </div>
                <span className="text-[11px] font-bold text-main">{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── 4. "NEEDS ATTENTION" ALERTS SECTION ────────────────── */}
      {attentionItems.length > 0 && (
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <h2 className="text-main text-sm font-semibold flex items-center gap-1.5">
              <AlertCircle size={15} className="text-amber-500 dark:text-amber-400" />
              Needs Attention ({attentionItems.length})
            </h2>
            <span className="text-[11px] text-muted">Budget & Receivables</span>
          </div>

          <div className="space-y-2">
            {attentionItems.map((item) => (
              <div
                key={item.id}
                onClick={() => navigate(item.link)}
                className={`p-3.5 rounded-2xl border cursor-pointer transition-all flex items-center justify-between gap-3 ${
                  item.isDanger
                    ? 'bg-red-500/[0.06] border-red-500/30 hover:border-red-500/50'
                    : 'bg-amber-500/[0.05] border-amber-500/25 hover:border-amber-500/40'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                      item.isDanger
                        ? 'bg-red-500/15 text-red-600 dark:text-red-400'
                        : 'bg-amber-500/15 text-amber-600 dark:text-amber-400'
                    }`}
                  >
                    {item.type === 'budget' ? (
                      <AlertTriangle size={18} />
                    ) : (
                      <Clock size={18} />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-main truncate">{item.title}</p>
                    <p className={`text-[11px] truncate mt-0.5 ${
                      item.isDanger ? 'text-red-600 dark:text-red-300' : 'text-amber-700 dark:text-amber-200/90'
                    }`}>
                      {item.subtitle}
                    </p>
                  </div>
                </div>

                <ChevronRight size={16} className="text-muted shrink-0" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── 5. 5 RECENT TRANSACTIONS ───────────────────────────── */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-white font-semibold text-sm">Recent Transactions</h2>
          <button
            onClick={() => navigate('/transaksi')}
            className="flex items-center gap-1 text-teal text-xs hover:opacity-80 transition-opacity font-medium cursor-pointer"
          >
            View all ({transactions.length}) <ArrowRight size={13} />
          </button>
        </div>

        {loading ? (
          <div className="space-y-2">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-surface rounded-2xl p-3.5 border border-white/5 animate-pulse h-16" />
            ))}
          </div>
        ) : recentTransactions.length === 0 ? (
          <div className="bg-surface rounded-3xl p-8 border border-white/5 text-center">
            <p className="text-3xl mb-2">📋</p>
            <p className="text-white font-semibold text-xs">No transactions recorded</p>
            <p className="text-muted text-[11px] mt-0.5">Tap the + button below to add your first transaction</p>
          </div>
        ) : (
          <div className="space-y-2">
            {recentTransactions.map(tx => (
              <RecentTransactionRow
                key={tx.id}
                tx={tx}
                hideBalance={hideBalance}
                onClick={() => setEditingTx(tx)}
              />
            ))}
          </div>
        )}
      </div>

      <EditTransactionModal
        isOpen={Boolean(editingTx)}
        onClose={() => setEditingTx(null)}
        transaction={editingTx}
        onSaved={() => {
          if (user) {
            getTransactions(user.uid, { limitCount: 200 }).then(setTransactions).catch(console.error);
          }
        }}
      />
    </div>
  );
}

function RecentTransactionRow({ tx, hideBalance, onClick }) {
  const isIncome   = tx.type === 'income';
  const isTransfer = tx.type === 'transfer';
  const isSavings  = tx.type === 'savings';
  const isDebt     = tx.type === 'debt';

  let sign = '-';
  let amountClass = 'text-red-400';
  if (isIncome) {
    sign = '+';
    amountClass = 'text-green-400';
  } else if (isTransfer) {
    sign = '';
    amountClass = 'text-teal';
  } else if (isSavings) {
    sign = '-';
    amountClass = 'text-purple-400';
  } else if (isDebt) {
    sign = tx.isCashOut ? '-' : '+';
    amountClass = tx.isCashOut ? 'text-amber-400' : 'text-green-400';
  }

  return (
    <div
      onClick={onClick}
      className="bg-surface rounded-2xl p-3.5 border border-white/5 flex items-center gap-3 hover:bg-white/[0.04] active:bg-white/[0.06] transition-colors cursor-pointer"
    >
      <div className="w-10 h-10 rounded-2xl bg-white/5 flex items-center justify-center shrink-0 border border-white/5">
        <CategoryIcon category={tx.category} size={18} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <p className="text-white text-xs font-semibold truncate">{tx.category}</p>
          {isTransfer && (
            <span className="px-1.5 py-0.2 rounded bg-teal/20 text-teal text-[9px] font-semibold">
              Transfer
            </span>
          )}
        </div>
        <p className="text-muted text-[11px] truncate mt-0.5">
          {tx.walletName ? `${tx.walletName} · ` : ''}
          {tx.note || formatDate(tx.date, 'day-month')}
        </p>
      </div>
      <span className={`text-xs sm:text-sm font-bold shrink-0 ${amountClass}`}>
        {hideBalance ? '•••' : `${sign}${formatRupiah(tx.amount)}`}
      </span>
    </div>
  );
}
