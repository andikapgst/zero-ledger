// src/contexts/PinLockContext.jsx
// Local device 4-digit PIN App Lock state & SHA-256 verification

import { createContext, useContext, useState, useCallback } from 'react';

const PinLockContext = createContext(null);

const PIN_ENABLED_KEY = 'zl_pin_enabled';
const PIN_HASH_KEY = 'zl_pin_hash';

async function hashPin(pin) {
  const input = `zero-ledger:${pin}`;
  if (window.crypto?.subtle) {
    const data = new TextEncoder().encode(input);
    const digest = await window.crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(digest))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
  }
  // Fallback simple hash if crypto.subtle unavailable
  let h = 0;
  for (let i = 0; i < input.length; i++) {
    h = ((h << 5) - h + input.charCodeAt(i)) | 0;
  }
  return String(h);
}

export function PinLockProvider({ children }) {
  const [pinEnabled, setPinEnabled] = useState(
    () => localStorage.getItem(PIN_ENABLED_KEY) === 'true' && Boolean(localStorage.getItem(PIN_HASH_KEY))
  );
  const [isLocked, setIsLocked] = useState(
    () => localStorage.getItem(PIN_ENABLED_KEY) === 'true' && Boolean(localStorage.getItem(PIN_HASH_KEY))
  );

  const enablePin = useCallback(async (pin) => {
    const hashed = await hashPin(pin);
    localStorage.setItem(PIN_HASH_KEY, hashed);
    localStorage.setItem(PIN_ENABLED_KEY, 'true');
    setPinEnabled(true);
    setIsLocked(false);
  }, []);

  const disablePin = useCallback(() => {
    localStorage.removeItem(PIN_HASH_KEY);
    localStorage.removeItem(PIN_ENABLED_KEY);
    setPinEnabled(false);
    setIsLocked(false);
  }, []);

  const verifyPin = useCallback(async (pin) => {
    const stored = localStorage.getItem(PIN_HASH_KEY);
    if (!stored) return true;
    const hashed = await hashPin(pin);
    return hashed === stored;
  }, []);

  const verifyAndUnlock = useCallback(async (pin) => {
    const ok = await verifyPin(pin);
    if (ok) {
      setIsLocked(false);
    }
    return ok;
  }, [verifyPin]);

  const lockNow = useCallback(() => {
    if (pinEnabled) {
      setIsLocked(true);
    }
  }, [pinEnabled]);

  return (
    <PinLockContext.Provider
      value={{
        pinEnabled,
        isLocked,
        enablePin,
        disablePin,
        verifyPin,
        verifyAndUnlock,
        lockNow,
      }}
    >
      {children}
    </PinLockContext.Provider>
  );
}

export function usePinLock() {
  const ctx = useContext(PinLockContext);
  if (!ctx) throw new Error('usePinLock must be used inside PinLockProvider');
  return ctx;
}
