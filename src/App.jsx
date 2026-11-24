// src/App.jsx
// Root routing: public login route + protected app routes + providers (Auth, Theme, TransactionModal)

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { TransactionModalProvider } from './contexts/TransactionModalContext';
import { ToastProvider } from './contexts/ToastContext';
import ProtectedRoute  from './components/ui/ProtectedRoute';
import AppShell        from './components/layout/AppShell';
import LoginPage       from './pages/LoginPage';
import HomePage        from './pages/HomePage';
import TransaksiPage   from './pages/TransaksiPage';
import WalletPage      from './pages/WalletPage';
import AnalisisPage    from './pages/AnalisisPage';
import BudgetPage      from './pages/BudgetPage';
import HutangPage      from './pages/HutangPage';

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <ToastProvider>
          <TransactionModalProvider>
            <BrowserRouter>
              <Routes>
                {/* Public */}
                <Route path="/login" element={<LoginPage />} />

                {/* Protected: wrapped in AppShell with Global Modal & BottomNav */}
                <Route
                  element={
                    <ProtectedRoute>
                      <AppShell />
                    </ProtectedRoute>
                  }
                >
                  <Route index element={<HomePage />} />
                  <Route path="transaksi" element={<TransaksiPage />} />
                  <Route path="wallet"    element={<WalletPage />} />
                  <Route path="budget"    element={<BudgetPage />} />
                  <Route path="hutang"    element={<HutangPage />} />
                  <Route path="analisis"  element={<AnalisisPage />} />
                </Route>

                {/* Catch-all */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </BrowserRouter>
          </TransactionModalProvider>
        </ToastProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
