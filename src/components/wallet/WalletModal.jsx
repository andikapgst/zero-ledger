// src/components/wallet/WalletModal.jsx
// Modal for creating and editing a wallet (English UI)

import { useState, useEffect } from 'react';
import { X, Check, Building2, Wallet, Smartphone, TrendingUp, Trash2 } from 'lucide-react';
import { addWallet, updateWallet, deleteWallet } from '../../lib/firebase';
import WalletLogo from './WalletLogo';

const WALLET_TYPES = [
  { value: 'bank',       label: 'Bank',       icon: Building2, desc: 'BCA, Mandiri, Jago, etc' },
  { value: 'e-wallet',   label: 'E-Wallet',   icon: Smartphone, desc: 'GoPay, OVO, Dana, etc' },
  { value: 'cash',       label: 'Cash',       icon: Wallet,     desc: 'Physical cash in wallet' },
  { value: 'investment', label: 'Investment', icon: TrendingUp, desc: 'Stocks, mutual funds, crypto' },
];

const PRESET_COLORS = [
  '#2DD4BF', // Teal
  '#38BDF8', // Sky Blue
  '#818CF8', // Indigo
  '#A78BFA', // Purple
  '#F472B6', // Pink
  '#FB923C', // Orange
  '#FBBF24', // Amber
  '#4ADE80', // Emerald
];

