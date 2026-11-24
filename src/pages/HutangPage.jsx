// src/pages/HutangPage.jsx
// Debt & Loans Management (English UI):
// - Two Tabs: "Lent to Others (Receivables)" and "I Borrowed (Debts)"
// - + Record Debt/Loan button
// - Settle or Partial Pay button updating wallet balances and marking settled status

import { useEffect, useState, useMemo } from 'react';
import {
  Plus,
  ArrowUpRight,
  ArrowDownLeft,
  CheckCircle2,
  User,
  Calendar,
  Trash2,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useTransactionModal } from '../contexts/TransactionModalContext';
import { getDebts, deleteDebt } from '../lib/firebase';
import { formatRupiah, formatDate } from '../lib/utils';
import CatatHutangModal from '../components/debt/CatatHutangModal';
import SettleHutangModal from '../components/debt/SettleHutangModal';
import ThemeToggle from '../components/layout/ThemeToggle';

export default function HutangPage() {
  const { user } = useAuth();
  const { refreshTrigger } = useTransactionModal();

  const [debts, setDebts]             = useState([]);
  const [loading, setLoading]         = useState(true);
  const [activeTab, setActiveTab]     = useState('receivable'); // 'receivable' | 'debt'
  const [showPaid, setShowPaid]       = useState(false);

  // Modals state
  const [catatModalOpen, setCatatModalOpen] = useState(false);
  const [settleModalOpen, setSettleModalOpen] = useState(false);
  const [selectedDebtForSettle, setSelectedDebtForSettle] = useState(null);

  const fetchData = async () => {
    if (!user) return;
    try {
      setLoading(true);
      const data = await getDebts(user.uid);
      setDebts(data);
    } catch (err) {
      console.error('Error fetching debts:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user, refreshTrigger]);

  const summary = useMemo(() => {
    let totalReceivable = 0; // Money others owe me
    let totalDebt = 0;       // Money I owe others

    debts.forEach(d => {
      const remaining = Math.max(0, (Number(d.amount) || 0) - (Number(d.paidAmount) || 0));
      if (!d.isPaid && remaining > 0) {
        if (d.type === 'receivable') totalReceivable += remaining;
        else if (d.type === 'debt') totalDebt += remaining;
      }
    });

    return {
      totalReceivable,
      totalDebt,
    };
  }, [debts]);

  const filteredList = useMemo(() => {
    return debts.filter(d => {
      if (d.type !== activeTab) return false;
      if (!showPaid && d.isPaid) return false;
      return true;
    });
  }, [debts, activeTab, showPaid]);

  const handleOpenSettle = (debt) => {
    setSelectedDebtForSettle(debt);
    setSettleModalOpen(true);
  };

  const handleDelete = async (debtId) => {
    if (window.confirm('Delete this debt/loan record?')) {
      try {
        await deleteDebt(debtId);
        fetchData();
      } catch (err) {
        console.error('Error deleting debt:', err);
      }
    }
  };

  return (
    <div className="px-4 pt-12 pb-8 max-w-lg mx-auto space-y-5">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-white text-xl font-bold">Debts & Loans</h1>
          <p className="text-muted text-xs">Track split bills, lent money & borrowed funds</p>
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <button
            onClick={() => setCatatModalOpen(true)}
            className="h-9 px-3.5 bg-teal text-bg font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-md shadow-teal/30 hover:opacity-95 active:scale-95 transition-all cursor-pointer"
          >
            <Plus size={16} className="stroke-[2.5]" />
            <span>Record</span>
          </button>
        </div>
      </div>

      {/* ── 1. SUMMARY CARDS (LENT VS BORROWED) ───────────────── */}
      <div className="grid grid-cols-2 gap-3">
        {/* Receivables (Others owe me) */}
        <div
          onClick={() => setActiveTab('receivable')}
          className={`cursor-pointer rounded-3xl p-4 border transition-all ${
            activeTab === 'receivable'
              ? 'bg-gradient-to-br from-teal/20 to-teal/5 border-teal/40 shadow-lg shadow-teal/10'
              : 'bg-surface border-white/5 hover:border-white/10'
          }`}
        >
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-xl bg-teal/15 flex items-center justify-center text-teal">
              <ArrowDownLeft size={16} />
            </div>
            <span className="text-[11px] text-muted font-medium">Lent to Others</span>
          </div>
          <p className="text-lg font-bold text-teal">
            {formatRupiah(summary.totalReceivable)}
          </p>
          <p className="text-[10px] text-muted/70 mt-0.5">Money owed to me (Receivables)</p>
        </div>

        {/* Debts (I owe others) */}
        <div
          onClick={() => setActiveTab('debt')}
          className={`cursor-pointer rounded-3xl p-4 border transition-all ${
            activeTab === 'debt'
              ? 'bg-gradient-to-br from-amber-500/20 to-amber-500/5 border-amber-500/40 shadow-lg shadow-amber-500/10'
              : 'bg-surface border-white/5 hover:border-white/10'
          }`}
        >
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-xl bg-amber-500/15 flex items-center justify-center text-amber-400">
              <ArrowUpRight size={16} />
            </div>
            <span className="text-[11px] text-muted font-medium">I Borrowed</span>
          </div>
          <p className="text-lg font-bold text-amber-400">
            {formatRupiah(summary.totalDebt)}
          </p>
          <p className="text-[10px] text-muted/70 mt-0.5">My liabilities (Debts)</p>
        </div>
      </div>

      {/* ── 2. TAB TOGGLE & SETTLED CHECKBOX ───────────────────── */}
      <div className="flex items-center justify-between pt-1">
        <div className="flex gap-1.5 p-1 bg-surface border border-white/5 rounded-2xl">
          <button
            onClick={() => setActiveTab('receivable')}
            className={`py-2 px-3 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'receivable'
                ? 'bg-teal text-bg shadow-sm shadow-teal/30'
                : 'text-muted hover:text-white'
            }`}
          >
            Lent to Others
          </button>
          <button
            onClick={() => setActiveTab('debt')}
            className={`py-2 px-3 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'debt'
                ? 'bg-amber-400 text-bg shadow-sm shadow-amber-400/30'
                : 'text-muted hover:text-white'
            }`}
          >
            I Borrowed
          </button>
        </div>

        <label className="flex items-center gap-1.5 text-xs text-muted cursor-pointer select-none">
          <input
            type="checkbox"
            checked={showPaid}
            onChange={(e) => setShowPaid(e.target.checked)}
            className="accent-teal w-3.5 h-3.5 rounded cursor-pointer"
          />
          <span className="text-[11px]">Show Settled</span>
        </label>
      </div>

      {/* ── 3. LIST OF DEBTS / LOANS ───────────────────────────── */}
      <div className="space-y-3">
        {loading ? (
          <div className="space-y-2.5">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-28 bg-surface rounded-3xl border border-white/5 animate-pulse" />
            ))}
          </div>
        ) : filteredList.length === 0 ? (
          <div className="bg-surface rounded-3xl p-8 border border-white/5 text-center space-y-3">
            <div className="w-12 h-12 mx-auto rounded-2xl bg-white/5 flex items-center justify-center text-2xl">
              🤝
            </div>
            <div>
              <p className="text-white font-semibold">
                No {activeTab === 'receivable' ? 'receivables' : 'debts'}{' '}
                {showPaid ? '' : 'outstanding'}
              </p>
              <p className="text-muted text-xs mt-1 max-w-xs mx-auto">
                {activeTab === 'receivable'
                  ? 'Record split bills, badminton expenses, meals, or friendly loans.'
                  : 'Track money you borrowed and need to return to friends or family.'}
              </p>
            </div>
            <button
              onClick={() => setCatatModalOpen(true)}
              className="px-4 py-2 rounded-xl bg-teal text-bg font-bold text-xs shadow-md shadow-teal/20 cursor-pointer"
            >
              + Record Now
            </button>
          </div>
        ) : (
          filteredList.map(item => {
            const total = Number(item.amount) || 0;
            const paid = Number(item.paidAmount) || 0;
            const remaining = Math.max(0, total - paid);
            const isLunas = item.isPaid || remaining === 0;
            const pctPaid = total > 0 ? (paid / total) * 100 : 0;
            const isReceivable = item.type === 'receivable';

            return (
              <div
                key={item.id}
                className={`bg-surface rounded-3xl p-4 border transition-all ${
                  isLunas
                    ? 'border-white/5 opacity-75'
                    : isReceivable
                    ? 'border-teal/20 hover:border-teal/40'
                    : 'border-amber-500/20 hover:border-amber-500/40'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${
                      isLunas
                        ? 'bg-white/5 text-muted'
                        : isReceivable
                        ? 'bg-teal/15 text-teal'
                        : 'bg-amber-500/15 text-amber-400'
                    }`}>
                      <User size={18} />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-white text-sm font-bold truncate">{item.person}</p>
                        {isLunas && (
                          <span className="px-2 py-0.5 rounded-full bg-green-500/20 text-green-400 text-[10px] font-bold">
                            Settled
                          </span>
                        )}
                      </div>
                      {item.note && (
                        <p className="text-[11px] text-muted truncate mt-0.5">
                          "{item.note}"
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <p className={`text-sm font-extrabold ${
                      isLunas ? 'text-muted' : isReceivable ? 'text-teal' : 'text-amber-400'
                    }`}>
                      {formatRupiah(remaining)}
                    </p>
                    <p className="text-[10px] text-muted">
                      Total: {formatRupiah(total)}
                    </p>
                  </div>
                </div>

                {paid > 0 && !isLunas && (
                  <div className="mt-3 pt-2 border-t border-white/5">
                    <div className="h-1.5 w-full bg-bg rounded-full overflow-hidden">
                      <div
                        className="h-full bg-teal rounded-full transition-all"
                        style={{ width: `${pctPaid}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-[10px] text-muted mt-1">
                      <span>Paid: {formatRupiah(paid)}</span>
                      <span>{pctPaid.toFixed(0)}%</span>
                    </div>
                  </div>
                )}

                <div className="mt-3 pt-3 border-t border-white/5 flex items-center justify-between gap-2">
                  <div className="text-[11px] text-muted flex items-center gap-1.5 truncate">
                    {item.dueDate ? (
                      <span className="flex items-center gap-1 text-muted/80">
                        <Calendar size={12} />
                        Due: {formatDate(item.dueDate, 'short')}
                      </span>
                    ) : (
                      <span className="text-muted/60">
                        Created: {formatDate(item.createdAt, 'short')}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {!isLunas && (
                      <button
                        onClick={() => handleOpenSettle(item)}
                        className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1 transition-all cursor-pointer ${
                          isReceivable
                            ? 'bg-teal text-bg hover:opacity-90 shadow-sm shadow-teal/20'
                            : 'bg-amber-400 text-bg hover:opacity-90 shadow-sm shadow-amber-400/20'
                        }`}
                      >
                        <CheckCircle2 size={13} className="stroke-[2.5]" />
                        <span>{isReceivable ? 'Receive Payment' : 'Pay Debt'}</span>
                      </button>
                    )}

                    <button
                      onClick={() => handleDelete(item.id)}
                      className="p-1.5 rounded-lg text-muted/50 hover:text-red-400 transition-colors cursor-pointer"
                      title="Delete Record"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      <CatatHutangModal
        isOpen={catatModalOpen}
        onClose={() => setCatatModalOpen(false)}
        initialType={activeTab}
        onSuccess={fetchData}
      />

      <SettleHutangModal
        isOpen={settleModalOpen}
        onClose={() => setSettleModalOpen(false)}
        debt={selectedDebtForSettle}
        onSuccess={fetchData}
      />
    </div>
  );
}
