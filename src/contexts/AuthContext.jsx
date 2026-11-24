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
    // Safety timer: maximum 3 seconds wait for auth resolution
    const timeoutId = setTimeout(() => {
      setLoading(false);
    }, 3000);

    let unsubscribe = () => {};
    try {
      if (auth) {
        unsubscribe = onAuthStateChanged(
          auth,
          async (firebaseUser) => {
            clearTimeout(timeoutId);
            if (firebaseUser) {
              setUser(firebaseUser);
              setLoading(false);

              try {
                await upsertUserProfile(firebaseUser);
              } catch (err) {
                console.warn('Gagal sinkron profil user ke Firestore:', err);
              }
            } else {
              setUser(null);
              setLoading(false);
            }
          },
          (err) => {
            console.error('onAuthStateChanged error:', err);
            clearTimeout(timeoutId);
            setLoading(false);
          }
        );
      } else {
        clearTimeout(timeoutId);
        setLoading(false);
      }
    } catch (err) {
      console.error('Firebase Auth failed to attach listener:', err);
      clearTimeout(timeoutId);
      setLoading(false);
    }

    return () => {
      clearTimeout(timeoutId);
      unsubscribe();
    };
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
