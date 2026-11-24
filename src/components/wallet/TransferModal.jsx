// src/components/wallet/TransferModal.jsx
// Modal for transferring money between wallets with optional admin fee (English UI)

import { useState, useEffect } from 'react';
import { X, ArrowDownUp, Check, AlertCircle } from 'lucide-react';
import { transferBetweenWallets } from '../../lib/firebase';
import { formatRupiah } from '../../lib/utils';
import { useToast } from '../../contexts/ToastContext';
import WalletPicker from './WalletPicker';

export default function TransferModal({ isOpen, onClose, wallets, userId, onSuccess, preselectedFromWalletId }) {
  const toast = useToast();
  const [fromWalletId, setFromWalletId] = useState('');
  const [toWalletId, setToWalletId]     = useState('');
  const [amount, setAmount]             = useState('');
  const [adminFee, setAdminFee]         = useState('');
  const [date, setDate]                 = useState(new Date().toISOString().split('T')[0]);
  const [note, setNote]                 = useState('');
  const [saving, setSaving]             = useState(false);
  const [error, setError]               = useState('');

  useEffect(() => {
    if (isOpen) {
      setError('');
      setAmount('');
      setAdminFee('');
      setNote('');
      setDate(new Date().toISOString().split('T')[0]);

      if (wallets.length >= 2) {
        const defaultFrom = preselectedFromWalletId || wallets[0].id;
        setFromWalletId(defaultFrom);
        const defaultTo = wallets.find(w => w.id !== defaultFrom)?.id || '';
        setToWalletId(defaultTo);
      } else if (wallets.length === 1) {
        setFromWalletId(wallets[0].id);
        setToWalletId('');
      }
    }
  }, [isOpen, wallets, preselectedFromWalletId]);

  if (!isOpen) return null;

  const fromWallet = wallets.find(w => w.id === fromWalletId);
  const toWallet   = wallets.find(w => w.id === toWalletId);

  const numAmount   = amount ? parseInt(amount, 10) : 0;
  const numAdminFee = adminFee ? parseInt(adminFee, 10) : 0;
  const totalDeduct = numAmount + numAdminFee;
  const fromBalance = fromWallet?.balance || 0;
  const isInsufficient = fromWallet && totalDeduct > fromBalance;

  const handleAmountChange = (e) => {
    const raw = e.target.value.replace(/\D/g, '');
    setAmount(raw);
  };

  const handleAdminFeeChange = (e) => {
    const raw = e.target.value.replace(/\D/g, '');
    setAdminFee(raw);
  };

  const formatDisplay = (raw) => {
    if (!raw) return '';
    return new Intl.NumberFormat('id-ID').format(parseInt(raw, 10));
  };

  const handleSwapWallets = () => {
    if (fromWalletId && toWalletId) {
      setFromWalletId(toWalletId);
      setToWalletId(fromWalletId);
    }
  };

  const handleTransfer = async (e) => {
    e.preventDefault();
    if (!fromWalletId) { setError('Select source wallet'); return; }
    if (!toWalletId) { setError('Select destination wallet'); return; }
    if (fromWalletId === toWalletId) { setError('Source and destination wallets cannot be the same'); return; }
    if (numAmount <= 0) { setError('Transfer amount must be greater than 0'); return; }
    if (isInsufficient) { setError('Insufficient balance in source wallet'); return; }

    setSaving(true);
    setError('');

    try {
      await transferBetweenWallets(userId, {
        fromWalletId,
        toWalletId,
        fromWalletName: fromWallet?.name || '',
        toWalletName: toWallet?.name || '',
        amount: numAmount,
        adminFee: numAdminFee,
        date: new Date(date),
        note,
      });

      toast.success(`Transferred ${formatRupiah(numAmount)} successfully!`);
      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      console.error('Transfer error:', err);
      setError(err.message || 'Failed to complete transfer');
      toast.error(err.message || 'Failed to complete transfer');
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
        className="bg-surface w-full max-w-md mx-auto rounded-3xl border border-bline flex flex-col shadow-2xl max-h-[90vh] sm:max-h-[88vh] overflow-hidden"
      >
        <div className="flex items-center justify-between px-5 sm:px-6 pt-5 pb-3.5 border-b border-bline">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-teal/15 flex items-center justify-center text-teal">
              <ArrowDownUp size={18} />
            </div>
            <div>
              <h2 className="text-main text-base font-bold">Inter-Wallet Transfer</h2>
              <p className="text-[11px] text-muted">Move funds between your accounts</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-subcard flex items-center justify-center text-muted hover:text-main transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {wallets.length < 2 && (
          <div className="mx-5 sm:mx-6 mt-3 p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs flex items-center gap-2">
            <AlertCircle size={16} className="shrink-0" />
            <span>You need at least 2 wallets to transfer funds.</span>
          </div>
        )}

        {error && (
          <div className="mx-5 sm:mx-6 mt-3 p-3 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs">
            {error}
          </div>
        )}

        <form onSubmit={handleTransfer} className="modal-scroll flex-1 px-5 sm:px-6 py-4 pb-[max(1.25rem,env(safe-area-inset-bottom))] space-y-4">
          <div className="bg-bg border border-bline rounded-2xl p-3.5 space-y-3 relative">
            <WalletPicker
              label="From Wallet (Source)"
              wallets={wallets}
              value={fromWalletId}
              onChange={setFromWalletId}
              placeholder="Select Source Wallet"
            />

            <div className="flex justify-center -my-1">
              <button
                type="button"
                onClick={handleSwapWallets}
                className="w-7 h-7 rounded-full bg-subcard border border-bline flex items-center justify-center text-muted hover:text-teal transition-colors cursor-pointer shadow-xs"
                title="Swap Wallets"
              >
                <ArrowDownUp size={13} />
              </button>
            </div>

            <WalletPicker
              label="To Wallet (Destination)"
              wallets={wallets}
              value={toWalletId}
              onChange={setToWalletId}
              disabledId={fromWalletId}
              placeholder="Select Destination Wallet"
            />
          </div>

          <div>
            <label className="text-muted text-xs font-medium block mb-1.5">
              Transfer Amount
            </label>
            <div className="flex items-center gap-2 bg-bg border border-white/5 rounded-2xl px-4 py-3 focus-within:border-teal/50">
              <span className="text-muted font-bold text-sm">Rp</span>
              <input
                inputMode="numeric"
                value={formatDisplay(amount)}
                onChange={handleAmountChange}
                placeholder="0"
                className="bg-transparent text-white font-bold text-xl outline-none flex-1 placeholder:text-muted/30"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-muted text-xs font-medium">
                Admin Fee (Optional)
              </label>
              <div className="flex gap-1">
                {[0, 1000, 2500, 6500].map((fee) => (
                  <button
                    key={fee}
                    type="button"
                    onClick={() => setAdminFee(fee === 0 ? '' : String(fee))}
                    className="text-[10px] px-2 py-0.5 rounded-lg bg-white/5 hover:bg-white/10 text-muted transition-colors cursor-pointer"
                  >
                    {fee === 0 ? 'Free' : `Rp ${fee.toLocaleString('id-ID')}`}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-2 bg-bg border border-white/5 rounded-2xl px-4 py-2.5 focus-within:border-teal/50">
              <span className="text-muted font-bold text-xs">Rp</span>
              <input
                inputMode="numeric"
                value={formatDisplay(adminFee)}
                onChange={handleAdminFeeChange}
                placeholder="0 (Free / No fee)"
                className="bg-transparent text-white text-sm outline-none flex-1 placeholder:text-muted/30"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-muted text-xs font-medium block mb-1">
                Date
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-bg border border-white/5 rounded-xl px-3 py-2 text-white text-xs outline-none"
              />
            </div>
            <div>
              <label className="text-muted text-xs font-medium block mb-1">
                Note (Optional)
              </label>
              <input
                type="text"
                placeholder="Top up, savings, etc"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="w-full bg-bg border border-white/5 rounded-xl px-3 py-2 text-white text-xs outline-none placeholder:text-muted/40"
              />
            </div>
          </div>

          {numAmount > 0 && fromWallet && (
            <div className="p-3 rounded-2xl bg-white/5 border border-white/5 space-y-1.5 text-xs">
              <div className="flex justify-between text-muted">
                <span>Received in {toWallet?.name || 'Destination'}:</span>
                <span className="text-green-400 font-semibold">{formatRupiah(numAmount)}</span>
              </div>
              {numAdminFee > 0 && (
                <div className="flex justify-between text-muted">
                  <span>Admin Fee:</span>
                  <span className="text-red-400 font-semibold">{formatRupiah(numAdminFee)}</span>
                </div>
              )}
              <div className="pt-1 border-t border-bline flex justify-between font-semibold">
                <span className="text-main">Total Deducted from {fromWallet.name}:</span>
                <span className={isInsufficient ? 'text-red-400' : 'text-main'}>
                  {formatRupiah(totalDeduct)}
                </span>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={saving || isInsufficient || wallets.length < 2 || !fromWalletId || !toWalletId || numAmount <= 0}
            className="w-full py-3.5 px-4 rounded-2xl bg-teal text-[#0B1215] font-bold text-sm shadow-lg shadow-teal/30 hover:opacity-95 active:scale-[0.99] transition-all flex items-center justify-center gap-2 disabled:opacity-40 disabled:pointer-events-none mt-2 cursor-pointer"
          >
            <Check size={18} className="stroke-[2.5]" />
            <span>{saving ? 'Processing...' : 'Confirm Transfer'}</span>
          </button>
        </form>
      </div>
    </div>
  );
}
