// src/components/transaction/EditTransactionModal.jsx
// Modal to edit or delete an existing transaction with atomic wallet balance adjustment

import { useState, useEffect } from 'react';
import { X, Check, Trash2, Calendar, FileText, AlertCircle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import {
  getWallets,
  updateTransactionAtomic,
  deleteTransactionAtomic,
} from '../../lib/firebase';
import {
  ZERO_BASED_EXPENSES,
  ZERO_BASED_INCOMES,
  SAVINGS_TARGET_CATEGORIES,
  DEBT_CATEGORIES,
} from '../../lib/utils';
import WalletPicker from '../wallet/WalletPicker';

function getCategoriesForType(type) {
  if (type === 'income') return ZERO_BASED_INCOMES;
  if (type === 'savings') return SAVINGS_TARGET_CATEGORIES;
  if (type === 'debt') return DEBT_CATEGORIES;
  return ZERO_BASED_EXPENSES;
}

function toInputDate(ts) {
  if (!ts) return new Date().toISOString().split('T')[0];
  const d = ts?.toDate ? ts.toDate() : new Date(ts);
  if (isNaN(d.getTime())) return new Date().toISOString().split('T')[0];
  return d.toISOString().split('T')[0];
}

export default function EditTransactionModal({ isOpen, onClose, transaction, onSaved }) {
  const { user } = useAuth();
  const toast = useToast();

  const [wallets, setWallets]       = useState([]);
  const [amount, setAmount]         = useState('');
  const [category, setCategory]     = useState('');
  const [walletId, setWalletId]     = useState('');
  const [toWalletId, setToWalletId] = useState('');
  const [adminFee, setAdminFee]     = useState('');
  const [date, setDate]             = useState('');
  const [note, setNote]             = useState('');
  const [saving, setSaving]         = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [error, setError]           = useState('');

  useEffect(() => {
    if (isOpen && transaction && user?.uid) {
      setAmount(transaction.amount ? String(transaction.amount) : '');
      setCategory(transaction.category || '');
      setWalletId(transaction.walletId || '');
      setToWalletId(transaction.toWalletId || '');
      setAdminFee(transaction.adminFee ? String(transaction.adminFee) : '');
      setDate(toInputDate(transaction.date));
      setNote(transaction.note || '');
      setError('');
      setSaving(false);
      setConfirmDelete(false);

      getWallets(user.uid).then(setWallets).catch(console.error);
    }
  }, [isOpen, transaction, user?.uid]);

  if (!isOpen || !transaction) return null;

  const isTransfer = transaction.type === 'transfer';
  const categories = getCategoriesForType(transaction.type);

  const handleAmountChange = (setter) => (e) => {
    const raw = e.target.value.replace(/\D/g, '');
    setter(raw);
  };

  const formatDisplay = (raw) => {
    if (!raw) return '';
    return new Intl.NumberFormat('id-ID').format(parseInt(raw, 10));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    const numAmt = amount ? parseInt(amount, 10) : 0;
    const numFee = adminFee ? parseInt(adminFee, 10) : 0;

    if (numAmt <= 0) {
      setError('Amount must be greater than 0');
      return;
    }
    if (isTransfer && (!walletId || !toWalletId || walletId === toWalletId)) {
      setError('Please select two different wallets for transfer');
      return;
    }

    setSaving(true);
    setError('');
    try {
      await updateTransactionAtomic(transaction.id, {
        amount: numAmt,
        adminFee: isTransfer ? numFee : 0,
        category,
        walletId: walletId || null,
        toWalletId: isTransfer ? toWalletId : null,
        date: date ? new Date(`${date}T12:00:00`) : new Date(),
        note,
      });
      toast.success('Transaction updated!');
      setSaving(false);
      if (onSaved) onSaved();
      onClose();
    } catch (err) {
      console.error('Error updating transaction:', err);
      const msg = err.message || 'Failed to update transaction';
      setError(msg);
      toast.error(msg);
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    setSaving(true);
    setError('');
    try {
      await deleteTransactionAtomic(transaction.id);
      toast.warning('Transaction deleted & wallet balance restored.');
      setSaving(false);
      setConfirmDelete(false);
      if (onSaved) onSaved();
      onClose();
    } catch (err) {
      console.error('Error deleting transaction:', err);
      const msg = err.message || 'Failed to delete transaction';
      setError(msg);
      toast.error(msg);
      setSaving(false);
      setConfirmDelete(false);
    }
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-surface w-full max-w-md mx-auto rounded-3xl border border-bline flex flex-col shadow-2xl max-h-[90vh] sm:max-h-[88vh] overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 sm:px-6 pt-5 pb-3.5 border-b border-bline">
          <div>
            <h2 className="text-main text-lg font-bold">Edit Transaction</h2>
            <p className="text-muted text-[11px] capitalize">{transaction.type} record</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-subcard flex items-center justify-center text-muted hover:text-main transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {error && (
          <div className="mx-5 sm:mx-6 mt-3 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-2">
            <AlertCircle size={15} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form
          onSubmit={handleSave}
          className="modal-scroll flex-1 px-5 sm:px-6 py-4 pb-[max(1.25rem,env(safe-area-inset-bottom))] space-y-4 overflow-y-auto"
        >
          {/* Amount */}
          <div>
            <label className="text-muted text-xs font-medium block mb-1.5">Amount</label>
            <div className="flex items-center gap-2 bg-bg border border-bline rounded-2xl px-4 py-3 focus-within:border-teal/50">
              <span className="text-muted font-bold text-sm">Rp</span>
              <input
                inputMode="numeric"
                value={formatDisplay(amount)}
                onChange={handleAmountChange(setAmount)}
                placeholder="0"
                className="bg-transparent text-main font-bold text-xl outline-none flex-1 placeholder:text-muted/30"
                required
              />
            </div>
          </div>

          {/* Category (non-transfer) */}
          {!isTransfer && (
            <div>
              <label className="text-muted text-xs font-medium block mb-1.5">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-bg border border-bline rounded-2xl px-3.5 py-2.5 text-main text-sm font-medium outline-none focus:border-teal/50"
              >
                {!categories.some((c) => c.name === category) && category && (
                  <option value={category}>{category}</option>
                )}
                {categories.map((c) => (
                  <option key={c.name} value={c.name}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Wallets */}
          {wallets.length > 0 && (
            <div className="space-y-3">
              <WalletPicker
                wallets={wallets}
                selectedId={walletId}
                onChange={setWalletId}
                label={isTransfer ? 'From Wallet' : 'Wallet'}
              />
              {isTransfer && (
                <>
                  <WalletPicker
                    wallets={wallets}
                    selectedId={toWalletId}
                    onChange={setToWalletId}
                    label="To Wallet"
                  />
                  <div>
                    <label className="text-muted text-xs font-medium block mb-1.5">
                      Admin Fee (Optional)
                    </label>
                    <div className="flex items-center gap-2 bg-bg border border-bline rounded-2xl px-3.5 py-2.5 focus-within:border-teal/50">
                      <span className="text-muted font-bold text-xs">Rp</span>
                      <input
                        inputMode="numeric"
                        value={formatDisplay(adminFee)}
                        onChange={handleAmountChange(setAdminFee)}
                        placeholder="0"
                        className="bg-transparent text-main font-semibold text-sm outline-none flex-1 placeholder:text-muted/30"
                      />
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Date */}
          <div>
            <label className="text-muted text-xs font-medium block mb-1.5">Date</label>
            <div className="flex items-center gap-2.5 bg-bg border border-bline rounded-2xl px-3.5 py-2.5 focus-within:border-teal/50">
              <Calendar size={16} className="text-muted shrink-0" />
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="bg-transparent text-main text-sm font-medium outline-none flex-1"
                required
              />
            </div>
          </div>

          {/* Note */}
          <div>
            <label className="text-muted text-xs font-medium block mb-1.5">Note</label>
            <div className="flex items-center gap-2.5 bg-bg border border-bline rounded-2xl px-3.5 py-2.5 focus-within:border-teal/50">
              <FileText size={16} className="text-muted shrink-0" />
              <input
                type="text"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Add a note (optional)"
                className="bg-transparent text-main text-sm outline-none flex-1 placeholder:text-muted/40"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="pt-2 flex gap-2">
            <button
              type="button"
              onClick={handleDelete}
              disabled={saving}
              className={`py-3 px-4 rounded-2xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                confirmDelete
                  ? 'bg-red-500/20 border-red-500/40 text-red-400 hover:bg-red-500/30'
                  : 'bg-subcard border-bline text-muted hover:text-red-400'
              }`}
            >
              <Trash2 size={16} />
              <span>{confirmDelete ? 'Confirm?' : 'Delete'}</span>
            </button>

            <button
              type="submit"
              disabled={saving}
              className="flex-1 py-3 px-4 rounded-2xl bg-teal text-[#0B1215] font-bold text-sm shadow-lg shadow-teal/30 hover:opacity-95 active:scale-[0.99] transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
            >
              <Check size={18} className="stroke-[2.5]" />
              <span>{saving ? 'Saving...' : 'Save Changes'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
