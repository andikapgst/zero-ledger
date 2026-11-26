// src/pages/WalletPage.jsx
// Wallet list, Net Worth overview, Add/Edit Wallet, and Inter-Wallet Transfer (English UI)

import { useEffect, useState, useMemo } from 'react';
import {
  Plus,
  ArrowDownUp,
  Building2,
  Wallet,
  Smartphone,
  TrendingUp,
  MoreVertical,
  Layers,
  ChevronRight,
  Eye,
  EyeOff,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { getWallets, getDebts, addWallet, subscribeWallets, subscribeDebts } from '../lib/firebase';
import { formatRupiah } from '../lib/utils';
import WalletModal from '../components/wallet/WalletModal';
import TransferModal from '../components/wallet/TransferModal';
import WalletLogo from '../components/wallet/WalletLogo';
import ThemeToggle from '../components/layout/ThemeToggle';

const TYPE_ICONS = {
  bank:       Building2,
  cash:       Wallet,
  'e-wallet': Smartphone,
  investment: TrendingUp,
};

const TYPE_LABELS = {
  bank:       'Bank',
  cash:       'Cash',
  'e-wallet': 'E-Wallet',
  investment: 'Investment',
};

const SAMPLE_WALLETS = [
  { name: 'BCA Main Account', type: 'bank', balance: 5000000, color: '#005EAA', isDefault: true },
  { name: 'Bank Jago - Wedding Savings', type: 'bank', balance: 12000000, color: '#FF7A00' },
  { name: 'Bank BRI', type: 'bank', balance: 3500000, color: '#00529C' },
  { name: 'GoPay', type: 'e-wallet', balance: 350000, color: '#00AED6' },
  { name: 'ShopeePay', type: 'e-wallet', balance: 250000, color: '#EE4D2D' },
  { name: 'DANA', type: 'e-wallet', balance: 175000, color: '#118EEA' },
  { name: 'Cash Wallet', type: 'cash', balance: 250000, color: '#10B981' },
  { name: 'Crypto Portfolio', type: 'investment', balance: 7500000, color: '#8B5CF6' },
];

export default function WalletPage() {
  const { user } = useAuth();
  const toast = useToast();
  const [wallets, setWallets]         = useState([]);
  const [debts, setDebts]             = useState([]);
  const [loading, setLoading]         = useState(true);
  const [hideAmount, setHideAmount]   = useState(
    () => localStorage.getItem('zl_hide_balance_default') === 'true'
  );
  const [seeding, setSeeding]         = useState(false);

  // Modals state
  const [walletModalOpen, setWalletModalOpen] = useState(false);
  const [editingWallet, setEditingWallet]     = useState(null);
  const [transferModalOpen, setTransferModalOpen] = useState(false);
  const [transferFromId, setTransferFromId]       = useState(null);

  // Tab filter
  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'bank' | 'e-wallet' | 'cash' | 'investment'

  const loadData = async () => {
    if (!user) return;
    try {
      const [wList, dList] = await Promise.all([
        getWallets(user.uid).catch(err => { console.error('getWallets error:', err); return []; }),
        getDebts(user.uid).catch(err => { console.error('getDebts error:', err); return []; }),
      ]);
      setWallets(wList);
      setDebts(dList);
    } catch (err) {
      console.error('Failed to load wallet data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    setLoading(true);

    // Initial load + Realtime subscriptions (instant 0ms updates)
    const unsubWallets = subscribeWallets(
      user.uid,
      (wList) => {
        setWallets(wList);
        setLoading(false);
      },
      (err) => {
        console.error('Realtime wallet subscription error:', err);
        setLoading(false);
      }
    );

    const unsubDebts = subscribeDebts(
      user.uid,
      (dList) => {
        setDebts(dList);
      },
      (err) => {
        console.error('Realtime debts subscription error:', err);
      }
    );

    return () => {
      unsubWallets();
      unsubDebts();
    };
  }, [user]);

  const netWorthSummary = useMemo(() => {
    const liquidAssets = wallets
      .filter(w => ['bank', 'e-wallet', 'cash'].includes(w.type))
      .reduce((s, w) => s + (Number(w.balance) || 0), 0);

    const investments = wallets
      .filter(w => w.type === 'investment')
      .reduce((s, w) => s + (Number(w.balance) || 0), 0);

    const totalAssets = liquidAssets + investments;

    const totalDebts = debts
      .filter(d => d.type === 'debt' && !d.isPaid)
      .reduce((s, d) => s + (Math.max(0, (Number(d.amount) || 0) - (Number(d.paidAmount) || 0))), 0);

    const netWorth = totalAssets - totalDebts;

    return {
      liquidAssets,
      investments,
      totalAssets,
      totalDebts,
      netWorth,
    };
  }, [wallets, debts]);

  const filteredWallets = useMemo(() => {
    if (activeTab === 'all') return wallets;
    return wallets.filter(w => w.type === activeTab);
  }, [wallets, activeTab]);

  const handleOpenCreate = () => {
    setEditingWallet(null);
    setWalletModalOpen(true);
  };

  const handleOpenEdit = (w) => {
    setEditingWallet(w);
    setWalletModalOpen(true);
  };

  const handleOpenTransfer = (fromId = null) => {
    setTransferFromId(fromId);
    setTransferModalOpen(true);
  };

  const handleSeedSamples = async () => {
    if (!user || seeding) return;
    setSeeding(true);
    try {
      for (const item of SAMPLE_WALLETS) {
        await addWallet(user.uid, item);
      }
      await loadData();
      toast.success('Sample wallets loaded successfully!');
    } catch (err) {
      console.error('Error seeding wallets:', err);
      toast.error('Failed to load sample wallets');
    } finally {
      setSeeding(false);
    }
  };

  return (
    <div className="px-4 pt-12 pb-8 max-w-lg mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-white text-xl font-bold">Wallets & Assets</h1>
          <p className="text-muted text-xs">Manage accounts and transfer funds</p>
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          {wallets.length >= 2 && (
            <button
              onClick={() => handleOpenTransfer()}
              className="h-9 px-3 bg-surface hover:bg-white/10 active:scale-95 border border-white/10 rounded-xl flex items-center gap-1.5 text-teal text-xs font-semibold transition-all shadow-sm cursor-pointer"
              title="Transfer Balance"
            >
              <ArrowDownUp size={15} />
              <span>Transfer</span>
            </button>
          )}
          <button
            onClick={handleOpenCreate}
            className="w-9 h-9 bg-teal hover:bg-teal/90 active:scale-95 rounded-xl flex items-center justify-center shadow-md shadow-teal/30 transition-all text-bg cursor-pointer"
            title="Add Wallet"
          >
            <Plus size={20} className="stroke-[2.5]" />
          </button>
        </div>
      </div>

      {/* ── NET WORTH CARD ────────────────────────────────────── */}
      <div className="bg-gradient-to-br from-[#121A1E] via-[#0f171b] to-[#122324] border border-white/10 rounded-3xl p-5 relative overflow-hidden shadow-xl">
        <div className="absolute -right-8 -top-8 w-36 h-36 bg-teal/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <span className="text-muted text-xs font-medium uppercase tracking-wider">
              Total Net Worth
            </span>
          </div>
          <button
            onClick={() => setHideAmount(h => !h)}
            className="text-muted hover:text-white transition-colors p-1 cursor-pointer"
            title={hideAmount ? 'Show Amount' : 'Hide Amount'}
          >
            {hideAmount ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>

        <p className="text-white text-3xl font-extrabold tracking-tight mt-1">
          {hideAmount ? '••••••••' : formatRupiah(netWorthSummary.netWorth)}
        </p>

        {/* Breakdown Row */}
        <div className="grid grid-cols-3 gap-2 mt-4 pt-4 border-t border-white/5">
          <div className="bg-white/[0.03] rounded-2xl p-2.5 border border-white/5">
            <p className="text-[10px] text-muted flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-teal" />
              Liquid Assets
            </p>
            <p className="text-xs font-bold text-white mt-1 truncate">
              {hideAmount ? '•••' : formatRupiah(netWorthSummary.liquidAssets, { compact: true })}
            </p>
          </div>

          <div className="bg-white/[0.03] rounded-2xl p-2.5 border border-white/5">
            <p className="text-[10px] text-muted flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />
              Investments
            </p>
            <p className="text-xs font-bold text-purple-300 mt-1 truncate">
              {hideAmount ? '•••' : formatRupiah(netWorthSummary.investments, { compact: true })}
            </p>
          </div>

          <div className="bg-white/[0.03] rounded-2xl p-2.5 border border-white/5">
            <p className="text-[10px] text-muted flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
              Liabilities
            </p>
            <p className="text-xs font-bold text-red-400 mt-1 truncate">
              {hideAmount ? '•••' : formatRupiah(netWorthSummary.totalDebts, { compact: true })}
            </p>
          </div>
        </div>
      </div>

      {/* Quick Transfer Banner */}
      {wallets.length >= 2 && (
        <div
          onClick={() => handleOpenTransfer()}
          className="bg-surface hover:bg-white/5 active:scale-[0.99] border border-teal/20 rounded-2xl p-3.5 flex items-center justify-between cursor-pointer transition-all"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal/15 flex items-center justify-center text-teal">
              <ArrowDownUp size={20} />
            </div>
            <div>
              <p className="text-white text-sm font-semibold">Inter-Wallet Transfer</p>
              <p className="text-muted text-xs">Instantly move funds between bank accounts & e-wallets</p>
            </div>
          </div>
          <ChevronRight size={18} className="text-muted" />
        </div>
      )}

      {/* Category Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-hide text-xs">
        {[
          { key: 'all',        label: 'All' },
          { key: 'bank',       label: 'Bank' },
          { key: 'e-wallet',   label: 'E-Wallet' },
          { key: 'cash',       label: 'Cash' },
          { key: 'investment', label: 'Investments' },
        ].map((tab) => {
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-3.5 py-1.5 rounded-full font-medium transition-all shrink-0 cursor-pointer ${
                isActive
                  ? 'bg-teal text-bg font-semibold shadow-sm shadow-teal/30'
                  : 'bg-surface text-muted border border-white/5 hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Wallet List */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-white text-sm font-semibold">
            Wallets List ({filteredWallets.length})
          </h2>
          <button
            onClick={handleOpenCreate}
            className="text-teal text-xs hover:underline flex items-center gap-1 cursor-pointer"
          >
            <Plus size={14} /> Add New
          </button>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 bg-surface rounded-3xl border border-white/5 animate-pulse" />
            ))}
          </div>
        ) : filteredWallets.length === 0 ? (
          <div className="bg-surface rounded-3xl p-8 border border-white/5 text-center space-y-4">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-teal/10 flex items-center justify-center text-teal">
              <Layers size={28} />
            </div>
            <div>
              <p className="text-white font-semibold">
                {activeTab === 'all' ? 'No Wallets Found' : `No ${activeTab} wallets`}
              </p>
              <p className="text-muted text-xs mt-1 max-w-xs mx-auto">
                Add your bank accounts, e-wallets, or physical cash to track your net worth.
              </p>
            </div>

            {activeTab === 'all' && (
              <div className="pt-2 flex flex-col sm:flex-row gap-2 justify-center">
                <button
                  onClick={handleOpenCreate}
                  className="px-5 py-2.5 rounded-xl bg-teal text-bg font-bold text-xs shadow-md shadow-teal/20 hover:opacity-90 active:scale-95 transition-all cursor-pointer"
                >
                  Create New Wallet
                </button>
                <button
                  onClick={handleSeedSamples}
                  disabled={seeding}
                  className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white font-medium text-xs border border-white/10 flex items-center justify-center gap-1.5 transition-all disabled:opacity-50 cursor-pointer"
                >
                  <span>{seeding ? 'Generating samples...' : 'Load Sample Wallets (BCA, Jago, GoPay)'}</span>
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {filteredWallets.map((w) => {
              const Icon = TYPE_ICONS[w.type] || Wallet;
              const cardColor = w.color || '#2DD4BF';

              return (
                <div
                  key={w.id}
                  className="bg-surface rounded-3xl p-4 border border-white/5 hover:border-white/15 transition-all relative group"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 min-w-0">
                      <WalletLogo wallet={w} size="lg" />
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-white text-sm font-semibold truncate">{w.name}</p>
                          {w.isDefault && (
                            <span className="px-2 py-0.5 rounded-full bg-teal/15 text-teal text-[10px] font-semibold shrink-0">
                              Primary
                            </span>
                          )}
                        </div>
                        <p className="text-muted text-xs capitalize mt-0.5">
                          {TYPE_LABELS[w.type] || w.type}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleOpenTransfer(w.id)}
                        className="p-2 rounded-xl text-muted hover:text-teal hover:bg-white/5 transition-colors cursor-pointer"
                        title="Transfer from this wallet"
                      >
                        <ArrowDownUp size={16} />
                      </button>
                      <button
                        onClick={() => handleOpenEdit(w)}
                        className="p-2 rounded-xl text-muted hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
                        title="Edit Wallet"
                      >
                        <MoreVertical size={16} />
                      </button>
                    </div>
                  </div>

                  <div className="mt-3 pt-3 border-t border-white/5 flex items-center justify-between">
                    <span className="text-[11px] text-muted">Current Balance</span>
                    <span className="text-white font-bold text-base">
                      {hideAmount ? '••••••••' : formatRupiah(w.balance || 0)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <WalletModal
        isOpen={walletModalOpen}
        onClose={() => {
          setWalletModalOpen(false);
          setEditingWallet(null);
        }}
        walletToEdit={editingWallet}
        userId={user?.uid}
        onSuccess={loadData}
      />

      <TransferModal
        isOpen={transferModalOpen}
        onClose={() => setTransferModalOpen(false)}
        wallets={wallets}
        userId={user?.uid}
        onSuccess={loadData}
        preselectedFromWalletId={transferFromId}
      />
    </div>
  );
}
