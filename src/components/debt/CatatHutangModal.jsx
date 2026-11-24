// src/components/debt/CatatHutangModal.jsx
// Modal for recording new Debt ("I Borrowed") or Receivable ("Lent to Others") - English UI

import { useState, useEffect } from 'react';
import { X, Check, HandCoins, AlertCircle, Calendar, User, FileText } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { getWallets, createDebtAtomic } from '../../lib/firebase';
import { formatRupiah } from '../../lib/utils';
import WalletPicker from '../wallet/WalletPicker';

export default function CatatHutangModal({ isOpen, onClose, onSuccess, initialType = 'receivable' }) {
  const { user } = useAuth();

  const [type, setType]         = useState(initialType); // 'debt' | 'receivable'
  const [person, setPerson]     = useState('');
  const [amount, setAmount]     = useState('');
  const [walletId, setWalletId] = useState('');
  const [note, setNote]         = useState('');
  const [dueDate, setDueDate]   = useState('');
  const [wallets, setWallets]   = useState([]);
  const [saving, setSaving]     = useState(false);
  const [error, setError]       = useState('');

  useEffect(() => {
    if (isOpen && user) {
      setType(initialType || 'receivable');
      setPerson('');
      setAmount('');
      setNote('');
      setDueDate('');
      setError('');

      getWallets(user.uid).then(wList => {
        setWallets(wList);
        if (wList.length > 0) {
          const defaultW = wList.find(w => w.isDefault) || wList[0];
          setWalletId(defaultW.id);
        }
      });
    }
  }, [isOpen, user, initialType]);

  if (!isOpen) return null;

  const handleAmountChange = (e) => {
    const raw = e.target.value.replace(/\D/g, '');
    setAmount(raw);
  };

  const formatDisplay = (raw) => {
    if (!raw) return '';
    return new Intl.NumberFormat('id-ID').format(parseInt(raw, 10));
  };

  const selectedWallet = wallets.find(w => w.id === walletId);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const numAmount = parseInt(amount, 10) || 0;
    if (!person.trim()) {
      setError('Contact / person name is required');
      return;
    }
    if (numAmount <= 0) {
      setError('Amount must be greater than 0');
      return;
    }

    setSaving(true);
    setError('');

    try {
      await createDebtAtomic(user.uid, {
        type,
        person: person.trim(),
        amount: numAmount,
        note: note.trim(),
        walletId: walletId || null,
        dueDate: dueDate || null,
      });

      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      console.error('Error creating debt:', err);
      setError(err.message || 'Failed to save record');
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
            <div className="w-8 h-8 rounded-xl bg-teal/15 flex items-center justify-center text-teal">
              <HandCoins size={18} />
            </div>
            <div>
              <h2 className="text-main text-base font-bold">Record Debt / Loan</h2>
              <p className="text-[11px] text-muted">Track lent money, split bills & personal loans</p>
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

        <form onSubmit={handleSubmit} className="modal-scroll flex-1 px-5 sm:px-6 py-4 space-y-4">
          <div className="grid grid-cols-2 gap-2 p-1 bg-bg border border-white/5 rounded-2xl">
            <button
              type="button"
              onClick={() => setType('receivable')}
              className={`py-2.5 px-3 rounded-xl text-xs font-semibold border transition-all text-center cursor-pointer ${
                type === 'receivable'
                  ? 'bg-teal/20 border-teal/50 text-teal shadow-sm'
                  : 'border-transparent text-muted hover:text-white'
              }`}
            >
              Lent to Others
              <span className="block text-[10px] font-normal opacity-70 mt-0.5">
                (Money owed to me)
              </span>
            </button>

            <button
              type="button"
              onClick={() => setType('debt')}
              className={`py-2.5 px-3 rounded-xl text-xs font-semibold border transition-all text-center cursor-pointer ${
                type === 'debt'
                  ? 'bg-amber-500/20 border-amber-500/50 text-amber-300 shadow-sm'
                  : 'border-transparent text-muted hover:text-white'
              }`}
            >
              I Borrowed
              <span className="block text-[10px] font-normal opacity-70 mt-0.5">
                (My liability to pay)
              </span>
            </button>
          </div>

          <div>
            <label className="text-muted text-xs font-medium block mb-1">
              Contact / Person Name
            </label>
            <div className="flex items-center gap-2 bg-bg border border-white/5 rounded-2xl px-3.5 py-2.5 focus-within:border-teal/50">
              <User size={16} className="text-muted shrink-0" />
              <input
                type="text"
                placeholder="e.g. Budi (Badminton), Sarah, Team"
                value={person}
                onChange={(e) => setPerson(e.target.value)}
                className="bg-transparent text-white text-xs outline-none flex-1 placeholder:text-muted/40 font-medium"
                required
              />
            </div>
          </div>

          <div className="bg-bg border border-white/5 rounded-2xl p-4 focus-within:border-teal/50">
            <p className="text-muted text-[11px] font-medium mb-1">Amount (Rp)</p>
            <div className="flex items-center gap-2">
              <span className="text-muted text-lg font-black">Rp</span>
              <input
                inputMode="numeric"
                value={formatDisplay(amount)}
                onChange={handleAmountChange}
                placeholder="0"
                className="bg-transparent text-white font-extrabold text-2xl outline-none flex-1 placeholder:text-muted/30"
                required
              />
            </div>
          </div>

          <WalletPicker
            label={type === 'receivable' ? 'Source Wallet (Money Disbursed)' : 'Receiving Wallet (Money Received)'}
            wallets={wallets}
            value={walletId}
            onChange={setWalletId}
            allowNone={true}
            noneLabel="No wallet balance change"
            placeholder="Select Wallet"
          />

          <div>
            <label className="text-muted text-xs font-medium block mb-1">Note / Description</label>
            <div className="flex items-center gap-2 bg-bg border border-white/5 rounded-2xl px-3.5 py-2.5 focus-within:border-teal/50">
              <FileText size={16} className="text-muted shrink-0" />
              <input
                type="text"
                placeholder="e.g. Badminton court rental, lunch split"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="bg-transparent text-white text-xs outline-none flex-1 placeholder:text-muted/40"
              />
            </div>
          </div>

          <div>
            <label className="text-muted text-xs font-medium block mb-1">Due Date (Optional)</label>
            <div className="flex items-center gap-2 bg-bg border border-white/5 rounded-2xl px-3 py-2">
              <Calendar size={15} className="text-muted shrink-0" />
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="bg-transparent text-white text-xs outline-none w-full"
              />
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={saving || !person.trim() || !amount}
              className="w-full py-3.5 px-4 rounded-2xl bg-teal text-[#0B1215] font-bold text-xs sm:text-sm shadow-lg shadow-teal/30 hover:opacity-95 active:scale-[0.99] transition-all flex items-center justify-center gap-2 disabled:opacity-40 cursor-pointer"
            >
              <Check size={18} className="stroke-[2.5]" />
              <span>{saving ? 'Saving...' : 'Save Record'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
