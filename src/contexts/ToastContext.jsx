// src/contexts/ToastContext.jsx
// Lightweight, responsive Toast notification system styled to match Zero Ledger's theme

import { createContext, useContext, useState, useCallback, useRef } from 'react';
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

export function ToastProvider({ children }) {
  const [toast, setToast] = useState(null);
  const timerRef = useRef(null);

  const hideToast = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setToast(null);
  }, []);

  const showToast = useCallback((message, type = 'success', title = null, duration = 3500) => {
    if (timerRef.current) clearTimeout(timerRef.current);

    setToast({
      id: Date.now(),
      message,
      type: TOAST_VARIANTS[type] ? type : 'success',
      title: title || (type === 'success' ? 'Success' : type === 'error' ? 'Error' : type === 'warning' ? 'Notice' : 'Info'),
    });

    timerRef.current = setTimeout(() => {
      setToast(null);
    }, duration);
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
  const IconComponent = currentVariant ? currentVariant.icon : null;

  return (
    <ToastContext.Provider value={toastHelpers}>
      {children}

      {/* Floating Top Notification Toast */}
      {toast && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-[100] w-[calc(100%-2rem)] max-w-sm pointer-events-auto">
          <div
            className={`
              relative flex items-center gap-3 p-3.5 rounded-2xl
              bg-surface/95 dark:bg-[#121A1E]/95
              border ${currentVariant.border}
              shadow-2xl shadow-black/20 backdrop-blur-md
              animate-in slide-in-from-top-4 fade-in duration-200 ease-out
            `}
          >
            {/* Icon Pill */}
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${currentVariant.badgeBg}`}>
              <IconComponent size={20} className="stroke-[2.2]" />
            </div>

            {/* Message Body */}
            <div className="flex-1 min-w-0 pr-1">
              <p className={`text-xs font-bold ${currentVariant.titleColor}`}>
                {toast.title}
              </p>
              <p className="text-[12px] text-muted line-clamp-2 mt-0.5 font-medium leading-snug">
                {toast.message}
              </p>
            </div>

            {/* Close Button */}
            <button
              onClick={hideToast}
              className="w-7 h-7 rounded-lg bg-subcard hover:bg-slate-200 dark:hover:bg-white/10 flex items-center justify-center text-muted hover:text-main transition-colors cursor-pointer shrink-0"
              aria-label="Close notification"
            >
              <X size={14} />
            </button>
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
