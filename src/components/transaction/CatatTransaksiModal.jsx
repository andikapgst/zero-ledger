// src/components/transaction/CatatTransaksiModal.jsx
// Full Specific Modal for Recording Transaction: Customized per activeType (Expense, Income, Transfer, Savings, Debt)

import { useState, useEffect } from 'react';
import {
  X,
  Check,
  ArrowUpRight,
  ArrowDownLeft,
  ArrowDownUp,
  Target,
  HandCoins,
  Calendar,
  FileText,
  AlertCircle,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useTransactionModal } from '../../contexts/TransactionModalContext';
import { getWallets, recordTransactionAtomic } from '../../lib/firebase';
import {
  ZERO_BASED_EXPENSES,
  ZERO_BASED_INCOMES,
  SAVINGS_TARGET_CATEGORIES,
  DEBT_CATEGORIES,
  formatRupiah,
} from '../../lib/utils';
import CategoryIcon from './CategoryIcon';
import WalletPicker from '../wallet/WalletPicker';

const TYPE_CONFIG = {
  expense: {
    label: 'Record Expense',
    sub: 'Daily & recurring living costs',
    icon: ArrowUpRight,
    color: 'text-red-400',
    bg: 'bg-red-500/15',
  },
  income: {
    label: 'Record Income',
    sub: 'Salary, side hustle & rewards',
    icon: ArrowDownLeft,
    color: 'text-green-400',
    bg: 'bg-green-500/15',
  },
  transfer: {
    label: 'Transfer Balance',
    sub: 'Move money between your wallets',
    icon: ArrowDownUp,
    color: 'text-teal',
    bg: 'bg-teal/15',
  },
  savings: {
    label: 'Set Aside Savings',
    sub: 'Goals, investments & emergency buffer',
    icon: Target,
    color: 'text-purple-400',
    bg: 'bg-purple-500/15',
  },
  debt: {
    label: 'Debt / Loan Transaction',
    sub: 'Lend money, borrow, or settle splits',
    icon: HandCoins,
    color: 'text-amber-400',
    bg: 'bg-amber-500/15',
  },
};

