// src/components/debt/SettleHutangModal.jsx
// Modal for settling or partially paying debt / receivable (English UI)

import { useState, useEffect } from 'react';
import { X, Check, AlertCircle, ArrowUpRight, ArrowDownLeft } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { getWallets, settleDebtAtomic } from '../../lib/firebase';
import { formatRupiah } from '../../lib/utils';
import WalletPicker from '../wallet/WalletPicker';

export default function SettleHutangModal({ isOpen, onClose, debt, onSuccess }) {
  const { user } = useAuth();

  const [settleAmount, setSettleAmount] = useState('');
  const [walletId, setWalletId]         = useState('');
  const [note, setNote]                 = useState('');
  const [date, setDate]                 = useState(new Date().toISOString().split('T')[0]);
  const [wallets, setWallets]           = useState([]);
  const [saving, setSaving]             = useState(false);
  const [error, setError]               = useState('');

  const isMyDebt = debt?.type === 'debt';
  const totalAmount = Number(debt?.amount) || 0;
  const paidAmount  = Number(debt?.paidAmount) || 0;
  const remaining   = Math.max(0, totalAmount - paidAmount);

  useEffect(() => {
    if (isOpen && user && debt) {
      setSettleAmount(String(remaining));
      setNote('');
      setDate(new Date().toISOString().split('T')[0]);
      setError('');

      getWallets(user.uid).then(wList => {
        setWallets(wList);
        if (wList.length > 0) {
          const defaultW = wList.find(w => w.isDefault) || wList[0];
          setWalletId(defaultW.id);
        }
      });
    }
  }, [isOpen, user, debt, remaining]);

  if (!isOpen || !debt) return null;

  const handleAmountChange = (e) => {
    const raw = e.target.value.replace(/\D/g, '');
    setSettleAmount(raw);
  };

  const formatDisplay = (raw) => {
    if (!raw) return '';
    return new Intl.NumberFormat('id-ID').format(parseInt(raw, 10));
  };

  const numSettle = parseInt(settleAmount, 10) || 0;
  const isFullSettle = numSettle >= remaining;
  const selectedWallet = wallets.find(w => w.id === walletId);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (numSettle <= 0) {
      setError('Please enter a valid payment amount');
      return;
    }
    if (numSettle > remaining) {
      setError(`Amount exceeds remaining balance (${formatRupiah(remaining)})`);
      return;
    }
    if (!walletId) {
      setError('Please select a wallet');
      return;
    }

    if (isMyDebt && selectedWallet && (selectedWallet.balance || 0) < numSettle) {
      setError(`Insufficient balance in ${selectedWallet.name} (${formatRupiah(selectedWallet.balance || 0)})`);
      return;
    }

    setSaving(true);
    setError('');

    try {
      await settleDebtAtomic(user.uid, {
        debtId: debt.id,
        settleAmount: numSettle,
        walletId,
        note,
        date: new Date(date),
      });

      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      console.error('Error settling debt:', err);
      setError(err.message || 'Payment failed');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-surface w-full max-w-md rounded-t-3xl sm:rounded-3xl border border-bline flex flex-col shadow-2xl max-h-[92vh] overflow-hidden"
      >
        <div className="flex items-center justify-between px-5 sm:px-6 pt-5 pb-3.5 border-b border-bline">
          <div className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
              isMyDebt ? 'bg-amber-500/15 text-amber-500' : 'bg-green-500/15 text-green-500'
            }`}>
              {isMyDebt ? <ArrowUpRight size={18} /> : <ArrowDownLeft size={18} />}
            </div>
            <div>
              <h2 className="text-main text-base font-bold">
                {isMyDebt ? 'Pay Borrowed Debt' : 'Receive Loan Payment'}
              </h2>
              <p className="text-[11px] text-muted">{debt.person}</p>
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

        <div className="modal-scroll flex-1 px-5 sm:px-6 py-4 space-y-4">
          <div className="bg-bg border border-bline rounded-2xl p-3.5 space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-muted">Total Amount:</span>
              <span className="text-main font-semibold">{formatRupiah(totalAmount)}</span>
            </div>
            {paidAmount > 0 && (
              <div className="flex justify-between text-xs">
                <span className="text-muted">Already Settled:</span>
                <span className="text-green-500 font-semibold">{formatRupiah(paidAmount)}</span>
              </div>
            )}
            <div className="flex justify-between text-xs pt-1 border-t border-bline font-bold">
              <span className="text-muted">Remaining Balance:</span>
              <span className="text-teal">{formatRupiah(remaining)}</span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-muted text-xs font-medium">Payment Amount</label>
              <button
                type="button"
                onClick={() => setSettleAmount(String(remaining))}
                className="text-[10px] text-teal hover:underline font-semibold cursor-pointer"
              >
                Pay in Full ({formatRupiah(remaining)})
              </button>
            </div>
            <div className="flex items-center gap-2 bg-bg border border-white/5 rounded-2xl px-4 py-3 focus-within:border-teal/50">
              <span className="text-muted font-bold text-sm">Rp</span>
              <input
                inputMode="numeric"
                value={formatDisplay(settleAmount)}
                onChange={handleAmountChange}
                placeholder="0"
                className="bg-transparent text-white font-extrabold text-xl outline-none flex-1 placeholder:text-muted/30"
                required
              />
            </div>
            {isFullSettle ? (
              <p className="text-[11px] text-green-400 mt-1 font-medium">
                ✓ Will be marked as FULLY SETTLED
              </p>
            ) : (
              <p className="text-[11px] text-muted mt-1">
                Remaining after payment: {formatRupiah(Math.max(0, remaining - numSettle))} (Partial)
              </p>
            )}
          </div>

          <WalletPicker
            label={isMyDebt ? 'Source Wallet (Funds Deducted)' : 'Receiving Wallet (Funds Credited)'}
            wallets={wallets}
            value={walletId}
            onChange={setWalletId}
            placeholder="Select Wallet"
          />

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-muted text-xs font-medium block mb-1">Date</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-bg border border-white/5 rounded-xl px-3 py-2 text-white text-xs outline-none"
              />
            </div>
            <div>
              <label className="text-muted text-xs font-medium block mb-1">Note (Optional)</label>
              <input
                type="text"
                placeholder="Installment 1, full settle, etc"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="w-full bg-bg border border-white/5 rounded-xl px-3 py-2 text-white text-xs outline-none placeholder:text-muted/40"
              />
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={saving || numSettle <= 0 || !walletId}
              className="w-full py-3.5 px-4 rounded-2xl bg-teal text-[#0B1215] font-bold text-xs sm:text-sm shadow-lg shadow-teal/30 hover:opacity-95 active:scale-[0.99] transition-all flex items-center justify-center gap-2 disabled:opacity-40 cursor-pointer"
            >
              <Check size={18} className="stroke-[2.5]" />
              <span>{saving ? 'Processing...' : isFullSettle ? 'Confirm Full Settlement' : 'Confirm Installment'}</span>
            </button>
          </div>
        </form>
        </div>
      </div>
    </div>
  );
}
