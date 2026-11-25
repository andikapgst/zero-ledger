// src/contexts/ToastContext.jsx
// Lightweight, responsive Toast notification system styled to match Zero Ledger's theme

import { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';

const ToastContext = createContext(null);

const TOAST_VARIANTS = {
  success: {
    icon: CheckCircle2,
    badgeBg: 'bg-teal/15 text-teal',
    border: 'border-teal/40 dark:border-teal/50',
    titleColor: 'text-teal',
    indicator: 'bg-teal',
  },
  error: {
    icon: AlertCircle,
    badgeBg: 'bg-rose-500/15 text-rose-500 dark:text-rose-400',
    border: 'border-rose-500/40 dark:border-rose-500/50',
    titleColor: 'text-rose-500 dark:text-rose-400',
    indicator: 'bg-rose-500',
  },
  warning: {
    icon: AlertTriangle,
    badgeBg: 'bg-amber-500/15 text-amber-500 dark:text-amber-400',
    border: 'border-amber-500/40 dark:border-amber-500/50',
    titleColor: 'text-amber-500 dark:text-amber-400',
    indicator: 'bg-amber-500',
  },
  info: {
    icon: Info,
    badgeBg: 'bg-sky-500/15 text-sky-500 dark:text-sky-400',
    border: 'border-sky-500/40 dark:border-sky-500/50',
    titleColor: 'text-sky-500 dark:text-sky-400',
    indicator: 'bg-sky-500',
  },
};

function ToastCard({ toast, variant, exiting, barWidth, onHide }) {
  const Icon = variant.icon;
  return (
    <div
      className={`
        relative flex items-center gap-3 p-3.5 rounded-2xl overflow-hidden
        bg-surface/95 dark:bg-[#121A1E]/95
        border ${variant.border}
        shadow-2xl shadow-black/25 backdrop-blur-md
        transition-all
        ${exiting
          ? 'opacity-0 -translate-y-2 scale-95 duration-300'
          : 'opacity-100 translate-y-0 scale-100 duration-200'}
      `}
    >
      {/* Icon Pill */}
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${variant.badgeBg}`}>
        <Icon size={20} className="stroke-[2.2]" />
      </div>

      {/* Message Body */}
      <div className="flex-1 min-w-0 pr-1">
        <p className={`text-xs font-bold ${variant.titleColor}`}>
          {toast.title}
        </p>
        <p className="text-[12px] text-muted line-clamp-2 mt-0.5 font-medium leading-snug">
          {toast.message}
        </p>
      </div>

      {/* Close Button */}
      <button
        onClick={onHide}
        className="w-7 h-7 rounded-lg bg-subcard hover:bg-slate-200 dark:hover:bg-white/10 flex items-center justify-center text-muted hover:text-main transition-colors cursor-pointer shrink-0"
        aria-label="Close notification"
      >
        <X size={14} />
      </button>

      {/* Progress Bar */}
      <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-black/10 dark:bg-white/5">
        <div
          className={`h-full ${variant.indicator} opacity-80`}
          style={{
            width: `${barWidth}%`,
            transition: barWidth < 100 ? 'width 5s linear' : 'none',
          }}
        />
      </div>
    </div>
  );
}

export function ToastProvider({ children }) {
  const [toast, setToast] = useState(null);
  const [exiting, setExiting] = useState(false);
  const [barWidth, setBarWidth] = useState(100);

  const autoHideTimer = useRef(null);
  const exitTimer = useRef(null);

  const hideToast = useCallback(() => {
    clearTimeout(autoHideTimer.current);
    clearTimeout(exitTimer.current);
    setExiting(true);
    exitTimer.current = setTimeout(() => {
      setToast(null);
      setExiting(false);
      setBarWidth(100);
    }, 300);
  }, []);

  const showToast = useCallback((message, type = 'success', title = null, duration = 5000) => {
    clearTimeout(autoHideTimer.current);
    clearTimeout(exitTimer.current);

    const resolvedType = TOAST_VARIANTS[type] ? type : 'success';
    const resolvedTitle = title || {
      success: 'Berhasil',
      error: 'Gagal',
      warning: 'Dihapus',
      info: 'Info',
    }[resolvedType];

    setExiting(false);
    setBarWidth(100);
    setToast({ id: Date.now(), message, type: resolvedType, title: resolvedTitle });

    // Trigger bar shrink after two frames so the browser paints 100% first
    requestAnimationFrame(() => {
      requestAnimationFrame(() => setBarWidth(0));
    });

    autoHideTimer.current = setTimeout(hideToast, duration);
  }, [hideToast]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearTimeout(autoHideTimer.current);
      clearTimeout(exitTimer.current);
    };
  }, []);

  const toastHelpers = {
    show: showToast,
    hide: hideToast,
    success: (msg, title) => showToast(msg, 'success', title),
    error: (msg, title) => showToast(msg, 'error', title),
    warning: (msg, title) => showToast(msg, 'warning', title),
    info: (msg, title) => showToast(msg, 'info', title),
  };

  const currentVariant = toast ? (TOAST_VARIANTS[toast.type] || TOAST_VARIANTS.success) : null;

  return (
    <ToastContext.Provider value={toastHelpers}>
      {children}

      {/* Toast Container: center on mobile, top-right on desktop */}
      {toast && (
        <div
          className={`
            fixed z-[100] pointer-events-none
            top-4 left-3 right-3
            sm:left-auto sm:right-4 sm:top-4 sm:w-80
          `}
        >
          <div className="pointer-events-auto">
            <ToastCard
              toast={toast}
              variant={currentVariant}
              exiting={exiting}
              barWidth={barWidth}
              onHide={hideToast}
            />
          </div>
        </div>
      )}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}