export default function CatatTransaksiModal() {
  const { user } = useAuth();
  const { isModalOpen, closeModal, activeType, notifyTransactionSaved } = useTransactionModal();

  const [wallets, setWallets] = useState([]);
  const [type, setType] = useState('expense');
  const [amount, setAmount] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [walletId, setWalletId] = useState('');
  const [toWalletId, setToWalletId] = useState('');
  const [adminFee, setAdminFee] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [note, setNote] = useState('');

  // Debt extra fields
  const [debtPerson, setDebtPerson] = useState('');
  const [debtType, setDebtType] = useState('debt'); // 'debt' (I owe) | 'receivable' (They owe me)

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isModalOpen && user) {
      const targetType = activeType || 'expense';
      setType(targetType);
      setAmount('');
      setNote('');
      setDebtPerson('');
      setAdminFee('');
      setDate(new Date().toISOString().split('T')[0]);
      setError('');

      getWallets(user.uid).then(wList => {
        setWallets(wList);
        if (wList.length > 0) {
          const defaultW = wList.find(w => w.isDefault) || wList[0];
          setWalletId(defaultW.id);
          const secondW = wList.find(w => w.id !== defaultW.id);
          if (secondW) setToWalletId(secondW.id);
        }
      });

      // Default category
      if (targetType === 'expense') setSelectedCategory(ZERO_BASED_EXPENSES[0].name);
      else if (targetType === 'income') setSelectedCategory(ZERO_BASED_INCOMES[0].name);
      else if (targetType === 'savings') setSelectedCategory(SAVINGS_TARGET_CATEGORIES[0].name);
      else if (targetType === 'debt') setSelectedCategory(DEBT_CATEGORIES[0].name);
      else if (targetType === 'transfer') setSelectedCategory('Wallet Transfer');
    }
  }, [isModalOpen, user, activeType]);

  if (!isModalOpen) return null;

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

  const selectedWallet = wallets.find(w => w.id === walletId);
  const selectedToWallet = wallets.find(w => w.id === toWalletId);
  const currentConfig = TYPE_CONFIG[type] || TYPE_CONFIG.expense;
  const HeaderIcon = currentConfig.icon;

  let currentCategoryList = [];
  if (type === 'expense') currentCategoryList = ZERO_BASED_EXPENSES;
  else if (type === 'income') currentCategoryList = ZERO_BASED_INCOMES;
  else if (type === 'savings') currentCategoryList = SAVINGS_TARGET_CATEGORIES;
  else if (type === 'debt') currentCategoryList = DEBT_CATEGORIES;

  const handleSave = async (e) => {
    e.preventDefault();
    const numAmount = parseInt(amount, 10) || 0;
    if (numAmount <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    if (type === 'transfer') {
      if (!walletId || !toWalletId) {
        setError('Please select source and destination wallets');
        return;
      }
      if (walletId === toWalletId) {
        setError('Source and destination wallets cannot be the same');
        return;
      }
      const totalDeduct = numAmount + (parseInt(adminFee, 10) || 0);
      if (selectedWallet && (selectedWallet.balance || 0) < totalDeduct) {
        setError(`Insufficient balance in ${selectedWallet.name} (${formatRupiah(selectedWallet.balance || 0)})`);
        return;
      }
    } else {
      if (!walletId) {
        setError('Please select a wallet');
        return;
      }
    }

    setError('');
    setSaving(true);

    try {
      await recordTransactionAtomic(user.uid, {
        type,
        amount: numAmount,
        category: selectedCategory,
        walletId,
        toWalletId: type === 'transfer' ? toWalletId : null,
        adminFee: type === 'transfer' ? (parseInt(adminFee, 10) || 0) : 0,
        date: new Date(date),
        note,
        debtPerson,
        debtType,
      });

      notifyTransactionSaved();
      closeModal();
    } catch (err) {
      console.error('Error saving transaction:', err);
      setError(err.message || 'Failed to save transaction');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      onClick={closeModal}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-surface w-full max-w-lg mx-auto rounded-3xl border border-bline flex flex-col shadow-2xl max-h-[90vh] sm:max-h-[88vh] overflow-hidden"
      >
        {/* Header with Specific Type Identifier */}
        <div className="flex items-center justify-between px-5 sm:px-6 pt-5 pb-3.5 border-b border-bline">
          <div className="flex items-center gap-2.5">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${currentConfig.bg} ${currentConfig.color}`}>
              <HeaderIcon size={20} className="stroke-[2.2]" />
            </div>
            <div>
              <h2 className="text-main font-bold text-base">{currentConfig.label}</h2>
              <p className="text-[11px] text-muted">{currentConfig.sub}</p>
            </div>
          </div>
          <button
            onClick={closeModal}
            className="w-8 h-8 rounded-full bg-subcard flex items-center justify-center text-muted hover:text-main transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <div className="modal-scroll flex-1 px-5 sm:px-6 py-4 space-y-4">
          {error && (
            <div className="p-3 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-2">
              <AlertCircle size={16} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Large Nominal Input */}
          <div className="bg-bg border border-bline rounded-3xl p-4 focus-within:border-teal/50 transition-colors">
            <p className="text-muted text-[11px] font-medium mb-1">Transaction Amount</p>
            <div className="flex items-center gap-2">
              <span className="text-muted text-xl font-black">Rp</span>
              <input
                inputMode="numeric"
                autoFocus
                value={formatDisplay(amount)}
                onChange={handleAmountChange}
                placeholder="0"
                className="bg-transparent text-main font-extrabold text-3xl outline-none flex-1 placeholder:text-muted/30 min-w-0"
              />
            </div>
            {amount && parseInt(amount, 10) > 0 && (
              <p className="text-[11px] text-teal mt-1 font-medium">
                {formatRupiah(parseInt(amount, 10))}
              </p>
            )}
          </div>

          {/* Category Selector (except Transfer) */}
          {type !== 'transfer' && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-muted text-xs font-medium">
                  Select Category
                </label>
                <span className="text-[11px] text-teal font-medium">{selectedCategory}</span>
              </div>

              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-48 overflow-y-auto p-1 border border-bline bg-bg/50 rounded-2xl">
                {currentCategoryList.map((cat) => {
                  const isSelected = selectedCategory === cat.name;
                  return (
                    <button
                      key={cat.name}
                      type="button"
                      onClick={() => setSelectedCategory(cat.name)}
                      className={`flex flex-col items-center p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-teal/20 border-teal text-teal shadow-sm shadow-teal/20'
                          : 'bg-surface border-bline text-muted hover:border-teal/40 hover:text-main'
                      }`}
                    >
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-subcard mb-1.5">
                        <CategoryIcon category={cat.name} size={18} />
                      </div>
                      <span className="text-[10px] font-medium leading-tight line-clamp-2">
                        {cat.name}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* If Transfer: Source & Destination Wallets */}
          {type === 'transfer' ? (
            <div className="bg-bg border border-bline rounded-2xl p-3.5 space-y-3">
              <WalletPicker
                label="From Wallet (Source)"
                wallets={wallets}
                value={walletId}
                onChange={setWalletId}
                placeholder="Select Source Wallet"
              />

              <WalletPicker
                label="To Wallet (Destination)"
                wallets={wallets}
                value={toWalletId}
                onChange={setToWalletId}
                disabledId={walletId}
                placeholder="Select Destination Wallet"
              />

              <div>
                <label className="text-[11px] text-muted font-medium block mb-1">
                  Admin Fee (Optional)
                </label>
                <div className="flex items-center gap-2 bg-surface border border-bline rounded-xl px-3 py-2">
                  <span className="text-muted text-xs font-bold">Rp</span>
                  <input
                    inputMode="numeric"
                    value={formatDisplay(adminFee)}
                    onChange={handleAdminFeeChange}
                    placeholder="0 (Free)"
                    className="bg-transparent text-main text-xs outline-none flex-1"
                  />
                </div>
              </div>
            </div>
          ) : (
            <div>
              <WalletPicker
                label={type === 'income' ? 'Destination Wallet (Masuk ke)' : 'Source Wallet (Sumber Dana)'}
                wallets={wallets}
                value={walletId}
                onChange={setWalletId}
                placeholder="Select Wallet"
              />
            </div>
          )}

          {/* Extra input if type === 'debt' */}
          {type === 'debt' && (
            <div className="p-3 bg-bg border border-bline rounded-2xl space-y-2.5">
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setDebtType('debt')}
                  className={`flex-1 py-1.5 rounded-xl text-xs font-semibold border ${
                    debtType === 'debt'
                      ? 'bg-amber-500/20 border-amber-500/40 text-amber-500'
                      : 'border-bline text-muted'
                  }`}
                >
                  I Borrowed Money
                </button>
                <button
                  type="button"
                  onClick={() => setDebtType('receivable')}
                  className={`flex-1 py-1.5 rounded-xl text-xs font-semibold border ${
                    debtType === 'receivable'
                      ? 'bg-teal/20 border-teal/40 text-teal'
                      : 'border-bline text-muted'
                  }`}
                >
                  I Lent Money
                </button>
              </div>

              <div>
                <label className="text-[11px] text-muted block mb-1">Contact / Person Name</label>
                <input
                  type="text"
                  placeholder="e.g. Budi, Sarah, Team"
                  value={debtPerson}
                  onChange={(e) => setDebtPerson(e.target.value)}
                  className="w-full bg-surface border border-bline rounded-xl px-3 py-2 text-main text-xs outline-none focus:border-teal/50"
                />
              </div>
            </div>
          )}

          {/* Date & Note Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-muted text-xs font-medium block mb-1">Date</label>
              <div className="flex items-center gap-2 bg-bg border border-bline rounded-2xl px-3 py-2.5">
                <Calendar size={15} className="text-muted shrink-0" />
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="bg-transparent text-main text-xs outline-none w-full min-w-0"
                />
              </div>
            </div>
            <div>
              <label className="text-muted text-xs font-medium block mb-1">Note (Optional)</label>
              <div className="flex items-center gap-2 bg-bg border border-bline rounded-2xl px-3 py-2.5">
                <FileText size={15} className="text-muted shrink-0" />
                <input
                  type="text"
                  placeholder="Description..."
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className="bg-transparent text-main text-xs outline-none w-full min-w-0 placeholder:text-muted/40"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Footer Button */}
        <div className="px-5 sm:px-6 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-3 border-t border-bline">
          <button
            onClick={handleSave}
            disabled={saving || !amount || parseInt(amount, 10) <= 0 || !walletId}
            className="w-full py-3.5 px-4 rounded-2xl bg-teal text-[#0B1215] font-bold text-sm shadow-lg shadow-teal/30 hover:opacity-95 active:scale-[0.99] transition-all flex items-center justify-center gap-2 disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
          >
            <Check size={18} className="stroke-[2.5]" />
            <span>{saving ? 'Saving...' : 'Save Transaction'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
