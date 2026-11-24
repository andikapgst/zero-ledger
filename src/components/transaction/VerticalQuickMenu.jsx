// src/components/transaction/VerticalQuickMenu.jsx
// Smooth, minimalist popover action menu right above the bottom navigation bar

import {
  ArrowDownLeft,
  ArrowUpRight,
  ArrowDownUp,
  Target,
  HandCoins,
  ChevronRight,
  X,
} from 'lucide-react';
import { useTransactionModal } from '../../contexts/TransactionModalContext';

const QUICK_OPTIONS = [
  {
    id: 'income',
    label: 'Income',
    sub: 'Salary, freelance, cashback',
    icon: ArrowDownLeft,
    color: 'text-emerald-600 dark:text-emerald-400',
    bg: 'bg-emerald-500/10 dark:bg-emerald-500/15',
    border: 'border-emerald-500/20 dark:border-emerald-500/30',
  },
  {
    id: 'expense',
    label: 'Expense',
    sub: 'Food, bills, daily spending',
    icon: ArrowUpRight,
    color: 'text-rose-600 dark:text-rose-400',
    bg: 'bg-rose-500/10 dark:bg-rose-500/15',
    border: 'border-rose-500/20 dark:border-rose-500/30',
  },
  {
    id: 'transfer',
    label: 'Transfer',
    sub: 'Between bank & e-wallets',
    icon: ArrowDownUp,
    color: 'text-teal dark:text-teal',
    bg: 'bg-teal-500/10 dark:bg-teal/15',
    border: 'border-teal-500/20 dark:border-teal/30',
  },
  {
    id: 'savings',
    label: 'Savings Goal',
    sub: 'Emergency fund, wedding, crypto',
    icon: Target,
    color: 'text-purple-600 dark:text-purple-400',
    bg: 'bg-purple-500/10 dark:bg-purple-500/15',
    border: 'border-purple-500/20 dark:border-purple-500/30',
  },
  {
    id: 'debt',
    label: 'Debt & Loans',
    sub: 'Lend money, borrow, split bill',
    icon: HandCoins,
    color: 'text-amber-600 dark:text-amber-400',
    bg: 'bg-amber-500/10 dark:bg-amber-500/15',
    border: 'border-amber-500/20 dark:border-amber-500/30',
  },
];

export default function VerticalQuickMenu() {
  const { isQuickMenuOpen, closeQuickMenu, openModal } = useTransactionModal();

  if (!isQuickMenuOpen) return null;

  return (
    <div
      onClick={closeQuickMenu}
      className="fixed inset-0 z-40 bg-black/40 dark:bg-black/60 backdrop-blur-xs flex flex-col justify-end items-center pb-24 px-4 animate-in fade-in duration-200"
    >
      {/* Sleek Minimalist Floating Card */}
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-xs bg-surface border border-bline rounded-3xl p-2.5 shadow-2xl backdrop-blur-xl animate-in zoom-in-95 slide-in-from-bottom-4 duration-200 ease-out"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-3 pt-1.5 pb-2 border-b border-bline/50 mb-1">
          <span className="text-[10px] font-bold tracking-wider text-muted uppercase">
            New Transaction
          </span>
          <button
            onClick={closeQuickMenu}
            className="w-6 h-6 rounded-full bg-subcard hover:bg-slate-200 dark:hover:bg-white/10 flex items-center justify-center text-muted hover:text-main transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X size={13} />
          </button>
        </div>

        {/* 5 Minimal Action Rows */}
        <div className="space-y-1">
          {QUICK_OPTIONS.map((opt) => {
            const Icon = opt.icon;
            return (
              <button
                key={opt.id}
                onClick={() => openModal(opt.id)}
                className="w-full p-2.5 rounded-2xl flex items-center gap-3 text-left hover:bg-subcard active:scale-[0.98] transition-all group cursor-pointer"
              >
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${opt.bg} ${opt.color} ${opt.border} group-hover:scale-105 transition-transform`}
                >
                  <Icon size={18} className="stroke-[2.2]" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-main text-xs sm:text-sm font-bold truncate group-hover:text-teal transition-colors">
                    {opt.label}
                  </p>
                  <p className="text-muted text-[10px] truncate mt-0.5">
                    {opt.sub}
                  </p>
                </div>
                <ChevronRight
                  size={14}
                  className="text-muted/40 group-hover:text-teal group-hover:translate-x-0.5 transition-all shrink-0"
                />
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
