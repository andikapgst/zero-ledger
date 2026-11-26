// src/pages/ProfilePage.jsx
// User Profile & App Preferences: Edit Display Name, Privacy Toggle, Theme, CSV Export, Sign Out

import { useEffect, useState } from 'react';
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
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { getWallets, getTransactions } from '../lib/firebase';
import ThemeToggle from '../components/layout/ThemeToggle';

const HIDE_BALANCE_KEY = 'zl_hide_balance_default';

export default function ProfilePage() {
  const { user, displayName, updateDisplayName, logout } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

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

  const handleToggleHideDefault = () => {
    const next = !hideByDefault;
    setHideByDefault(next);
    localStorage.setItem(HIDE_BALANCE_KEY, String(next));
    toast.info(next ? 'Balances will be hidden by default' : 'Balances will be visible by default');
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

      const headers = ['Date', 'Type', 'Category', 'Amount (IDR)', 'Note'];
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
          {user?.photoURL ? (
            <img
              src={user.photoURL}
              alt={currentName}
              referrerPolicy="no-referrer"
              className="w-16 h-16 rounded-2xl object-cover border-2 border-teal/40 shrink-0"
            />
          ) : (
            <div className="w-16 h-16 rounded-2xl bg-teal/15 border-2 border-teal/40 flex items-center justify-center text-teal font-extrabold text-xl shrink-0">
              {initials}
            </div>
          )}

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

      {/* Preferences & Data */}
      <div className="bg-surface border border-bline rounded-3xl divide-y divide-bline overflow-hidden">
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
        Zero Ledger PWA • Currency: IDR (Rp)
      </p>
    </div>
  );
}
