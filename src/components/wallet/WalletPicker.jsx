// src/components/wallet/WalletPicker.jsx
// Interactive wallet selector featuring brand logos, balance preview, and light/dark mode support

import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check, Wallet as WalletIcon, Ban } from 'lucide-react';
import WalletLogo from './WalletLogo';
import { formatRupiah } from '../../lib/utils';

export default function WalletPicker({
  wallets = [],
  value,
  onChange,
  placeholder = 'Select Wallet',
  label,
  allowNone = false,
  noneLabel = 'No wallet balance change',
  disabledId = null,
  error = '',
  className = '',
}) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  const selectedWallet = wallets.find((w) => w.id === value);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [isOpen]);

  const handleSelect = (walletId) => {
    if (walletId === disabledId) return;
    onChange(walletId);
    setIsOpen(false);
  };

  return (
    <div ref={containerRef} className={`relative w-full ${className}`}>
      {label && (
        <label className="text-muted text-xs font-medium block mb-1.5">
          {label}
        </label>
      )}

      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className={`w-full bg-surface border rounded-2xl p-2.5 sm:p-3 flex items-center justify-between gap-2.5 transition-all cursor-pointer text-left focus:outline-none ${
          isOpen
            ? 'border-teal ring-2 ring-teal/20 shadow-sm'
            : error
            ? 'border-red-500/50'
            : 'border-bline hover:border-teal/40'
        }`}
      >
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          {selectedWallet ? (
            <>
              <WalletLogo wallet={selectedWallet} size="md" />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <span className="text-main font-bold text-xs sm:text-sm truncate">
                    {selectedWallet.name}
                  </span>
                  {selectedWallet.isDefault && (
                    <span className="px-1.5 py-0.2 rounded-full bg-teal/15 text-teal text-[9px] font-bold uppercase shrink-0">
                      Primary
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-muted truncate mt-0.5">
                  Saldo: <span className="text-teal font-semibold">{formatRupiah(selectedWallet.balance || 0)}</span>
                </p>
              </div>
            </>
          ) : value === '' && allowNone ? (
            <>
              <div className="w-8 h-8 rounded-xl bg-subcard flex items-center justify-center text-muted shrink-0 border border-bline">
                <Ban size={16} />
              </div>
              <span className="text-muted text-xs sm:text-sm font-medium truncate">
                {noneLabel}
              </span>
            </>
          ) : (
            <>
              <div className="w-8 h-8 rounded-xl bg-subcard flex items-center justify-center text-muted shrink-0 border border-bline">
                <WalletIcon size={16} />
              </div>
              <span className="text-muted text-xs sm:text-sm font-medium">
                {placeholder}
              </span>
            </>
          )}
        </div>

        <ChevronDown
          size={18}
          className={`text-muted transition-transform duration-200 shrink-0 ${
            isOpen ? 'rotate-180 text-teal' : ''
          }`}
        />
      </button>

      {/* Error message */}
      {error && <p className="text-red-400 text-[11px] mt-1">{error}</p>}

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute left-0 right-0 top-full mt-1.5 z-50 bg-surface border border-bline rounded-2xl shadow-2xl p-1.5 space-y-1 max-h-60 overflow-y-auto animate-in fade-in slide-in-from-top-2 duration-150">
          {allowNone && (
            <button
              type="button"
              onClick={() => handleSelect('')}
              className={`w-full p-2.5 rounded-xl flex items-center justify-between text-left transition-colors cursor-pointer ${
                value === ''
                  ? 'bg-teal/15 text-teal'
                  : 'hover:bg-subcard text-muted hover:text-main'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-subcard flex items-center justify-center shrink-0 border border-bline">
                  <Ban size={14} />
                </div>
                <span className="text-xs font-medium">{noneLabel}</span>
              </div>
              {value === '' && <Check size={16} className="text-teal shrink-0" />}
            </button>
          )}

          {wallets.length === 0 ? (
            <div className="p-4 text-center text-muted text-xs">
              No wallets available
            </div>
          ) : (
            wallets.map((w) => {
              const isSelected = w.id === value;
              const isDisabled = w.id === disabledId;

              return (
                <button
                  key={w.id}
                  type="button"
                  disabled={isDisabled}
                  onClick={() => handleSelect(w.id)}
                  className={`w-full p-2.5 rounded-xl flex items-center justify-between text-left transition-all cursor-pointer ${
                    isDisabled
                      ? 'opacity-40 cursor-not-allowed bg-subcard/50'
                      : isSelected
                      ? 'bg-teal/15 text-teal shadow-xs'
                      : 'hover:bg-subcard text-main'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    <WalletLogo wallet={w} size="sm" />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <p className={`text-xs font-bold truncate ${isSelected ? 'text-teal' : 'text-main'}`}>
                          {w.name}
                        </p>
                        {isDisabled && (
                          <span className="text-[10px] text-muted italic">
                            (Same wallet)
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-muted mt-0.5">
                        {formatRupiah(w.balance || 0)}
                      </p>
                    </div>
                  </div>

                  {isSelected && (
                    <div className="w-5 h-5 rounded-full bg-teal text-bg flex items-center justify-center shrink-0 ml-2">
                      <Check size={12} className="stroke-[3]" />
                    </div>
                  )}
                </button>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
