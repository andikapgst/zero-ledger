// src/lib/utils.js
// Shared utility functions, Zero-Based Budgeting categories in English, and icon mapping

/**
 * Format a number as Indonesian Rupiah (currency format preserved as Rp 1.000.000)
 */
export function formatRupiah(amount, options = {}) {
  const { showSign = false, compact = false } = options;
  const num = Number(amount) || 0;
  const abs = Math.abs(num);

  let formatted;
  if (compact && abs >= 1_000_000_000) {
    formatted = `Rp ${(abs / 1_000_000_000).toFixed(1)} B`;
  } else if (compact && abs >= 1_000_000) {
    formatted = `Rp ${(abs / 1_000_000).toFixed(1)} M`;
  } else if (compact && abs >= 1_000) {
    formatted = `Rp ${(abs / 1_000).toFixed(0)} K`;
  } else {
    formatted = new Intl.NumberFormat('id-ID', {
      style:    'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(abs);
  }

  if (showSign && num > 0) return `+${formatted}`;
  if (num < 0) return `-${formatted}`;
  return formatted;
}

/**
 * Format timestamp or date to English locale string
 */
export function formatDate(ts, style = 'short') {
  if (!ts) return '-';
  const date = ts?.toDate ? ts.toDate() : new Date(ts);
  if (isNaN(date.getTime())) return '-';

  if (style === 'short') {
    return date.toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' });
  }
  if (style === 'day-month') {
    return date.toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
  }
  if (style === 'header') {
    return date.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
  }
  if (style === 'time') {
    return date.toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  }
  if (style === 'month') {
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  }
  if (style === 'month-short') {
    return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  }
  return date.toLocaleDateString('en-US');
}

/**
 * Returns "YYYY-MM" string for current month or date
 */
export function getYearMonth(dateInput = new Date()) {
  const date = dateInput?.toDate ? dateInput.toDate() : new Date(dateInput);
  if (isNaN(date.getTime())) return '';
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
}

export function clamp(value, min = 0, max = 100) {
  return Math.min(max, Math.max(min, value));
}

// ─── Zero-Based Budgeting Categories (English) ────────────────────────────────

export const ZERO_BASED_EXPENSES = [
  { name: 'Food & Dining',           icon: 'Utensils',       color: '#F87171', group: 'Daily' },
  { name: 'Personal Needs',          icon: 'ShoppingBag',    color: '#FB923C', group: 'Daily' },
  { name: 'Motor Fuel',              icon: 'Fuel',           color: '#FBBF24', group: 'Transport' },
  { name: 'Vehicle Maintenance',     icon: 'Wrench',         color: '#F59E0B', group: 'Transport' },
  { name: 'Internet & Phone',        icon: 'Wifi',           color: '#38BDF8', group: 'Utilities' },
  { name: 'Pet Care',                icon: 'PawPrint',       color: '#EC4899', group: 'Pets' },
  { name: 'Family Support',          icon: 'HeartHandshake', color: '#F472B6', group: 'Social' },
  { name: 'Charity & Donation',      icon: 'HandHeart',      color: '#34D399', group: 'Social' },
  { name: 'Self Reward',             icon: 'Sparkles',       color: '#A78BFA', group: 'Lifestyle' },
  { name: 'Wedding Fund',            icon: 'Heart',          color: '#E879F9', group: 'Goals' },
  { name: 'Dika & Diana Fund',       icon: 'Users',          color: '#C084FC', group: 'Goals' },
  { name: 'Emergency Savings',       icon: 'ShieldCheck',    color: '#10B981', group: 'Goals' },
  { name: 'Crypto Investment',       icon: 'TrendingUp',     color: '#2DD4BF', group: 'Investments' },
];

export const ZERO_BASED_INCOMES = [
  { name: 'Main Salary',             icon: 'Briefcase',      color: '#4ADE80', group: 'Primary' },
  { name: 'Side Income',             icon: 'CircleDollarSign',color: '#2DD4BF', group: 'Secondary' },
];

export const SAVINGS_TARGET_CATEGORIES = [
  { name: 'Wedding Fund',            icon: 'Heart',          color: '#E879F9' },
  { name: 'Dika & Diana Fund',       icon: 'Users',          color: '#C084FC' },
  { name: 'Emergency Savings',       icon: 'ShieldCheck',    color: '#10B981' },
  { name: 'Crypto Investment',       icon: 'TrendingUp',     color: '#2DD4BF' },
  { name: 'New Savings Goal',        icon: 'Target',         color: '#38BDF8' },
];

export const DEBT_CATEGORIES = [
  { name: 'Pay Debt',                icon: 'ArrowUpRight',   color: '#F87171' },
  { name: 'Borrow Money',            icon: 'ArrowDownLeft',  color: '#FB923C' },
  { name: 'Lend Money (Receivable)', icon: 'HandCoins',      color: '#FBBF24' },
  { name: 'Receive Debt Payment',    icon: 'BadgePercent',   color: '#4ADE80' },
];

export const EXPENSE_CATEGORIES = ZERO_BASED_EXPENSES.map(c => c.name);
export const INCOME_CATEGORIES  = ZERO_BASED_INCOMES.map(c => c.name);

// Fast icon/color lookup map for any category name (with legacy Indonesian alias support)
export const CATEGORY_INFO_MAP = {
  ...ZERO_BASED_EXPENSES.reduce((acc, cur) => ({ ...acc, [cur.name]: cur }), {}),
  ...ZERO_BASED_INCOMES.reduce((acc, cur) => ({ ...acc, [cur.name]: cur }), {}),
  ...SAVINGS_TARGET_CATEGORIES.reduce((acc, cur) => ({ ...acc, [cur.name]: cur }), {}),
  ...DEBT_CATEGORIES.reduce((acc, cur) => ({ ...acc, [cur.name]: cur }), {}),
  'Wallet Transfer': { name: 'Wallet Transfer', icon: 'ArrowDownUp', color: '#2DD4BF' },
  // Backward aliases
  'Transfer Antar Wallet': { name: 'Wallet Transfer', icon: 'ArrowDownUp', color: '#2DD4BF' },
  'Makan & Jajan': { name: 'Food & Dining', icon: 'Utensils', color: '#F87171' },
  'Kebutuhan Pribadi': { name: 'Personal Needs', icon: 'ShoppingBag', color: '#FB923C' },
  'Bensin Motor': { name: 'Motor Fuel', icon: 'Fuel', color: '#FBBF24' },
  'Perawatan Motor': { name: 'Vehicle Maintenance', icon: 'Wrench', color: '#F59E0B' },
  'Kuota Internet': { name: 'Internet & Phone', icon: 'Wifi', color: '#38BDF8' },
  'Kebutuhan Anabul': { name: 'Pet Care', icon: 'PawPrint', color: '#EC4899' },
  'Kasih Keluarga': { name: 'Family Support', icon: 'HeartHandshake', color: '#F472B6' },
  'Shodaqoh': { name: 'Charity & Donation', icon: 'HandHeart', color: '#34D399' },
  'Tabungan Nikah': { name: 'Wedding Fund', icon: 'Heart', color: '#E879F9' },
  'Tabungan Dika & Diana': { name: 'Dika & Diana Fund', icon: 'Users', color: '#C084FC' },
  'Simpanan Darurat': { name: 'Emergency Savings', icon: 'ShieldCheck', color: '#10B981' },
  'Investasi Kripto': { name: 'Crypto Investment', icon: 'TrendingUp', color: '#2DD4BF' },
  'Gaji Utama': { name: 'Main Salary', icon: 'Briefcase', color: '#4ADE80' },
  'Pendapatan Lainnya': { name: 'Side Income', icon: 'CircleDollarSign', color: '#2DD4BF' },
};

export const CATEGORY_COLORS = Object.fromEntries(
  Object.entries(CATEGORY_INFO_MAP).map(([k, v]) => [k, v.color])
);

export const WALLET_TYPES = [
  { value: 'bank',       label: 'Bank',       icon: 'Building2' },
  { value: 'cash',       label: 'Cash',       icon: 'Wallet' },
  { value: 'e-wallet',   label: 'E-Wallet',   icon: 'Smartphone' },
  { value: 'investment', label: 'Investment', icon: 'TrendingUp' },
];
