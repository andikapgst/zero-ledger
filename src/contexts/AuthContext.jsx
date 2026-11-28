// src/contexts/AuthContext.jsx
// Provides global authentication state & profile helpers via React Context

import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, signInWithGoogle, signOut, upsertUserProfile, updateUserDisplayName } from '../lib/firebase';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser]               = useState(undefined); // undefined = loading
  const [displayName, setDisplayName] = useState('');
  const [photoURL, setPhotoURL]       = useState('');
  const [loading, setLoading]         = useState(true);

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
              setDisplayName(firebaseUser.displayName || '');
              const customPhoto = localStorage.getItem(`zl_custom_photo_${firebaseUser.uid}`);
              setPhotoURL(customPhoto || firebaseUser.photoURL || '');
              setLoading(false);

              try {
                await upsertUserProfile(firebaseUser);
              } catch (err) {
                console.warn('Gagal sinkron profil user ke Firestore:', err);
              }
            } else {
              setUser(null);
              setDisplayName('');
              setPhotoURL('');
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

  const updateDisplayName = useCallback(async (newName) => {
    const saved = await updateUserDisplayName(newName);
    setDisplayName(saved);
    return saved;
  }, []);

  const updatePhotoURL = useCallback((newPhotoUrl) => {
    if (!user?.uid) return;
    if (newPhotoUrl) {
      localStorage.setItem(`zl_custom_photo_${user.uid}`, newPhotoUrl);
      setPhotoURL(newPhotoUrl);
    } else {
      localStorage.removeItem(`zl_custom_photo_${user.uid}`);
      setPhotoURL(user.photoURL || '');
    }
  }, [user]);

  return (
    <AuthContext.Provider value={{ user, displayName, photoURL, loading, login, logout, updateDisplayName, updatePhotoURL }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
