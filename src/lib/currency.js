// src/lib/currency.js
// Multi-currency utilities (IDR & USD) with live/cached exchange rate

const RATE_STORAGE_KEY = 'zl_usd_idr_rate';
const RATE_TIME_KEY = 'zl_usd_idr_rate_ts';
const DEFAULT_USD_RATE = 16000;
const CACHE_TTL_MS = 6 * 60 * 60 * 1000; // 6 hours

export function getStoredUsdRate() {
  const raw = Number(localStorage.getItem(RATE_STORAGE_KEY));
  return raw > 0 ? raw : DEFAULT_USD_RATE;
}

export function setStoredUsdRate(rate) {
  const num = Math.round(Number(rate));
  if (num > 0) {
    localStorage.setItem(RATE_STORAGE_KEY, String(num));
    localStorage.setItem(RATE_TIME_KEY, String(Date.now()));
    return num;
  }
  return getStoredUsdRate();
}

export async function fetchLiveUsdRate(force = false) {
  const lastTs = Number(localStorage.getItem(RATE_TIME_KEY) || 0);
  if (!force && Date.now() - lastTs < CACHE_TTL_MS) {
    return getStoredUsdRate();
  }

  try {
    const res = await fetch('https://open.er-api.com/v6/latest/USD');
    if (!res.ok) throw new Error('Failed to fetch exchange rate');
    const json = await res.json();
    const idr = Number(json?.rates?.IDR);
    if (idr > 1000) {
      return setStoredUsdRate(idr);
    }
  } catch (err) {
    console.warn('Could not refresh live USD/IDR rate, using cached:', err.message);
  }
  return getStoredUsdRate();
}

export function toIdr(amount, currency = 'IDR', usdRate = getStoredUsdRate()) {
  const num = Number(amount) || 0;
  if (currency === 'USD') {
    return Math.round(num * usdRate);
  }
  return num;
}

export function formatCurrency(amount, currency = 'IDR', options = {}) {
  const { showSign = false, compact = false } = options;
  const num = Number(amount) || 0;
  const abs = Math.abs(num);

  let formatted;
  if (currency === 'USD') {
    if (compact && abs >= 1_000_000) {
      formatted = `$${(abs / 1_000_000).toFixed(2)}M`;
    } else if (compact && abs >= 1_000) {
      formatted = `$${(abs / 1_000).toFixed(1)}K`;
    } else {
      formatted = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: abs % 1 !== 0 ? 2 : 0,
        maximumFractionDigits: 2,
      }).format(abs);
    }
  } else {
    if (compact && abs >= 1_000_000_000) {
      formatted = `Rp ${(abs / 1_000_000_000).toFixed(1)} B`;
    } else if (compact && abs >= 1_000_000) {
      formatted = `Rp ${(abs / 1_000_000).toFixed(1)} M`;
    } else if (compact && abs >= 1_000) {
      formatted = `Rp ${(abs / 1_000).toFixed(0)} K`;
    } else {
      formatted = new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(abs);
    }
  }

  if (showSign && num > 0) return `+${formatted}`;
  if (num < 0) return `-${formatted}`;
  return formatted;
}
