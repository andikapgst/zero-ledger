// src/pages/LoginPage.jsx
// Google Sign-In landing page (English UI) with Theme Toggle

import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { TrendingUp, Shield, Zap, AlertCircle } from 'lucide-react';
import ThemeToggle from '../components/layout/ThemeToggle';

const FEATURES = [
  { icon: TrendingUp, title: 'Track Finances in Real-time', desc: 'Monitor your income, expenses, and asset transfers seamlessly.' },
  { icon: Shield,     title: 'Secure Cloud Storage',        desc: 'Stored safely on Firebase with Google authentication encryption.' },
  { icon: Zap,        title: 'Zero-Based Analytics',        desc: 'Smart monthly budgeting, net worth tracking, and loan insights.' },
];

export default function LoginPage() {
  const { user, loading, login } = useAuth();
  const navigate  = useNavigate();
  const location  = useLocation();
  const from      = location.state?.from?.pathname || '/';

  const [signingIn, setSigningIn] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (!loading && user) {
      navigate(from, { replace: true });
    }
  }, [user, loading, from, navigate]);

  const handleLogin = async () => {
    setSigningIn(true);
    setErrorMessage('');
    try {
      const res = await login();
      if (res?.user) {
        navigate(from, { replace: true });
      }
    } catch (err) {
      console.error('Login error:', err);
      let msg = 'Failed to sign in with Google. Please try again.';
      if (err.code === 'auth/popup-closed-by-user') {
        msg = 'Sign-in popup was closed before completion.';
      } else if (err.code === 'auth/unauthorized-domain') {
        msg = 'This domain is not authorized in Firebase Console > Authentication > Settings > Authorized Domains.';
      } else if (err.code === 'auth/operation-not-allowed') {
        msg = 'Google Sign-in is not enabled in Firebase Console.';
      } else if (err.code === 'auth/network-request-failed') {
        msg = 'Network connection problem. Please verify your internet connection.';
      } else if (err.message) {
        msg = err.message;
      }
      setErrorMessage(msg);
    } finally {
      setSigningIn(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg flex flex-col items-center justify-center px-6 py-12 relative">
      <div className="absolute top-5 right-5">
        <ThemeToggle />
      </div>

      {/* Logo */}
      <div className="mb-8 flex flex-col items-center gap-3">
        <div className="w-20 h-20 rounded-3xl bg-teal flex items-center justify-center shadow-2xl shadow-teal/40">
          <span className="text-3xl font-black text-bg tracking-tight">ZL</span>
        </div>
        <div className="text-center">
          <h1 className="text-3xl font-bold text-white tracking-tight">Zero Ledger</h1>
          <p className="text-muted text-sm mt-1">Personal Finance & Zero-Based Budgeting PWA</p>
        </div>
      </div>

      {/* Feature pills */}
      <div className="w-full max-w-sm space-y-3 mb-8">
        {FEATURES.map(({ icon: Icon, title, desc }) => (
          <div key={title} className="flex items-start gap-4 bg-surface rounded-2xl p-4 border border-white/5">
            <div className="mt-0.5 w-9 h-9 rounded-xl bg-teal/10 flex items-center justify-center shrink-0">
              <Icon className="w-4.5 h-4.5 text-teal" size={18} />
            </div>
            <div>
              <p className="text-white text-sm font-semibold">{title}</p>
              <p className="text-muted text-xs mt-0.5 leading-relaxed">{desc}</p>
            </div>
          </div>
        ))}
      </div>

      {errorMessage && (
        <div className="w-full max-w-sm mb-4 p-3.5 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-start gap-2.5">
          <AlertCircle size={16} className="shrink-0 mt-0.5" />
          <div className="leading-relaxed">
            <p className="font-semibold">Sign In Notice</p>
            <p className="mt-0.5 opacity-90">{errorMessage}</p>
          </div>
        </div>
      )}

      {/* Google Sign-In Button */}
      <div className="w-full max-w-sm space-y-4">
        <button
          onClick={handleLogin}
          disabled={signingIn}
          className="w-full flex items-center justify-center gap-3 bg-white hover:bg-gray-100 active:bg-gray-200 text-gray-800 font-semibold py-3.5 px-6 rounded-2xl transition-all duration-150 shadow-lg disabled:opacity-60 cursor-pointer"
        >
          <svg className="w-5 h-5" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8c-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4C12.955 4 4 12.955 4 24s8.955 20 20 20s20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z" fill="#FFC107"/>
            <path d="M6.306 14.691l6.571 4.819C14.655 15.108 19.001 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4C16.318 4 9.656 8.337 6.306 14.691z" fill="#FF3D00"/>
            <path d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238A11.91 11.91 0 0 1 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z" fill="#4CAF50"/>
            <path d="M43.611 20.083H42V20H24v8h11.303a12.04 12.04 0 0 1-4.087 5.571l.003-.002l6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z" fill="#1976D2"/>
          </svg>
          {signingIn ? 'Connecting to Google...' : 'Continue with Google'}
        </button>

        <p className="text-center text-muted text-xs leading-relaxed">
          By signing in, you agree to our{' '}
          <span className="text-teal cursor-pointer hover:underline">Terms of Service</span>
          {' '}and{' '}
          <span className="text-teal cursor-pointer hover:underline">Privacy Policy</span>
        </p>
      </div>

      <p className="mt-8 text-muted/50 text-xs">v1.0.0 · Zero Ledger PWA</p>
    </div>
  );
}