export default function WalletModal({ isOpen, onClose, walletToEdit, userId, onSuccess }) {
  const isEdit = Boolean(walletToEdit);

  const [name, setName]         = useState('');
  const [type, setType]         = useState('bank');
  const [balance, setBalance]   = useState('');
  const [color, setColor]       = useState('#2DD4BF');
  const [isDefault, setIsDefault] = useState(false);
  const [saving, setSaving]     = useState(false);
  const [error, setError]       = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    if (walletToEdit) {
      setName(walletToEdit.name || '');
      setType(walletToEdit.type || 'bank');
      setBalance(walletToEdit.balance !== undefined ? String(walletToEdit.balance) : '');
      setColor(walletToEdit.color || '#2DD4BF');
      setIsDefault(Boolean(walletToEdit.isDefault));
    } else {
      setName('');
      setType('bank');
      setBalance('');
      setColor('#2DD4BF');
      setIsDefault(false);
    }
    setError('');
    setConfirmDelete(false);
  }, [walletToEdit, isOpen]);

  if (!isOpen) return null;

  const handleBalanceChange = (e) => {
    const raw = e.target.value.replace(/\D/g, '');
    setBalance(raw);
  };

  const formatDisplayBalance = (raw) => {
    if (!raw) return '';
    return new Intl.NumberFormat('id-ID').format(parseInt(raw, 10));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Wallet name cannot be empty');
      return;
    }

    const numBalance = balance ? parseInt(balance, 10) : 0;
    setSaving(true);
    setError('');

    try {
      if (isEdit) {
        await updateWallet(walletToEdit.id, {
          name: name.trim(),
          type,
          balance: numBalance,
          color,
          isDefault,
        });
      } else {
        await addWallet(userId, {
          name: name.trim(),
          type,
          balance: numBalance,
          color,
          isDefault,
        });
      }
      onSuccess();
      onClose();
    } catch (err) {
      console.error('Error saving wallet:', err);
      setError(err.message || 'Failed to save wallet');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    setSaving(true);
    try {
      await deleteWallet(walletToEdit.id);
      onSuccess();
      onClose();
    } catch (err) {
      console.error('Error deleting wallet:', err);
      setError('Failed to delete wallet');
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
          <h2 className="text-main text-lg font-bold">
            {isEdit ? 'Edit Wallet' : 'Add New Wallet'}
          </h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-subcard flex items-center justify-center text-muted hover:text-main transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {error && (
          <div className="mx-5 sm:mx-6 mt-3 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs">
            {error}
          </div>
        )}

        <form onSubmit={handleSave} className="modal-scroll flex-1 px-5 sm:px-6 py-4 pb-[max(1.25rem,env(safe-area-inset-bottom))] space-y-4">
          <div>
            <label className="text-muted text-xs font-medium block mb-1.5">
              Wallet / Account Name
            </label>
            <div className="flex items-center gap-2.5 bg-bg border border-bline rounded-2xl px-3.5 py-2.5 focus-within:border-teal/50">
              <WalletLogo name={name} type={type} size="md" />
              <input
                type="text"
                placeholder="e.g. BCA, Bank Jago, ShopeePay, GoPay"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-transparent text-main text-sm outline-none placeholder:text-muted/40 font-medium"
                required
              />
            </div>
          </div>

          <div>
            <label className="text-muted text-xs font-medium block mb-1.5">
              Account Type
            </label>
            <div className="grid grid-cols-2 gap-2">
              {WALLET_TYPES.map((t) => {
                const Icon = t.icon;
                const isSelected = type === t.value;
                return (
                  <button
                    key={t.value}
                    type="button"
                    onClick={() => setType(t.value)}
                    className={`flex items-start gap-2.5 p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-teal/15 border-teal/50 text-teal'
                        : 'bg-bg border-white/5 text-muted hover:border-white/10 hover:text-white'
                    }`}
                  >
                    <Icon size={18} className="mt-0.5 shrink-0" />
                    <div>
                      <p className="text-xs font-semibold">{t.label}</p>
                      <p className="text-[10px] text-muted/70 leading-tight mt-0.5 line-clamp-1">{t.desc}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="text-muted text-xs font-medium block mb-1.5">
              {isEdit ? 'Current Balance (Rp)' : 'Initial Balance (Rp)'}
            </label>
            <div className="flex items-center gap-2 bg-bg border border-white/5 rounded-2xl px-4 py-3 focus-within:border-teal/50">
              <span className="text-muted font-bold text-sm">Rp</span>
              <input
                inputMode="numeric"
                value={formatDisplayBalance(balance)}
                onChange={handleBalanceChange}
                placeholder="0"
                className="bg-transparent text-white font-bold text-lg outline-none flex-1 placeholder:text-muted/30"
              />
            </div>
          </div>

          <div>
            <label className="text-muted text-xs font-medium block mb-1.5">
              Color Accent
            </label>
            <div className="flex items-center gap-2 flex-wrap">
              {PRESET_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`w-7 h-7 rounded-full border-2 transition-transform cursor-pointer ${
                    color === c ? 'scale-110 border-white' : 'border-transparent'
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="isDefault"
              checked={isDefault}
              onChange={(e) => setIsDefault(e.target.checked)}
              className="accent-teal w-4 h-4 rounded cursor-pointer"
            />
            <label htmlFor="isDefault" className="text-xs text-muted cursor-pointer">
              Set as primary (default) wallet
            </label>
          </div>

          <div className="pt-3 flex gap-2">
            {isEdit && (
              <button
                type="button"
                onClick={handleDelete}
                disabled={saving}
                className={`py-3 px-4 rounded-2xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  confirmDelete
                    ? 'bg-red-500/20 border-red-500/40 text-red-400 hover:bg-red-500/30'
                    : 'bg-white/5 border-white/5 text-muted hover:text-red-400'
                }`}
              >
                <Trash2 size={16} />
                <span>{confirmDelete ? 'Confirm Delete?' : 'Delete'}</span>
              </button>
            )}

            <button
              type="submit"
              disabled={saving}
              className="flex-1 py-3 px-4 rounded-2xl bg-teal text-[#0B1215] font-bold text-sm shadow-lg shadow-teal/30 hover:opacity-95 active:scale-[0.99] transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
            >
              <Check size={18} className="stroke-[2.5]" />
              <span>{saving ? 'Saving...' : isEdit ? 'Save Changes' : 'Create Wallet'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
