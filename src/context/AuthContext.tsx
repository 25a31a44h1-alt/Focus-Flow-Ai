import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import { User, onAuthStateChanged, signInWithPopup, signOut as fbSignOut } from 'firebase/auth';
import { auth, googleAuthProvider } from '../lib/firebase.ts';
import { api, UserSettings } from '../lib/api.ts';

export interface AuthContextType {
  user: {
    uid: string;
    email: string;
    displayName: string;
    photoURL?: string | null;
    isGuest: boolean;
  } | null;
  settings: UserSettings | null;
  loading: boolean;
  error: string | null;
  loginWithGoogle: () => Promise<void>;
  loginAsGuest: () => void;
  logout: () => Promise<void>;
  refreshSettings: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const GUEST_KEY = 'focusflow_guest_session_id';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<AuthContextType['user']>(null);
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Set up API token resolver
  useEffect(() => {
    api.setTokenGetter(async () => {
      const fbUser = auth.currentUser;
      if (fbUser) {
        return fbUser.getIdToken();
      }
      const guestId = localStorage.getItem(GUEST_KEY);
      if (guestId) {
        return `demo-guest-token-${guestId}`;
      }
      return null;
    });
  }, []);

  const syncWithBackend = async () => {
    try {
      const res = await api.syncAuth();
      if (res.settings) {
        setSettings(res.settings);
      }
    } catch (err: any) {
      console.warn('Sync with backend warning:', err.message);
    }
  };

  const refreshSettings = async () => {
    try {
      const updated = await api.getSettings();
      setSettings(updated);
    } catch (err) {
      console.error('Failed to refresh settings:', err);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: User | null) => {
      setLoading(true);
      setError(null);
      if (firebaseUser) {
        // Clear guest if logged in
        localStorage.removeItem(GUEST_KEY);
        setCurrentUser({
          uid: firebaseUser.uid,
          email: firebaseUser.email || 'student@focusflow.ai',
          displayName: firebaseUser.displayName || 'Focus Student',
          photoURL: firebaseUser.photoURL,
          isGuest: false,
        });
        await syncWithBackend();
        setLoading(false);
      } else {
        // Check for guest session
        const storedGuestId = localStorage.getItem(GUEST_KEY);
        if (storedGuestId) {
          setCurrentUser({
            uid: storedGuestId,
            email: 'guest.student@focusflow.ai',
            displayName: 'Guest Student',
            photoURL: null,
            isGuest: true,
          });
          await syncWithBackend();
        } else {
          // Initialize default guest student session with seeded starter records
          const initialGuestId = 'guest-student';
          localStorage.setItem(GUEST_KEY, initialGuestId);
          setCurrentUser({
            uid: initialGuestId,
            email: 'student@focusflow.ai',
            displayName: 'Alex Rivera',
            photoURL: null,
            isGuest: true,
          });
          await syncWithBackend();
        }
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const loginWithGoogle = async () => {
    setError(null);
    try {
      const result = await signInWithPopup(auth, googleAuthProvider);
      if (result.user) {
        localStorage.removeItem(GUEST_KEY);
      }
    } catch (err: any) {
      console.error('Google Sign-in error:', err);
      setError(err.message || 'Failed to sign in with Google');
    }
  };

  const loginAsGuest = () => {
    const guestId = 'guest-' + Math.random().toString(36).substring(2, 10);
    localStorage.setItem(GUEST_KEY, guestId);
    setCurrentUser({
      uid: guestId,
      email: 'guest.student@focusflow.ai',
      displayName: 'Guest Student',
      photoURL: null,
      isGuest: true,
    });
    syncWithBackend();
  };

  const logout = async () => {
    try {
      await fbSignOut(auth);
      localStorage.removeItem(GUEST_KEY);
      // Re-create a fresh student session
      const newGuestId = 'student-' + Math.random().toString(36).substring(2, 9);
      localStorage.setItem(GUEST_KEY, newGuestId);
      setCurrentUser({
        uid: newGuestId,
        email: 'guest.student@focusflow.ai',
        displayName: 'Guest Student',
        photoURL: null,
        isGuest: true,
      });
      await syncWithBackend();
    } catch (err: any) {
      console.error('Logout error:', err);
    }
  };

  const value = useMemo(
    () => ({
      user: currentUser,
      settings,
      loading,
      error,
      loginWithGoogle,
      loginAsGuest,
      logout,
      refreshSettings,
    }),
    [currentUser, settings, loading, error]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
