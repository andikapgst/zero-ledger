// src/pages/TransaksiPage.jsx
// Transactions page: Month filter, search, Type/Wallet/Category filters, monthly summary, and grouped date items (English UI)

import { useEffect, useState, useMemo } from 'react';
import {
  Search,
  ChevronLeft,
  ChevronRight,
  TrendingDown,
  TrendingUp,
  Filter,
  Calendar,
  X,
  SlidersHorizontal,
  Plus,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useTransactionModal } from '../contexts/TransactionModalContext';
import { getTransactions, getWallets } from '../lib/firebase';
import {
  formatRupiah,
  formatDate,
  getYearMonth,
} from '../lib/utils';
import CategoryIcon from '../components/transaction/CategoryIcon';
import WalletLogo from '../components/wallet/WalletLogo';
import ThemeToggle from '../components/layout/ThemeToggle';

export default function TransaksiPage() {
  const { user } = useAuth();
  const { openModal, refreshTrigger } = useTransactionModal();

  const [allTransactions, setAllTransactions] = useState([]);
  const [wallets, setWallets]                 = useState([]);
  const [loading, setLoading]                 = useState(true);

  // Month navigation
  const [selectedDate, setSelectedDate]       = useState(new Date());

  // Search & Filters
  const [searchQuery, setSearchQuery]         = useState('');
  const [selectedType, setSelectedType]       = useState('all'); // 'all' | 'expense' | 'income' | 'transfer' | 'savings' | 'debt'
  const [selectedWallet, setSelectedWallet]   = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showFilterDrawer, setShowFilterDrawer] = useState(false);

  const currentYearMonth = getYearMonth(selectedDate);

  const fetchData = async () => {
    if (!user) return;
    try {
      setLoading(true);
      const [txs, wList] = await Promise.all([
        getTransactions(user.uid, { limitCount: 300 }),
        getWallets(user.uid),
      ]);
      setAllTransactions(txs);
      setWallets(wList);
    } catch (err) {
      console.error('Error fetching transactions:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user, refreshTrigger]);

  const handlePrevMonth = () => {
    setSelectedDate(prev => {
      const d = new Date(prev);
      d.setMonth(d.getMonth() - 1);
      return d;
    });
  };

  const handleNextMonth = () => {
    setSelectedDate(prev => {
      const d = new Date(prev);
      d.setMonth(d.getMonth() + 1);
      return d;
    });
  };

  const monthDisplayLabel = formatDate(selectedDate, 'month-short');

  const monthlyTransactions = useMemo(() => {
    return allTransactions.filter(tx => {
      const ym = getYearMonth(tx.date);
      return ym === currentYearMonth;
    });
  }, [allTransactions, currentYearMonth]);

  const monthlySummary = useMemo(() => {
    let income = 0;
    let expense = 0;

    monthlyTransactions.forEach(tx => {
      const amt = Number(tx.amount) || 0;
      if (tx.type === 'income') {
        income += amt;
      } else if (tx.type === 'expense' || tx.type === 'savings') {
        expense += amt;
      } else if (tx.type === 'debt') {
        if (tx.isCashOut) expense += amt;
        else income += amt;
      }
    });

    return {
      income,
      expense,
      net: income - expense,
    };
  }, [monthlyTransactions]);

  const filteredTransactions = useMemo(() => {
    return monthlyTransactions.filter(tx => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const noteMatch = tx.note && tx.note.toLowerCase().includes(q);
        const catMatch = tx.category && tx.category.toLowerCase().includes(q);
        const walletMatch = tx.walletName && tx.walletName.toLowerCase().includes(q);
        const debtMatch = tx.debtPerson && tx.debtPerson.toLowerCase().includes(q);
        if (!noteMatch && !catMatch && !walletMatch && !debtMatch) return false;
      }

      if (selectedType !== 'all') {
        if (selectedType === 'expense' && tx.type !== 'expense') return false;
        if (selectedType === 'income' && tx.type !== 'income') return false;
        if (selectedType === 'transfer' && tx.type !== 'transfer') return false;
        if (selectedType === 'savings' && tx.type !== 'savings') return false;
        if (selectedType === 'debt' && tx.type !== 'debt') return false;
      }

      if (selectedWallet !== 'all') {
        if (tx.walletId !== selectedWallet && tx.toWalletId !== selectedWallet) {
          return false;
        }
      }

      if (selectedCategory !== 'all') {
        if (tx.category !== selectedCategory) return false;
      }

      return true;
    });
  }, [monthlyTransactions, searchQuery, selectedType, selectedWallet, selectedCategory]);

  const groupedByDate = useMemo(() => {
    const groups = {};

    filteredTransactions.forEach(tx => {
      const d = tx.date?.toDate ? tx.date.toDate() : new Date(tx.date);
      const dateKey = !isNaN(d.getTime()) ? d.toISOString().split('T')[0] : 'Other';

      if (!groups[dateKey]) {
        groups[dateKey] = {
          date: d,
          dateKey,
          items: [],
          dailyTotal: 0,
        };
      }
      groups[dateKey].items.push(tx);

      const amt = Number(tx.amount) || 0;
      if (tx.type === 'income') groups[dateKey].dailyTotal += amt;
      else if (tx.type === 'expense' || tx.type === 'savings') groups[dateKey].dailyTotal -= amt;
    });

    return Object.values(groups).sort((a, b) => b.dateKey.localeCompare(a.dateKey));
  }, [filteredTransactions]);

  const availableCategories = useMemo(() => {
    const set = new Set();
    monthlyTransactions.forEach(t => {
      if (t.category) set.add(t.category);
    });
    return Array.from(set);
  }, [monthlyTransactions]);

  const activeFilterCount =
    (selectedType !== 'all' ? 1 : 0) +
    (selectedWallet !== 'all' ? 1 : 0) +
    (selectedCategory !== 'all' ? 1 : 0);

  const resetFilters = () => {
    setSelectedType('all');
    setSelectedWallet('all');
    setSelectedCategory('all');
    setSearchQuery('');
  };

  return (
    <div className="px-4 pt-12 pb-8 max-w-lg mx-auto space-y-5">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-white text-xl font-bold">Transaction History</h1>
          <p className="text-muted text-xs">All expenses, income & transfers</p>
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <button
            onClick={() => openModal('expense')}
            className="w-9 h-9 bg-teal hover:bg-teal/90 active:scale-95 rounded-xl flex items-center justify-center shadow-md shadow-teal/30 transition-all text-bg cursor-pointer"
            title="Add Transaction"
          >
            <Plus size={20} className="stroke-[2.5]" />
          </button>
        </div>
      </div>

      {/* ── 1. MONTH SELECTOR & SUMMARY CARD ───────────────────── */}
      <div className="bg-gradient-to-br from-[#121A1E] via-[#0f171b] to-[#122324] border border-white/10 rounded-3xl p-5 shadow-xl relative overflow-hidden">
        {/* Month Selector Carousel */}
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-white/5">
          <button
            onClick={handlePrevMonth}
            className="w-8 h-8 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center text-muted hover:text-white transition-colors cursor-pointer"
          >
            <ChevronLeft size={18} />
          </button>
          <div className="text-center">
            <span className="text-white text-base font-bold tracking-tight">
              {formatDate(selectedDate, 'month')}
            </span>
            <span className="block text-[10px] text-muted uppercase tracking-wider">
              {monthDisplayLabel}
            </span>
          </div>
          <button
            onClick={handleNextMonth}
            className="w-8 h-8 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center text-muted hover:text-white transition-colors cursor-pointer"
          >
            <ChevronRight size={18} />
          </button>
        </div>

        {/* Monthly In & Out Summary */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white/[0.03] border border-white/5 rounded-2xl p-3 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-green-500/10 flex items-center justify-center text-green-400 shrink-0">
              <TrendingUp size={18} />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] text-muted">Total Income</p>
              <p className="text-sm font-bold text-green-400 truncate">
                {formatRupiah(monthlySummary.income)}
              </p>
            </div>
          </div>

          <div className="bg-white/[0.03] border border-white/5 rounded-2xl p-3 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-red-500/10 flex items-center justify-center text-red-400 shrink-0">
              <TrendingDown size={18} />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] text-muted">Total Expense</p>
              <p className="text-sm font-bold text-red-400 truncate">
                {formatRupiah(monthlySummary.expense)}
              </p>
            </div>
          </div>
        </div>

        {/* Net Flow */}
        <div className="mt-3 pt-2.5 border-t border-white/5 flex items-center justify-between text-xs">
          <span className="text-muted text-[11px]">Net Cash Flow:</span>
          <span
            className={`font-semibold ${
              monthlySummary.net >= 0 ? 'text-teal' : 'text-red-400'
            }`}
          >
            {formatRupiah(monthlySummary.net, { showSign: true })}
          </span>
        </div>
      </div>

      {/* ── 2. SEARCH BAR & FILTER BUTTON ──────────────────────── */}
      <div className="flex items-center gap-2">
        <div className="flex-1 flex items-center gap-2 bg-surface rounded-2xl px-3.5 py-2.5 border border-white/5 focus-within:border-teal/50 transition-colors">
          <Search size={16} className="text-muted shrink-0" />
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search notes, category, wallet..."
            className="flex-1 bg-transparent text-white text-xs placeholder:text-muted outline-none"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="text-muted hover:text-white"
            >
              <X size={14} />
            </button>
          )}
        </div>

        <button
          onClick={() => setShowFilterDrawer(prev => !prev)}
          className={`h-10 px-3.5 rounded-2xl border flex items-center gap-1.5 text-xs font-semibold transition-all shrink-0 cursor-pointer ${
            activeFilterCount > 0
              ? 'bg-teal/15 border-teal/40 text-teal'
              : 'bg-surface border-white/5 text-muted hover:text-white hover:border-white/10'
          }`}
        >
          <SlidersHorizontal size={15} />
          <span>Filter</span>
          {activeFilterCount > 0 && (
            <span className="w-4 h-4 rounded-full bg-teal text-bg text-[10px] flex items-center justify-center font-bold">
              {activeFilterCount}
            </span>
          )}
        </button>
      </div>

      {/* ── 3. FILTER DRAWER ───────────────────────────────────── */}
      {showFilterDrawer && (
        <div className="bg-surface rounded-3xl p-4 border border-white/10 space-y-3.5 animate-in fade-in duration-150">
          <div className="flex items-center justify-between pb-2 border-b border-white/5">
            <span className="text-white text-xs font-bold flex items-center gap-1.5">
              <Filter size={13} className="text-teal" /> Filter Transactions
            </span>
            {activeFilterCount > 0 && (
              <button
                onClick={resetFilters}
                className="text-[11px] text-teal hover:underline font-medium cursor-pointer"
              >
                Reset Filters
              </button>
            )}
          </div>

          {/* Type Filter */}
          <div>
            <label className="text-[10px] text-muted font-medium block mb-1.5 uppercase tracking-wider">
              Type
            </label>
            <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide text-xs">
              {[
                { id: 'all',      label: 'All' },
                { id: 'expense',  label: 'Expense' },
                { id: 'income',   label: 'Income' },
                { id: 'transfer', label: 'Transfer' },
                { id: 'savings',  label: 'Savings' },
                { id: 'debt',     label: 'Debts' },
              ].map(t => (
                <button
                  key={t.id}
                  onClick={() => setSelectedType(t.id)}
                  className={`px-3 py-1.5 rounded-xl font-medium shrink-0 transition-all cursor-pointer ${
                    selectedType === t.id
                      ? 'bg-teal text-bg font-bold shadow-sm shadow-teal/30'
                      : 'bg-bg text-muted border border-white/5 hover:text-white'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Wallet Filter */}
          <div>
            <label className="text-[10px] text-muted font-medium block mb-1.5 uppercase tracking-wider">
              Wallet
            </label>
            <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide text-xs">
              <button
                onClick={() => setSelectedWallet('all')}
                className={`px-3 py-1.5 rounded-xl font-medium shrink-0 transition-all cursor-pointer ${
                  selectedWallet === 'all'
                    ? 'bg-teal text-bg font-bold shadow-sm shadow-teal/30'
                    : 'bg-bg text-muted border border-white/5 hover:text-white'
                }`}
              >
                All Wallets
              </button>
              {wallets.map(w => (
                <button
                  key={w.id}
                  onClick={() => setSelectedWallet(w.id)}
                  className={`px-3 py-1.5 rounded-xl font-medium shrink-0 transition-all cursor-pointer flex items-center gap-1.5 ${
                    selectedWallet === w.id
                      ? 'bg-teal text-[#0B1215] font-bold shadow-sm shadow-teal/30'
                      : 'bg-bg text-muted border border-bline hover:text-main'
                  }`}
                >
                  <WalletLogo wallet={w} size="xs" />
                  <span>{w.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Category Filter */}
          {availableCategories.length > 0 && (
            <div>
              <label className="text-[10px] text-muted font-medium block mb-1.5 uppercase tracking-wider">
                Category
              </label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full bg-bg border border-white/10 rounded-xl px-3 py-2 text-white text-xs font-medium focus:outline-none focus:border-teal/50"
              >
                <option value="all">All Categories ({availableCategories.length})</option>
                {availableCategories.map(cat => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      )}

      {/* ── 4. TRANSACTIONS GROUPED PER DATE ───────────────────── */}
      <div className="space-y-4">
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-20 bg-surface rounded-2xl border border-white/5 animate-pulse" />
            ))}
          </div>
        ) : groupedByDate.length === 0 ? (
          <div className="bg-surface rounded-3xl p-10 border border-white/5 text-center space-y-3">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-white/5 flex items-center justify-center text-3xl">
              📝
            </div>
            <div>
              <p className="text-white font-semibold">No transactions found</p>
              <p className="text-muted text-xs mt-1">
                {activeFilterCount > 0 || searchQuery
                  ? 'No transactions matching your filter or search query.'
                  : `No transactions recorded for ${formatDate(selectedDate, 'month')}.`}
              </p>
            </div>
            {activeFilterCount > 0 ? (
              <button
                onClick={resetFilters}
                className="text-xs text-teal font-semibold hover:underline cursor-pointer"
              >
                Clear All Filters
              </button>
            ) : (
              <button
                onClick={() => openModal('expense')}
                className="px-4 py-2 rounded-xl bg-teal text-bg font-bold text-xs shadow-md shadow-teal/20 cursor-pointer"
              >
                Add Transaction Now
              </button>
            )}
          </div>
        ) : (
          groupedByDate.map(group => (
            <div key={group.dateKey} className="space-y-2">
              <div className="flex items-center justify-between px-2 pt-2">
                <div className="flex items-center gap-1.5">
                  <Calendar size={13} className="text-teal" />
                  <span className="text-white text-xs font-bold">
                    {formatDate(group.date, 'header')}
                  </span>
                </div>
                <span className="text-[11px] text-muted font-medium">
                  {group.items.length} {group.items.length === 1 ? 'transaction' : 'transactions'}
                </span>
              </div>

              <div className="bg-surface rounded-3xl border border-white/5 divide-y divide-white/5 overflow-hidden">
                {group.items.map(tx => (
                  <TransactionRow key={tx.id} tx={tx} />
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function TransactionRow({ tx }) {
  const isIncome   = tx.type === 'income';
  const isTransfer = tx.type === 'transfer';
  const isSavings  = tx.type === 'savings';
  const isDebt     = tx.type === 'debt';

  let amountColor = 'text-red-400';
  let sign = '-';

  if (isIncome) {
    amountColor = 'text-green-400';
    sign = '+';
  } else if (isTransfer) {
    amountColor = 'text-teal';
    sign = '';
  } else if (isSavings) {
    amountColor = 'text-purple-400';
    sign = '-';
  } else if (isDebt) {
    if (tx.isCashOut) {
      amountColor = 'text-amber-400';
      sign = '-';
    } else {
      amountColor = 'text-green-400';
      sign = '+';
    }
  }

  let subtitle = '';
  if (isTransfer) {
    subtitle = `${tx.walletName || 'Source'} ➔ ${tx.toWalletName || 'Target'}`;
  } else {
    subtitle = tx.walletName ? tx.walletName : '';
  }
  if (tx.debtPerson) {
    subtitle = `${subtitle ? subtitle + ' · ' : ''}${tx.debtPerson}`;
  }

  return (
    <div className="p-3.5 flex items-center justify-between gap-3 hover:bg-white/[0.02] transition-colors">
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-10 h-10 rounded-2xl bg-white/5 flex items-center justify-center shrink-0 border border-white/5">
          <CategoryIcon category={tx.category} size={20} />
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <p className="text-white text-xs font-bold truncate">{tx.category}</p>
            {isTransfer && (
              <span className="px-1.5 py-0.2 rounded bg-teal/20 text-teal text-[9px] font-semibold">
                Transfer
              </span>
            )}
            {isSavings && (
              <span className="px-1.5 py-0.2 rounded bg-purple-500/20 text-purple-300 text-[9px] font-semibold">
                Goal
              </span>
            )}
          </div>
          <div className="flex items-center gap-1.5 text-[11px] text-muted mt-0.5 truncate">
            {subtitle && <span className="text-muted/80">{subtitle}</span>}
            {tx.note && (
              <>
                {subtitle && <span>•</span>}
                <span className="truncate italic text-white/70">"{tx.note}"</span>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="text-right shrink-0">
        <p className={`text-xs sm:text-sm font-extrabold ${amountColor}`}>
          {sign}{formatRupiah(tx.amount)}
        </p>
        {isTransfer && tx.adminFee > 0 && (
          <p className="text-[10px] text-muted">
            +fee {formatRupiah(tx.adminFee)}
          </p>
        )}
      </div>
    </div>
  );
}
