// src/components/auth/PinLockScreen.jsx
// Fullscreen 4-digit PIN lock overlay when PIN App Lock is enabled

import { useState } from 'react';
import { Lock, Delete, LogOut } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { usePinLock } from '../../contexts/PinLockContext';

export default function PinLockScreen() {
  const { user, displayName, logout } = useAuth();
  const { pinEnabled, isLocked, verifyAndUnlock, disablePin } = usePinLock();

  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);

  if (!user || !pinEnabled || !isLocked) return null;

  const currentName = displayName || user?.displayName || 'User';

  const handleDigit = async (digit) => {
    if (pin.length >= 4) return;
    setError(false);
    const next = pin + digit;
    setPin(next);

    if (next.length === 4) {
      const ok = await verifyAndUnlock(next);
      if (!ok) {
        setError(true);
        setTimeout(() => {
          setPin('');
        }, 450);
      } else {
        setPin('');
      }
    }
  };

  const handleBackspace = () => {
    setError(false);
    setPin((prev) => prev.slice(0, -1));
  };

  const handleForgotPin = async () => {
    disablePin();
    await logout();
  };

  return (
    <div className="fixed inset-0 z-[200] bg-bg flex flex-col items-center justify-between px-6 py-12 select-none animate-in fade-in duration-200">
      {/* Top Identity */}
      <div className="flex flex-col items-center text-center mt-4 space-y-3">
        <div className="w-14 h-14 rounded-2xl bg-teal/15 border border-teal/30 flex items-center justify-center text-teal shadow-lg shadow-teal/10">
          <Lock size={26} />
        </div>
        <div>
          <p className="text-main font-bold text-lg">Zero Ledger Locked</p>
          <p className="text-muted text-xs mt-0.5">
            Enter 4-digit PIN for <span className="text-main font-semibold">{currentName}</span>
          </p>
        </div>

        {/* 4 PIN Dots */}
        <div className={`flex items-center gap-4 pt-4 ${error ? 'animate-bounce' : ''}`}>
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className={`w-4 h-4 rounded-full border-2 transition-all duration-150 ${
                error
                  ? 'border-rose-500 bg-rose-500 scale-110'
                  : i < pin.length
                    ? 'border-teal bg-teal scale-110 shadow-md shadow-teal/40'
                    : 'border-muted/40 bg-transparent'
              }`}
            />
          ))}
        </div>

        <p className={`text-xs h-4 font-medium ${error ? 'text-rose-400' : 'text-transparent'}`}>
          Incorrect PIN. Try again.
        </p>
      </div>

      {/* Numeric Keypad */}
      <div className="w-full max-w-[280px] grid grid-cols-3 gap-3.5">
        {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((d) => (
          <button
            key={d}
            onClick={() => handleDigit(d)}
            className="h-16 rounded-2xl bg-surface hover:bg-subcard active:scale-95 border border-bline text-main text-xl font-bold transition-all cursor-pointer shadow-sm"
          >
            {d}
          </button>
        ))}

        <div />

        <button
          onClick={() => handleDigit('0')}
          className="h-16 rounded-2xl bg-surface hover:bg-subcard active:scale-95 border border-bline text-main text-xl font-bold transition-all cursor-pointer shadow-sm"
        >
          0
        </button>

        <button
          onClick={handleBackspace}
          className="h-16 rounded-2xl bg-surface hover:bg-subcard active:scale-95 border border-bline text-muted hover:text-main flex items-center justify-center transition-all cursor-pointer shadow-sm"
          aria-label="Backspace"
        >
          <Delete size={22} />
        </button>
      </div>

      {/* Forgot PIN fallback */}
      <button
        onClick={handleForgotPin}
        className="flex items-center gap-1.5 text-xs text-muted hover:text-rose-400 transition-colors cursor-pointer pb-2"
      >
        <LogOut size={14} />
        <span>Forgot PIN? Sign out</span>
      </button>
    </div>
  );
}
