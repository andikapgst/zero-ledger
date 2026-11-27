// src/components/wallet/WalletModal.jsx
// Modal for creating and editing a wallet (English UI)

import { useState, useEffect } from 'react';
import { X, Check, Building2, Wallet, Smartphone, TrendingUp, Trash2 } from 'lucide-react';
import { addWallet, updateWallet, deleteWallet } from '../../lib/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
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
  const { user } = useAuth();
  const toast = useToast();
  const isEdit = Boolean(walletToEdit);

  const [name, setName]         = useState('');
  const [type, setType]         = useState('bank');
  const [currency, setCurrency] = useState('IDR');
  const [balance, setBalance]   = useState('');
  const [color, setColor]       = useState('#2DD4BF');
  const [coinSymbol, setCoinSymbol] = useState('');
  const [coinAmount, setCoinAmount] = useState('');
  const [isDefault, setIsDefault] = useState(false);
  const [saving, setSaving]     = useState(false);
  const [error, setError]       = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    if (walletToEdit) {
      setName(walletToEdit.name || '');
      setType(walletToEdit.type || 'bank');
      setCurrency(walletToEdit.currency || 'IDR');
      setBalance(walletToEdit.balance !== undefined ? String(walletToEdit.balance) : '');
      setColor(walletToEdit.color || '#2DD4BF');
      setCoinSymbol(walletToEdit.coinSymbol || '');
      setCoinAmount(walletToEdit.coinAmount ? String(walletToEdit.coinAmount) : '');
      setIsDefault(Boolean(walletToEdit.isDefault));
    } else {
      setName('');
      setType('bank');
      setCurrency('IDR');
      setBalance('');
      setColor('#2DD4BF');
      setCoinSymbol('');
      setCoinAmount('');
      setIsDefault(false);
    }
    setError('');
    setConfirmDelete(false);
    setSaving(false);
  }, [walletToEdit, isOpen]);

  if (!isOpen) return null;

  const handleBalanceChange = (e) => {
    if (currency === 'USD') {
      // Allow numbers and a single decimal point
      const raw = e.target.value.replace(/[^0-9.]/g, '');
      const parts = raw.split('.');
      const cleaned = parts.length > 2 ? `${parts[0]}.${parts.slice(1).join('')}` : raw;
      setBalance(cleaned);
    } else {
      const raw = e.target.value.replace(/\D/g, '');
      setBalance(raw);
    }
  };

  const formatDisplayBalance = (raw) => {
    if (!raw) return '';
    if (currency === 'USD') return raw;
    return new Intl.NumberFormat('id-ID').format(parseInt(raw, 10));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    const activeUid = userId || user?.uid;
    if (!activeUid) {
      setError('User not authenticated. Please log in again.');
      toast.error('Not authenticated. Please log in again.');
      return;
    }

    if (!name.trim()) {
      setError('Wallet name cannot be empty');
      return;
    }

    const numBalance = balance
      ? (currency === 'USD' ? parseFloat(balance) || 0 : parseInt(balance.replace(/\./g, ''), 10) || 0)
      : 0;
    setSaving(true);
    setError('');

    const numCoinAmount = coinAmount ? parseFloat(coinAmount) || 0 : 0;
    const cleanCoinSymbol = coinSymbol.trim().toUpperCase();

    try {
      if (isEdit) {
        await updateWallet(walletToEdit.id, {
          name: name.trim(),
          type,
          currency,
          balance: numBalance,
          color,
          coinSymbol: cleanCoinSymbol,
          coinAmount: numCoinAmount,
          isDefault,
        });
        toast.info(`Wallet "${name.trim()}" updated!`);
      } else {
        await addWallet(activeUid, {
          name: name.trim(),
          type,
          currency,
          balance: numBalance,
          color,
          coinSymbol: cleanCoinSymbol,
          coinAmount: numCoinAmount,
          isDefault,
        });
        toast.success(`Wallet "${name.trim()}" created!`);
      }
      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      console.error('[WalletModal] Error saving wallet:', err);
      const msg = err.message || 'Failed to save wallet';
      setError(msg);
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (!walletToEdit?.id) return;

    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }

    setSaving(true);
    try {
      await deleteWallet(walletToEdit.id);
      toast.warning(`Wallet "${walletToEdit.name}" deleted.`);
      setSaving(false);
      setConfirmDelete(false);
      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      console.error('Error deleting wallet:', err);
      setError('Failed to delete wallet');
      toast.error('Failed to delete wallet');
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
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-muted text-xs font-medium">
                {isEdit ? `Current Balance (${currency})` : `Initial Balance (${currency})`}
              </label>
              <div className="flex items-center gap-1 bg-bg border border-bline rounded-xl p-0.5">
                {['IDR', 'USD'].map((cur) => (
                  <button
                    key={cur}
                    type="button"
                    onClick={() => {
                      setCurrency(cur);
                      setBalance('');
                    }}
                    className={`px-2.5 py-0.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                      currency === cur
                        ? 'bg-teal text-[#0B1215] shadow-sm'
                        : 'text-muted hover:text-main'
                    }`}
                  >
                    {cur}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-2 bg-bg border border-bline rounded-2xl px-4 py-3 focus-within:border-teal/50">
              <span className="text-muted font-bold text-sm">{currency === 'USD' ? '$' : 'Rp'}</span>
              <input
                inputMode={currency === 'USD' ? 'decimal' : 'numeric'}
                value={formatDisplayBalance(balance)}
                onChange={handleBalanceChange}
                placeholder={currency === 'USD' ? '0.00' : '0'}
                className="bg-transparent text-main font-bold text-lg outline-none flex-1 placeholder:text-muted/30"
              />
            </div>
          </div>

          <div>
            <label className="text-muted text-xs font-medium block mb-1.5">
              Crypto / Coin Holding <span className="text-muted/60">(Optional, not counted in IDR total)</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="text"
                placeholder="Coin (e.g. SUI)"
                value={coinSymbol}
                onChange={(e) => setCoinSymbol(e.target.value.toUpperCase())}
                maxLength={10}
                className="bg-bg border border-bline rounded-2xl px-3.5 py-2.5 text-main text-sm font-semibold uppercase outline-none focus:border-teal/50 placeholder:text-muted/40 placeholder:normal-case placeholder:font-normal"
              />
              <input
                inputMode="decimal"
                placeholder="Amount (e.g. 150)"
                value={coinAmount}
                onChange={(e) => {
                  const raw = e.target.value.replace(/[^0-9.]/g, '');
                  const parts = raw.split('.');
                  setCoinAmount(parts.length > 2 ? `${parts[0]}.${parts.slice(1).join('')}` : raw);
                }}
                className="bg-bg border border-bline rounded-2xl px-3.5 py-2.5 text-main text-sm font-semibold outline-none focus:border-teal/50 placeholder:text-muted/40 placeholder:font-normal"
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
