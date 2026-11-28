// src/pages/ProfilePage.jsx
// User Profile & App Preferences: Edit Display Name, PIN App Lock, Multi-Currency Rate, Privacy, CSV Export, Sign Out

import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Pencil,
  Check,
  X,
  Mail,
  ShieldCheck,
  Calendar,
  EyeOff,
  Download,
  LogOut,
  Wallet,
  ArrowLeftRight,
  Lock,
  RefreshCw,
  DollarSign,
  Camera,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { usePinLock } from '../contexts/PinLockContext';
import { getWallets, getTransactions } from '../lib/firebase';
import { getStoredUsdRate, setStoredUsdRate, fetchLiveUsdRate } from '../lib/currency';
import { formatRupiah } from '../lib/utils';
import ThemeToggle from '../components/layout/ThemeToggle';

const HIDE_BALANCE_KEY = 'zl_hide_balance_default';

export default function ProfilePage() {
  const { user, displayName, photoURL, updateDisplayName, updatePhotoURL, logout } = useAuth();
  const { pinEnabled, enablePin, disablePin, lockNow } = usePinLock();
  const toast = useToast();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const currentName = displayName || user?.displayName || 'User';

  const [editing, setEditing]           = useState(false);
  const [nameInput, setNameInput]       = useState(currentName);
  const [savingName, setSavingName]     = useState(false);
  const [hideByDefault, setHideByDefault] = useState(
    () => localStorage.getItem(HIDE_BALANCE_KEY) === 'true'
  );
  const [stats, setStats]               = useState({ wallets: 0, transactions: 0 });
  const [exporting, setExporting]       = useState(false);
  const [confirmLogout, setConfirmLogout] = useState(false);

  // PIN Setup Modal state
  const [pinModalOpen, setPinModalOpen] = useState(false);
  const [newPin, setNewPin]             = useState('');
  const [confirmPin, setConfirmPin]     = useState('');

  // Multi-Currency USD -> IDR rate state
  const [usdRate, setUsdRate]           = useState(() => getStoredUsdRate());
  const [refreshingRate, setRefreshingRate] = useState(false);
  const [editingRate, setEditingRate]   = useState(false);
  const [rateInput, setRateInput]       = useState(String(getStoredUsdRate()));

  useEffect(() => {
    setNameInput(currentName);
  }, [currentName]);

  useEffect(() => {
    if (!user?.uid) return;
    Promise.allSettled([
      getWallets(user.uid),
      getTransactions(user.uid, { limitCount: 500 }),
    ]).then(([wRes, txRes]) => {
      setStats({
        wallets: wRes.status === 'fulfilled' ? wRes.value.length : 0,
        transactions: txRes.status === 'fulfilled' ? txRes.value.length : 0,
      });
    });
  }, [user?.uid]);

  const handleSaveName = async (e) => {
    e.preventDefault();
    const trimmed = nameInput.trim();
    if (!trimmed) {
      toast.error('Display name cannot be empty');
      return;
    }
    if (trimmed === currentName) {
      setEditing(false);
      return;
    }
    setSavingName(true);
    try {
      await updateDisplayName(trimmed);
      toast.success('Display name updated!');
      setEditing(false);
    } catch (err) {
      console.error('Failed to update display name:', err);
      toast.error('Failed to update display name');
    } finally {
      setSavingName(false);
    }
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    const reader = new FileReader();
    reader.onload = (ev) => {
      const img = new Image();
      img.onload = () => {
        const size = 160;
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        const minDim = Math.min(img.width, img.height);
        const sx = (img.width - minDim) / 2;
        const sy = (img.height - minDim) / 2;
        ctx.drawImage(img, sx, sy, minDim, minDim, 0, 0, size, size);
        const compressed = canvas.toDataURL('image/jpeg', 0.78);
        updatePhotoURL(compressed);
        toast.success('Display photo updated!');
      };
      img.src = ev.target.result;
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleToggleHideDefault = () => {
    const next = !hideByDefault;
    setHideByDefault(next);
    localStorage.setItem(HIDE_BALANCE_KEY, String(next));
    toast.info(next ? 'Balances will be hidden by default' : 'Balances will be visible by default');
  };

  const handleTogglePin = () => {
    if (pinEnabled) {
      disablePin();
      toast.info('PIN App Lock disabled');
    } else {
      setNewPin('');
      setConfirmPin('');
      setPinModalOpen(true);
    }
  };

  const handleSavePin = async (e) => {
    e.preventDefault();
    if (!/^\d{4}$/.test(newPin)) {
      toast.error('PIN must be 4 digits');
      return;
    }
    if (newPin !== confirmPin) {
      toast.error('PIN confirmation does not match');
      return;
    }
    await enablePin(newPin);
    setPinModalOpen(false);
    toast.success('4-digit PIN App Lock enabled!');
  };

  const handleRefreshRate = async () => {
    setRefreshingRate(true);
    const updated = await fetchLiveUsdRate(true);
    setUsdRate(updated);
    setRateInput(String(updated));
    setRefreshingRate(false);
    toast.success(`Live rate updated: 1 USD = ${formatRupiah(updated)}`);
  };

  const handleSaveCustomRate = (e) => {
    e.preventDefault();
    const num = parseInt(rateInput.replace(/\D/g, ''), 10);
    if (!num || num < 1000) {
      toast.error('Enter a valid IDR rate');
      return;
    }
    const saved = setStoredUsdRate(num);
    setUsdRate(saved);
    setEditingRate(false);
    toast.success(`Custom rate saved: 1 USD = ${formatRupiah(saved)}`);
  };

  const handleExportCSV = async () => {
    if (!user?.uid || exporting) return;
    setExporting(true);
    try {
      const txs = await getTransactions(user.uid, { limitCount: 1000 });
      if (!txs.length) {
        toast.info('No transactions to export yet.');
        return;
      }

      const headers = ['Date', 'Type', 'Category', 'Amount', 'Note'];
      const escape = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
      const rows = txs.map((tx) => {
        const d = tx.date?.toDate ? tx.date.toDate() : new Date(tx.date || Date.now());
        const isoDate = !isNaN(d.getTime()) ? d.toISOString().slice(0, 10) : '';
        return [
          escape(isoDate),
          escape(tx.type),
          escape(tx.category || '-'),
          escape(tx.amount || 0),
          escape(tx.note || ''),
        ].join(',');
      });

      const csv = [headers.join(','), ...rows].join('\n');
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `zero-ledger-transactions-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success(`Exported ${txs.length} transactions to CSV!`);
    } catch (err) {
      console.error('CSV export error:', err);
      toast.error('Failed to export transactions');
    } finally {
      setExporting(false);
    }
  };

  const handleLogout = async () => {
    if (!confirmLogout) {
      setConfirmLogout(true);
      return;
    }
    try {
      await logout();
      navigate('/login', { replace: true });
    } catch (err) {
      console.error('Logout error:', err);
      toast.error('Failed to sign out');
    }
  };

  const initials = currentName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('') || 'ZL';

  const memberSince = user?.metadata?.creationTime
    ? new Date(user.metadata.creationTime).toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : '-';

  return (
    <div className="px-4 pt-10 pb-8 space-y-5 max-w-lg mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="w-9 h-9 rounded-xl bg-surface border border-bline flex items-center justify-center text-muted hover:text-main transition-colors cursor-pointer"
            aria-label="Back"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className="text-main font-bold text-lg leading-tight">Profile & Settings</h1>
            <p className="text-muted text-xs">Manage your account & preferences</p>
          </div>
        </div>
        <ThemeToggle />
      </div>

      {/* Profile Identity Card */}
      <div className="bg-surface border border-bline rounded-3xl p-5 space-y-4 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="relative shrink-0">
            {(photoURL || user?.photoURL) ? (
              <img
                src={photoURL || user.photoURL}
                alt={currentName}
                referrerPolicy="no-referrer"
                className="w-16 h-16 rounded-2xl object-cover border-2 border-teal/40"
              />
            ) : (
              <div className="w-16 h-16 rounded-2xl bg-teal/15 border-2 border-teal/40 flex items-center justify-center text-teal font-extrabold text-xl">
                {initials}
              </div>
            )}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="absolute -bottom-1.5 -right-1.5 w-7 h-7 rounded-xl bg-teal text-[#0B1215] flex items-center justify-center shadow-md hover:scale-105 transition-transform cursor-pointer"
              title="Change Display Photo"
              aria-label="Change Display Photo"
            >
              <Camera size={13} className="stroke-[2.5]" />
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handlePhotoChange}
              className="hidden"
            />
          </div>

          <div className="flex-1 min-w-0">
            {editing ? (
              <form onSubmit={handleSaveName} className="flex items-center gap-1.5">
                <input
                  type="text"
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  maxLength={40}
                  autoFocus
                  className="w-full bg-bg border border-teal/50 rounded-xl px-3 py-1.5 text-sm font-semibold text-main outline-none"
                  placeholder="Enter display name"
                />
                <button
                  type="submit"
                  disabled={savingName}
                  className="w-8 h-8 rounded-xl bg-teal text-[#0B1215] flex items-center justify-center shrink-0 cursor-pointer disabled:opacity-50"
                  aria-label="Save display name"
                >
                  <Check size={16} className="stroke-[2.5]" />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEditing(false);
                    setNameInput(currentName);
                  }}
                  className="w-8 h-8 rounded-xl bg-subcard text-muted hover:text-main flex items-center justify-center shrink-0 cursor-pointer"
                  aria-label="Cancel"
                >
                  <X size={16} />
                </button>
              </form>
            ) : (
              <div className="flex items-center gap-2">
                <h2 className="text-main font-bold text-lg truncate">{currentName}</h2>
                <button
                  onClick={() => setEditing(true)}
                  className="p-1.5 rounded-lg bg-subcard text-muted hover:text-teal transition-colors cursor-pointer shrink-0"
                  title="Edit Display Name"
                >
                  <Pencil size={13} />
                </button>
              </div>
            )}

            <div className="flex items-center gap-1.5 text-muted text-xs mt-1 truncate">
              <Mail size={12} className="shrink-0" />
              <span className="truncate">{user?.email || '-'}</span>
            </div>

            <div className="inline-flex items-center gap-1 mt-2 px-2 py-0.5 rounded-full bg-teal/10 text-teal text-[10px] font-semibold">
              <ShieldCheck size={11} />
              <span>Google Account</span>
            </div>
          </div>
        </div>

        {/* Account Quick Stats */}
        <div className="grid grid-cols-2 gap-2.5 pt-3 border-t border-bline">
          <div className="bg-subcard rounded-2xl p-3 flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-teal/15 text-teal flex items-center justify-center shrink-0">
              <Wallet size={16} />
            </div>
            <div>
              <p className="text-main font-bold text-sm leading-tight">{stats.wallets}</p>
              <p className="text-muted text-[10px]">Active Wallets</p>
            </div>
          </div>

          <div className="bg-subcard rounded-2xl p-3 flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-sky-500/15 text-sky-400 flex items-center justify-center shrink-0">
              <ArrowLeftRight size={16} />
            </div>
            <div>
              <p className="text-main font-bold text-sm leading-tight">{stats.transactions}</p>
              <p className="text-muted text-[10px]">Transactions</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1.5 text-muted text-[11px] pt-1">
          <Calendar size={12} />
          <span>Member since {memberSince}</span>
        </div>
      </div>

      {/* Security & Preferences */}
      <div className="bg-surface border border-bline rounded-3xl divide-y divide-bline overflow-hidden">
        {/* PIN App Lock */}
        <div className="p-4 space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-teal/15 text-teal flex items-center justify-center shrink-0">
                <Lock size={18} />
              </div>
              <div className="min-w-0">
                <p className="text-main text-sm font-semibold">PIN App Lock</p>
                <p className="text-muted text-[11px] leading-snug">
                  Require a 4-digit PIN when opening the app
                </p>
              </div>
            </div>
            <button
              onClick={handleTogglePin}
              role="switch"
              aria-checked={pinEnabled}
              className={`w-11 h-6 rounded-full transition-colors p-0.5 cursor-pointer shrink-0 ${
                pinEnabled ? 'bg-teal' : 'bg-subcard border border-bline'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-white shadow transition-transform ${
                  pinEnabled ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {pinEnabled && (
            <div className="flex items-center gap-2 pl-12">
              <button
                onClick={lockNow}
                className="px-3 py-1.5 rounded-xl bg-subcard hover:bg-teal/15 text-teal text-xs font-semibold transition-colors cursor-pointer"
              >
                Lock App Now
              </button>
              <button
                onClick={() => {
                  setNewPin('');
                  setConfirmPin('');
                  setPinModalOpen(true);
                }}
                className="px-3 py-1.5 rounded-xl bg-subcard text-muted hover:text-main text-xs font-semibold transition-colors cursor-pointer"
              >
                Change PIN
              </button>
            </div>
          )}
        </div>

        {/* Multi-Currency USD -> IDR Rate */}
        <div className="p-4 space-y-2.5">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-sky-500/15 text-sky-400 flex items-center justify-center shrink-0">
                <DollarSign size={18} />
              </div>
              <div className="min-w-0">
                <p className="text-main text-sm font-semibold">USD → IDR Rate</p>
                <p className="text-muted text-[11px]">
                  1 USD = <span className="text-main font-semibold">{formatRupiah(usdRate)}</span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <button
                onClick={() => {
                  setRateInput(String(usdRate));
                  setEditingRate((v) => !v);
                }}
                className="p-2 rounded-xl bg-subcard text-muted hover:text-main transition-colors cursor-pointer"
                title="Edit custom rate"
              >
                <Pencil size={14} />
              </button>
              <button
                onClick={handleRefreshRate}
                disabled={refreshingRate}
                className="p-2 rounded-xl bg-subcard text-teal hover:bg-teal/15 transition-colors cursor-pointer disabled:opacity-50"
                title="Refresh live rate"
              >
                <RefreshCw size={14} className={refreshingRate ? 'animate-spin' : ''} />
              </button>
            </div>
          </div>

          {editingRate && (
            <form onSubmit={handleSaveCustomRate} className="flex items-center gap-2 pl-12">
              <input
                inputMode="numeric"
                value={rateInput}
                onChange={(e) => setRateInput(e.target.value.replace(/\D/g, ''))}
                className="w-32 bg-bg border border-teal/50 rounded-xl px-3 py-1.5 text-xs font-semibold text-main outline-none"
                placeholder="16000"
              />
              <button
                type="submit"
                className="px-3 py-1.5 rounded-xl bg-teal text-[#0B1215] text-xs font-bold cursor-pointer"
              >
                Save
              </button>
            </form>
          )}
        </div>

        {/* Privacy Default Toggle */}
        <div className="p-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-amber-500/15 text-amber-400 flex items-center justify-center shrink-0">
              <EyeOff size={18} />
            </div>
            <div className="min-w-0">
              <p className="text-main text-sm font-semibold">Hide Balance on Startup</p>
              <p className="text-muted text-[11px] leading-snug">
                Mask wallet totals automatically when opening the app
              </p>
            </div>
          </div>
          <button
            onClick={handleToggleHideDefault}
            role="switch"
            aria-checked={hideByDefault}
            className={`w-11 h-6 rounded-full transition-colors p-0.5 cursor-pointer shrink-0 ${
              hideByDefault ? 'bg-teal' : 'bg-subcard border border-bline'
            }`}
          >
            <div
              className={`w-5 h-5 rounded-full bg-white shadow transition-transform ${
                hideByDefault ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {/* Export CSV */}
        <button
          onClick={handleExportCSV}
          disabled={exporting}
          className="w-full p-4 flex items-center justify-between gap-3 hover:bg-subcard/60 transition-colors cursor-pointer text-left disabled:opacity-50"
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center shrink-0">
              <Download size={18} />
            </div>
            <div>
              <p className="text-main text-sm font-semibold">
                {exporting ? 'Exporting...' : 'Export Transactions (CSV)'}
              </p>
              <p className="text-muted text-[11px]">
                Download your transaction history for Excel / backup
              </p>
            </div>
          </div>
        </button>
      </div>

      {/* Sign Out */}
      <button
        onClick={handleLogout}
        className={`w-full py-3.5 px-4 rounded-2xl border font-bold text-sm flex items-center justify-center gap-2 transition-all cursor-pointer ${
          confirmLogout
            ? 'bg-rose-500 text-white border-rose-500 shadow-lg shadow-rose-500/25'
            : 'bg-surface border-bline text-rose-400 hover:bg-rose-500/10 hover:border-rose-500/30'
        }`}
      >
        <LogOut size={17} />
        <span>{confirmLogout ? 'Tap again to confirm Sign Out' : 'Sign Out'}</span>
      </button>

      <p className="text-center text-muted/60 text-[11px] pt-1">
        Zero Ledger PWA • Multi-Currency IDR & USD
      </p>

      {/* 4-Digit PIN Setup Modal */}
      {pinModalOpen && (
        <div
          onClick={() => setPinModalOpen(false)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200"
        >
          <form
            onClick={(e) => e.stopPropagation()}
            onSubmit={handleSavePin}
            className="bg-surface border border-bline rounded-3xl p-5 w-full max-w-xs space-y-4 shadow-2xl"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-main font-bold text-base">Set 4-Digit PIN</h3>
              <button
                type="button"
                onClick={() => setPinModalOpen(false)}
                className="w-7 h-7 rounded-full bg-subcard text-muted hover:text-main flex items-center justify-center cursor-pointer"
              >
                <X size={15} />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-muted text-xs block mb-1">New PIN (4 digits)</label>
                <input
                  type="password"
                  inputMode="numeric"
                  maxLength={4}
                  value={newPin}
                  onChange={(e) => setNewPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                  placeholder="••••"
                  autoFocus
                  className="w-full bg-bg border border-bline focus:border-teal/50 rounded-2xl px-4 py-2.5 text-center text-main text-lg font-bold tracking-[0.5em] outline-none"
                  required
                />
              </div>

              <div>
                <label className="text-muted text-xs block mb-1">Confirm PIN</label>
                <input
                  type="password"
                  inputMode="numeric"
                  maxLength={4}
                  value={confirmPin}
                  onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                  placeholder="••••"
                  className="w-full bg-bg border border-bline focus:border-teal/50 rounded-2xl px-4 py-2.5 text-center text-main text-lg font-bold tracking-[0.5em] outline-none"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3 rounded-2xl bg-teal text-[#0B1215] font-bold text-sm shadow-lg shadow-teal/30 cursor-pointer"
            >
              Enable PIN Lock
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
