// src/contexts/AuthContext.jsx
// Provides global authentication state via React Context

import { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, signInWithGoogle, signOut, upsertUserProfile } from '../lib/firebase';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(undefined); // undefined = loading
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // Langsung set user terlebih dahulu agar UI tidak nge-hang
        setUser(firebaseUser);
        setLoading(false);

        // upsertUserProfile dijalankan di latar belakang tanpa memblokir sesi login
        try {
          await upsertUserProfile(firebaseUser);
        } catch (err) {
          console.warn('Gagal sinkron profil user ke Firestore (cek Firestore Rules):', err);
        }
      } else {
        setUser(null);
        setLoading(false);
      }
    });
    return unsubscribe;
  }, []);

  const login  = () => signInWithGoogle();
  const logout = () => signOut();

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
