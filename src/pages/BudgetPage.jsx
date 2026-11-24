// src/pages/BudgetPage.jsx
// Budget page: Remaining monthly budget, dynamic progress bar, Set Budget modal,
// category actual spending, and alert indicators when exceeding 100% (English UI)

import { useEffect, useState, useMemo } from 'react';
import {
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useTransactionModal } from '../contexts/TransactionModalContext';
import { getBudgets, getTransactions } from '../lib/firebase';
import {
  formatRupiah,
  formatDate,
  getYearMonth,
  ZERO_BASED_EXPENSES,
} from '../lib/utils';
import CategoryIcon from '../components/transaction/CategoryIcon';
import AturBudgetModal from '../components/budget/AturBudgetModal';
import ThemeToggle from '../components/layout/ThemeToggle';

export default function BudgetPage() {
  const { user } = useAuth();
  const { refreshTrigger } = useTransactionModal();

  const [selectedDate, setSelectedDate] = useState(new Date());
  const [budgets, setBudgets]           = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading]           = useState(true);
  const [modalOpen, setModalOpen]       = useState(false);

  const currentYearMonth = getYearMonth(selectedDate);
  const monthLabel = formatDate(selectedDate, 'month');

  const fetchData = async () => {
    if (!user) return;
    try {
      setLoading(true);
      const [bList, txList] = await Promise.all([
        getBudgets(user.uid, currentYearMonth),
        getTransactions(user.uid, { limitCount: 400 }),
      ]);
      setBudgets(bList);
      setTransactions(txList);
    } catch (err) {
      console.error('Error fetching budget data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user, currentYearMonth, refreshTrigger]);

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

  const spendingMap = useMemo(() => {
    const map = {};
    transactions.forEach(tx => {
      if (getYearMonth(tx.date) === currentYearMonth) {
        if (tx.type === 'expense' || tx.type === 'savings') {
          const cat = tx.category || 'Other';
          map[cat] = (map[cat] || 0) + (Number(tx.amount) || 0);
        }
      }
    });
    return map;
  }, [transactions, currentYearMonth]);

  const budgetComparisonList = useMemo(() => {
    const budgetMap = {};
    budgets.forEach(b => {
      budgetMap[b.category] = Number(b.limit) || 0;
    });

    return ZERO_BASED_EXPENSES.map(cat => {
      const limit = budgetMap[cat.name] || 0;
      const spent = spendingMap[cat.name] || 0;
      const remaining = limit - spent;
      const percentage = limit > 0 ? (spent / limit) * 100 : spent > 0 ? 100 : 0;
      const isOver = spent > limit && limit > 0;
      const overAmount = isOver ? spent - limit : 0;

      return {
        category: cat.name,
        group: cat.group,
        limit,
        spent,
        remaining,
        percentage,
        isOver,
        overAmount,
      };
    });
  }, [budgets, spendingMap]);

  const totals = useMemo(() => {
    let totalLimit = 0;
    let totalSpent = 0;

    budgetComparisonList.forEach(item => {
      totalLimit += item.limit;
      totalSpent += item.spent;
    });

    const totalRemaining = totalLimit - totalSpent;
    const overallPercentage = totalLimit > 0 ? (totalSpent / totalLimit) * 100 : 0;
    const isOverallOver = totalSpent > totalLimit && totalLimit > 0;
    const overallOverAmount = isOverallOver ? totalSpent - totalLimit : 0;

    return {
      totalLimit,
      totalSpent,
      totalRemaining,
      overallPercentage,
      isOverallOver,
      overallOverAmount,
    };
  }, [budgetComparisonList]);

  return (
    <div className="px-4 pt-12 pb-8 max-w-lg mx-auto space-y-5">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-white text-xl font-bold">Monthly Budget</h1>
          <p className="text-muted text-xs">Cap limits & real-time spending tracking</p>
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <button
            onClick={() => setModalOpen(true)}
            className="h-9 px-3.5 bg-teal text-bg font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-md shadow-teal/30 hover:opacity-95 active:scale-95 transition-all cursor-pointer"
          >
            <SlidersHorizontal size={15} />
            <span>Set Budget</span>
          </button>
        </div>
      </div>

      {/* ── 1. MONTH SELECTOR & TOTAL REMAINING PROGRESS ────────── */}
      <div className="bg-gradient-to-br from-[#121A1E] via-[#0f171b] to-[#122324] border border-white/10 rounded-3xl p-5 shadow-xl relative overflow-hidden">
        {/* Month Navigation */}
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-white/5">
          <button
            onClick={handlePrevMonth}
            className="w-8 h-8 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center text-muted hover:text-white transition-colors cursor-pointer"
          >
            <ChevronLeft size={18} />
          </button>
          <div className="text-center">
            <span className="text-white text-base font-bold tracking-tight">
              {monthLabel}
            </span>
            <span className="block text-[10px] text-muted uppercase tracking-wider">
              {currentYearMonth}
            </span>
          </div>
          <button
            onClick={handleNextMonth}
            className="w-8 h-8 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center text-muted hover:text-white transition-colors cursor-pointer"
          >
            <ChevronRight size={18} />
          </button>
        </div>

        {/* Total Remaining */}
        <div>
          <p className="text-muted text-xs font-medium">Total Remaining Budget This Month</p>
          <div className="flex items-baseline justify-between mt-1">
            <p className={`text-2xl sm:text-3xl font-extrabold tracking-tight ${
              totals.isOverallOver ? 'text-red-400' : 'text-white'
            }`}>
              {totals.isOverallOver
                ? `Exceeded by ${formatRupiah(totals.overallOverAmount)}`
                : formatRupiah(totals.totalRemaining)}
            </p>
            <span className="text-xs text-muted font-medium">
              of {formatRupiah(totals.totalLimit)}
            </span>
          </div>

          {/* Master Progress Bar */}
          <div className="mt-3">
            <div className="h-3 w-full bg-white/5 rounded-full overflow-hidden p-0.5 border border-white/5">
              <div
                className={`h-full rounded-full transition-all duration-700 ${
                  totals.isOverallOver
                    ? 'bg-red-500'
                    : totals.overallPercentage >= 80
                    ? 'bg-amber-400'
                    : 'bg-teal'
                }`}
                style={{ width: `${Math.min(100, totals.overallPercentage)}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-[11px] mt-1.5">
              <span className="text-muted">
                Spent: <span className="text-white font-semibold">{formatRupiah(totals.totalSpent)}</span>
              </span>
              <span className={`font-bold ${
                totals.isOverallOver
                  ? 'text-red-400'
                  : totals.overallPercentage >= 80
                  ? 'text-amber-400'
                  : 'text-teal'
              }`}>
                {totals.overallPercentage.toFixed(0)}%
                {totals.isOverallOver && ' (Overbudget)'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ── 2. SUB-CATEGORIES COMPARISON LIST ───────────────────── */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-white text-sm font-semibold">
            Sub-Category Breakdown ({budgetComparisonList.length})
          </h2>
          <button
            onClick={() => setModalOpen(true)}
            className="text-teal text-xs hover:underline flex items-center gap-1 font-medium cursor-pointer"
          >
            Adjust Limits
          </button>
        </div>

        {loading ? (
          <div className="space-y-2.5">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-20 bg-surface rounded-2xl border border-white/5 animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="space-y-2.5">
            {budgetComparisonList.map((item) => {
              const hasBudget = item.limit > 0;
              const isOver = item.isOver;

              return (
                <div
                  key={item.category}
                  className={`bg-surface rounded-2xl p-4 border transition-all ${
                    isOver
                      ? 'border-red-500/30 bg-red-500/[0.03]'
                      : 'border-white/5 hover:border-white/10'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center shrink-0 border border-white/5">
                        <CategoryIcon category={item.category} size={17} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-white text-xs font-semibold truncate">{item.category}</p>
                        <p className="text-[10px] text-muted">{item.group}</p>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <p className="text-xs font-bold text-white">
                        {formatRupiah(item.spent)}
                        <span className="text-[11px] text-muted font-normal">
                          {' '}/ {hasBudget ? formatRupiah(item.limit) : 'Unset'}
                        </span>
                      </p>
                      {isOver ? (
                        <p className="text-[10px] text-red-400 font-bold flex items-center justify-end gap-1 mt-0.5">
                          <AlertTriangle size={11} />
                          Over by {formatRupiah(item.overAmount)}
                        </p>
                      ) : hasBudget ? (
                        <p className="text-[10px] text-teal mt-0.5">
                          Remaining {formatRupiah(item.remaining)}
                        </p>
                      ) : (
                        <p className="text-[10px] text-muted mt-0.5">No limit set</p>
                      )}
                    </div>
                  </div>

                  {hasBudget ? (
                    <div>
                      <div className="h-2 w-full bg-bg rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            isOver
                              ? 'bg-red-500'
                              : item.percentage >= 80
                              ? 'bg-amber-400'
                              : 'bg-teal'
                          }`}
                          style={{ width: `${Math.min(100, item.percentage)}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-[10px] mt-1 text-muted">
                        <span>{item.percentage.toFixed(0)}% used</span>
                        {isOver && <span className="text-red-400 font-semibold">Over {item.percentage.toFixed(0)}%</span>}
                      </div>
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <AturBudgetModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        month={currentYearMonth}
        existingBudgets={budgets}
        onSuccess={fetchData}
      />
    </div>
  );
}
