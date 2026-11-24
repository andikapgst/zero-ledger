// src/pages/AnalisisPage.jsx
// Financial Analysis (English UI):
// 1. 6-Month Net Worth Trend Line Chart (Lightweight SVG Curve Chart)
// 2. Month-over-Month (MoM) Expense Comparison percentage & amount
// 3. Savings Rate (% of income set aside for Savings, Investments & Emergency Buffer)
// 4. Top Spending by Category with Progress Bars & Month Selector

import { useEffect, useState, useMemo } from 'react';
import {
  TrendingUp,
  TrendingDown,
  ChevronLeft,
  ChevronRight,
  PieChart,
  PiggyBank,
  ArrowUpRight,
  ArrowDownRight,
  BarChart2,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useTransactionModal } from '../contexts/TransactionModalContext';
import { getTransactions, getWallets, getDebts } from '../lib/firebase';
import {
  formatRupiah,
  formatDate,
  getYearMonth,
  CATEGORY_INFO_MAP,
} from '../lib/utils';
import CategoryIcon from '../components/transaction/CategoryIcon';
import ThemeToggle from '../components/layout/ThemeToggle';

export default function AnalisisPage() {
  const { user } = useAuth();
  const { refreshTrigger } = useTransactionModal();

  const [transactions, setTransactions] = useState([]);
  const [wallets, setWallets]           = useState([]);
  const [debts, setDebts]               = useState([]);
  const [loading, setLoading]           = useState(true);

  // Month selector for granular breakdown view
  const [selectedDate, setSelectedDate] = useState(new Date());

  const currentYM = getYearMonth(selectedDate);
  const monthDisplay = formatDate(selectedDate, 'month');

  useEffect(() => {
    if (!user) return;
    Promise.all([
      getTransactions(user.uid, { limitCount: 500 }),
      getWallets(user.uid),
      getDebts(user.uid),
    ]).then(([txList, wList, dList]) => {
      setTransactions(txList);
      setWallets(wList);
      setDebts(dList);
      setLoading(false);
    });
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

  // ── 1. MONTH-OVER-MONTH (MoM) & SAVINGS RATE ─────────────────
  const momComparison = useMemo(() => {
    const dCur = new Date(selectedDate);
    const curYM = getYearMonth(dCur);

    const dPrev = new Date(selectedDate);
    dPrev.setMonth(dPrev.getMonth() - 1);
    const prevYM = getYearMonth(dPrev);

    let expenseCur = 0;
    let incomeCur  = 0;
    let savingsCur = 0;

    let expensePrev = 0;
    let incomePrev  = 0;

    transactions.forEach(tx => {
      const ym = getYearMonth(tx.date);
      const amt = Number(tx.amount) || 0;

      if (ym === curYM) {
        if (tx.type === 'expense') {
          expenseCur += amt;
        } else if (tx.type === 'income') {
          incomeCur += amt;
        } else if (tx.type === 'savings') {
          expenseCur += amt;
          savingsCur += amt;
        }

        const isSavingCategory = [
          'Wedding Fund',
          'Dika & Diana Fund',
          'Emergency Savings',
          'Crypto Investment',
          'Tabungan Nikah',
          'Tabungan Dika & Diana',
          'Simpanan Darurat',
          'Investasi Kripto',
        ].includes(tx.category);

        if (tx.type === 'expense' && isSavingCategory) {
          savingsCur += amt;
        }
      } else if (ym === prevYM) {
        if (tx.type === 'expense' || tx.type === 'savings') {
          expensePrev += amt;
        } else if (tx.type === 'income') {
          incomePrev += amt;
        }
      }
    });

    const diff = expenseCur - expensePrev;
    let pctChange = 0;
    if (expensePrev > 0) {
      pctChange = ((expenseCur - expensePrev) / expensePrev) * 100;
    } else if (expenseCur > 0) {
      pctChange = 100;
    }

    const savingsRate = incomeCur > 0 ? (savingsCur / incomeCur) * 100 : 0;

    return {
      curYM,
      prevYM,
      expenseCur,
      expensePrev,
      diff,
      pctChange,
      incomeCur,
      savingsCur,
      savingsRate,
    };
  }, [transactions, selectedDate]);

  // ── 2. 6-MONTH NET WORTH TREND CALCULATION ──────────────────
  const netWorth6Months = useMemo(() => {
    const currentWalletsTotal = wallets.reduce((s, w) => s + (Number(w.balance) || 0), 0);
    const unpaidDebtTotal = debts
      .filter(d => d.type === 'debt' && !d.isPaid)
      .reduce((s, d) => s + (Math.max(0, (Number(d.amount) || 0) - (Number(d.paidAmount) || 0))), 0);
    const todayNetWorth = currentWalletsTotal - unpaidDebtTotal;

    const months = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push({
        label: d.toLocaleDateString('en-US', { month: 'short' }),
        ym: getYearMonth(d),
      });
    }

    const flowMap = {};
    transactions.forEach(tx => {
      const ym = getYearMonth(tx.date);
      const amt = Number(tx.amount) || 0;
      if (!flowMap[ym]) flowMap[ym] = 0;

      if (tx.type === 'income') {
        flowMap[ym] += amt;
      } else if (tx.type === 'expense' || tx.type === 'savings') {
        flowMap[ym] -= amt;
      }
    });

    const result = [];
    let rolling = todayNetWorth;

    for (let i = months.length - 1; i >= 0; i--) {
      const m = months[i];
      result[i] = {
        label: m.label,
        ym: m.ym,
        value: Math.max(0, rolling),
      };
      const monthDelta = flowMap[m.ym] || 0;
      rolling -= monthDelta;
    }

    return result;
  }, [wallets, debts, transactions]);

  // ── 3. TOP SPENDING CATEGORY BREAKDOWN ────────────────────────
  const categoryBreakdown = useMemo(() => {
    const catMap = {};
    let totalExpense = 0;

    transactions.forEach(tx => {
      if (getYearMonth(tx.date) === currentYM) {
        if (tx.type === 'expense' || tx.type === 'savings') {
          const cat = tx.category || 'Other';
          const amt = Number(tx.amount) || 0;
          catMap[cat] = (catMap[cat] || 0) + amt;
          totalExpense += amt;
        }
      }
    });

    return Object.entries(catMap)
      .map(([name, amount]) => ({
        name,
        amount,
        percentage: totalExpense > 0 ? (amount / totalExpense) * 100 : 0,
      }))
      .sort((a, b) => b.amount - a.amount);
  }, [transactions, currentYM]);

  // SVG Chart points
  const svgChartData = useMemo(() => {
    if (!netWorth6Months || netWorth6Months.length === 0) return null;

    const values = netWorth6Months.map(d => d.value);
    const minVal = Math.min(...values);
    const maxVal = Math.max(...values);
    const range = maxVal - minVal || 1;

    const width = 340;
    const height = 130;
    const padX = 24;
    const padY = 20;

    const points = netWorth6Months.map((d, idx) => {
      const x = padX + (idx / (netWorth6Months.length - 1)) * (width - padX * 2);
      const normalized = (d.value - minVal) / range;
      const y = height - padY - normalized * (height - padY * 2);
      return { x, y, ...d };
    });

    const pathD = points.reduce((acc, pt, i) => {
      return i === 0 ? `M ${pt.x} ${pt.y}` : `${acc} L ${pt.x} ${pt.y}`;
    }, '');

    const areaD = `${pathD} L ${points[points.length - 1].x} ${height} L ${points[0].x} ${height} Z`;

    return {
      width,
      height,
      points,
      pathD,
      areaD,
    };
  }, [netWorth6Months]);

  return (
    <div className="px-4 pt-12 pb-8 max-w-lg mx-auto space-y-6">
      {/* ── Top Header with Theme Switcher ─────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-white font-bold text-xl">Financial Analysis</h1>
          <p className="text-muted text-xs">Net worth trend, savings rate & spending insights</p>
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <div className="w-8 h-8 rounded-xl bg-teal/15 flex items-center justify-center text-teal">
            <BarChart2 size={18} />
          </div>
        </div>
      </div>

      {/* ── 1. 6-MONTH NET WORTH TREND LINE CHART ──────────────── */}
      <div className="bg-gradient-to-br from-[#121A1E] via-[#0f171b] to-[#122324] border border-white/10 rounded-3xl p-5 shadow-xl relative overflow-hidden">
        <div className="flex items-center justify-between mb-3">
          <div>
            <span className="text-[10px] text-muted uppercase tracking-wider font-semibold">
              Net Worth Trend
            </span>
            <p className="text-white text-base font-bold">Last 6 Months</p>
          </div>
          <span className="px-2.5 py-1 rounded-full bg-teal/15 text-teal text-[10px] font-bold">
            Real-time
          </span>
        </div>

        {/* SVG Sparkline Curve Chart */}
        {svgChartData ? (
          <div className="relative">
            <svg
              viewBox={`0 0 ${svgChartData.width} ${svgChartData.height}`}
              className="w-full h-36 overflow-visible"
            >
              <defs>
                <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#2DD4BF" stopOpacity="0.3" />
                  <stop offset="100%" stopColor="#2DD4BF" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              <path d={svgChartData.areaD} fill="url(#chartGradient)" />

              <path
                d={svgChartData.pathD}
                fill="none"
                stroke="#2DD4BF"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {svgChartData.points.map((pt, idx) => (
                <g key={idx}>
                  <circle
                    cx={pt.x}
                    cy={pt.y}
                    r={idx === svgChartData.points.length - 1 ? 4.5 : 3.5}
                    className="fill-teal stroke-bg stroke-2"
                  />
                  <text
                    x={pt.x}
                    y={svgChartData.height - 2}
                    textAnchor="middle"
                    className="fill-muted text-[10px] font-medium"
                  >
                    {pt.label}
                  </text>
                </g>
              ))}
            </svg>

            <div className="flex justify-between items-center text-xs mt-1 pt-2 border-t border-white/5">
              <span className="text-muted text-[11px]">Current Net Worth:</span>
              <span className="text-white font-extrabold text-sm">
                {formatRupiah(netWorth6Months[netWorth6Months.length - 1]?.value || 0)}
              </span>
            </div>
          </div>
        ) : (
          <div className="h-32 flex items-center justify-center text-muted text-xs">
            Loading trend chart...
          </div>
        )}
      </div>

      {/* ── 2. MONTH-OVER-MONTH & SAVINGS RATE METRICS ─────────── */}
      <div className="grid grid-cols-2 gap-3">
        {/* MoM Expense Change */}
        <div className="bg-surface rounded-3xl p-4 border border-white/5 space-y-2">
          <div className="flex items-center gap-1.5 text-muted text-xs">
            {momComparison.diff <= 0 ? (
              <div className="w-6 h-6 rounded-lg bg-green-500/15 flex items-center justify-center text-green-400">
                <ArrowDownRight size={15} />
              </div>
            ) : (
              <div className="w-6 h-6 rounded-lg bg-red-500/15 flex items-center justify-center text-red-400">
                <ArrowUpRight size={15} />
              </div>
            )}
            <span className="text-[11px] font-medium">This vs Last Month</span>
          </div>

          <div>
            <p className={`text-xl font-extrabold ${
              momComparison.diff <= 0 ? 'text-green-400' : 'text-red-400'
            }`}>
              {momComparison.diff <= 0 ? '' : '+'}
              {momComparison.pctChange.toFixed(0)}%
            </p>
            <p className="text-[10px] text-muted/80 mt-0.5 leading-tight">
              {momComparison.diff <= 0
                ? `Saved ${formatRupiah(Math.abs(momComparison.diff), { compact: true })}`
                : `Increased ${formatRupiah(momComparison.diff, { compact: true })}`}
            </p>
          </div>
        </div>

        {/* Savings Rate */}
        <div className="bg-surface rounded-3xl p-4 border border-white/5 space-y-2">
          <div className="flex items-center gap-1.5 text-muted text-xs">
            <div className="w-6 h-6 rounded-lg bg-teal/15 flex items-center justify-center text-teal">
              <PiggyBank size={15} />
            </div>
            <span className="text-[11px] font-medium">Savings Rate</span>
          </div>

          <div>
            <p className="text-xl font-extrabold text-teal">
              {momComparison.savingsRate.toFixed(0)}%
            </p>
            <p className="text-[10px] text-muted/80 mt-0.5 leading-tight">
              Total {formatRupiah(momComparison.savingsCur, { compact: true })} set aside
            </p>
          </div>
        </div>
      </div>

      {/* ── 3. TOP SPENDING BREAKDOWN PER CATEGORY ─────────────── */}
      <div className="bg-surface rounded-3xl p-5 border border-white/5 space-y-4">
        {/* Month Navigation */}
        <div className="flex items-center justify-between pb-3 border-b border-white/5">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center text-teal">
              <PieChart size={17} />
            </div>
            <div>
              <h2 className="text-white text-sm font-bold">Top Spending Categories</h2>
              <p className="text-[10px] text-muted">Period: {monthDisplay}</p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={handlePrevMonth}
              className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-muted hover:text-white transition-colors cursor-pointer"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              onClick={handleNextMonth}
              className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-muted hover:text-white transition-colors cursor-pointer"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-10 bg-white/5 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : categoryBreakdown.length === 0 ? (
          <div className="text-center py-8 text-muted text-xs space-y-1">
            <p className="text-2xl">📊</p>
            <p className="text-white font-medium">No expenses recorded</p>
            <p className="text-[11px] text-muted/70">No spending data for {monthDisplay}</p>
          </div>
        ) : (
          <div className="space-y-3.5">
            {categoryBreakdown.map((item) => {
              const info = CATEGORY_INFO_MAP[item.name] || {};
              const barColor = info.color || '#2DD4BF';

              return (
                <div key={item.name} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-6 h-6 rounded-lg bg-white/5 flex items-center justify-center shrink-0">
                        <CategoryIcon category={item.name} size={13} />
                      </div>
                      <span className="text-white font-medium truncate">{item.name}</span>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-white font-bold">{formatRupiah(item.amount)}</span>
                      <span className="text-[10px] text-muted w-10 text-right font-medium">
                        {item.percentage.toFixed(0)}%
                      </span>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="h-2 w-full bg-bg rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{
                        width: `${Math.min(100, item.percentage)}%`,
                        backgroundColor: barColor,
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
