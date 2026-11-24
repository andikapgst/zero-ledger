// src/components/budget/AturBudgetModal.jsx
// Modal for setting monthly budget caps per sub-category (English UI)

import { useState, useEffect } from 'react';
import { X, Check, SlidersHorizontal, AlertCircle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { saveMonthlyBudgets } from '../../lib/firebase';
import { ZERO_BASED_EXPENSES, formatRupiah } from '../../lib/utils';
import CategoryIcon from '../transaction/CategoryIcon';

export default function AturBudgetModal({ isOpen, onClose, month, existingBudgets = [], onSuccess }) {
  const { user } = useAuth();
  const toast = useToast();

  const [budgetValues, setBudgetValues] = useState({});
  const [saving, setSaving]             = useState(false);
  const [error, setError]               = useState('');

  useEffect(() => {
    if (isOpen) {
      const initialMap = {};
      const existingMap = {};
      existingBudgets.forEach(b => {
        existingMap[b.category] = { id: b.id, limit: b.limit };
      });

      ZERO_BASED_EXPENSES.forEach(cat => {
        const item = existingMap[cat.name];
        initialMap[cat.name] = {
          id: item?.id || null,
          limit: item?.limit ? String(item.limit) : '',
        };
      });

      setBudgetValues(initialMap);
      setError('');
    }
  }, [isOpen, existingBudgets]);

  if (!isOpen) return null;

  const handleLimitChange = (catName, rawValue) => {
    const clean = rawValue.replace(/\D/g, '');
    setBudgetValues(prev => ({
      ...prev,
      [catName]: {
        ...prev[catName],
        limit: clean,
      },
    }));
  };

  const totalBudgetPlanned = Object.values(budgetValues).reduce((sum, item) => {
    return sum + (Number(item?.limit) || 0);
  }, 0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) return;

    setSaving(true);
    setError('');

    try {
      const itemsToSave = Object.entries(budgetValues).map(([category, data]) => ({
        id: data.id,
        category,
        limit: Number(data.limit) || 0,
      }));

      await saveMonthlyBudgets(user.uid, month, itemsToSave);
      toast.success(`Budget caps for ${month} saved successfully!`);
      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      console.error('Error saving budgets:', err);
      setError('Failed to save monthly budget caps');
      toast.error('Failed to save monthly budget caps');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-surface w-full max-w-lg mx-auto rounded-3xl border border-bline flex flex-col shadow-2xl max-h-[90vh] sm:max-h-[88vh] overflow-hidden"
      >
        <div className="flex items-center justify-between px-5 sm:px-6 pt-5 pb-3.5 border-b border-bline">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-teal/15 flex items-center justify-center text-teal">
              <SlidersHorizontal size={18} />
            </div>
            <div>
              <h2 className="text-main text-base font-bold">Set Budget Caps</h2>
              <p className="text-[11px] text-muted">Period: {month}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-subcard flex items-center justify-center text-muted hover:text-main transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {error && (
          <div className="mx-5 sm:mx-6 mt-3 p-3 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-2">
            <AlertCircle size={16} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="mx-5 sm:mx-6 my-3 p-3.5 bg-bg border border-bline rounded-2xl flex items-center justify-between">
          <div>
            <p className="text-[10px] text-muted uppercase tracking-wider">Total Planned Budget</p>
            <p className="text-base font-bold text-teal mt-0.5">{formatRupiah(totalBudgetPlanned)}</p>
          </div>
          <span className="text-[11px] text-muted/70">{ZERO_BASED_EXPENSES.length} Categories</span>
        </div>

        <div className="modal-scroll flex-1 px-5 sm:px-6 py-2 space-y-3">
          {ZERO_BASED_EXPENSES.map((cat) => {
            const val = budgetValues[cat.name]?.limit || '';
            const displayVal = val ? new Intl.NumberFormat('id-ID').format(parseInt(val, 10)) : '';

            return (
              <div
                key={cat.name}
                className="bg-bg/60 border border-white/5 rounded-2xl p-3 flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center shrink-0 border border-white/5">
                    <CategoryIcon category={cat.name} size={16} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-white truncate">{cat.name}</p>
                    <p className="text-[10px] text-muted">{cat.group}</p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 bg-surface border border-white/10 rounded-xl px-2.5 py-1.5 w-36 shrink-0 focus-within:border-teal/50">
                  <span className="text-[11px] text-muted font-bold">Rp</span>
                  <input
                    inputMode="numeric"
                    placeholder="0"
                    value={displayVal}
                    onChange={(e) => handleLimitChange(cat.name, e.target.value)}
                    className="bg-transparent text-white text-xs font-bold outline-none w-full text-right placeholder:text-muted/30"
                  />
                </div>
              </div>
            );
          })}
        </div>

        <div className="px-5 sm:px-6 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-3 border-t border-bline">
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="w-full py-3.5 px-4 rounded-2xl bg-teal text-[#0B1215] font-bold text-xs sm:text-sm shadow-lg shadow-teal/30 hover:opacity-95 active:scale-[0.99] transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
          >
            <Check size={18} className="stroke-[2.5]" />
            <span>{saving ? 'Saving...' : 'Save Budget Caps'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
