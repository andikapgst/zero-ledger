// src/contexts/TransactionModalContext.jsx
// Global context for Quick Menu and Specific Full Transaction Modals

import { createContext, useContext, useState } from 'react';

const TransactionModalContext = createContext(null);

export function TransactionModalProvider({ children }) {
  const [isQuickMenuOpen, setIsQuickMenuOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeType, setActiveType] = useState('expense'); // 'income' | 'expense' | 'transfer' | 'savings' | 'debt'
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Toggle or open/close quick popup menu
  const toggleQuickMenu = () => {
    setIsQuickMenuOpen(prev => !prev);
  };

  const closeQuickMenu = () => {
    setIsQuickMenuOpen(false);
  };

  // Open specific full modal directly
  const openModal = (type = 'expense') => {
    setActiveType(type);
    setIsQuickMenuOpen(false);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  const notifyTransactionSaved = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  return (
    <TransactionModalContext.Provider
      value={{
        isQuickMenuOpen,
        toggleQuickMenu,
        closeQuickMenu,
        isModalOpen,
        activeType,
        openModal,
        closeModal,
        notifyTransactionSaved,
        refreshTrigger,
      }}
    >
      {children}
    </TransactionModalContext.Provider>
  );
}

export function useTransactionModal() {
  const ctx = useContext(TransactionModalContext);
  if (!ctx) throw new Error('useTransactionModal must be used inside TransactionModalProvider');
  return ctx;
}
