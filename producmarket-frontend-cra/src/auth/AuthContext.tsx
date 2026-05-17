import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import {
  getStoredToken,
  getStoredUser,
  getMe,
  setStoredAuth,
  clearStoredAuth,
  type AuthUser,
} from '../api/client';
import { AppLoading } from '../components/ui/AppLoading';

type AuthContextValue = {
  user: AuthUser | null;
  isAuthenticated: boolean;
  login: (token: string, user: AuthUser) => void;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => getStoredUser());
  const [sessionChecked, setSessionChecked] = useState(() => !getStoredToken());

  useEffect(() => {
    const token = getStoredToken();
    if (!token) {
      setSessionChecked(true);
      return;
    }
    getMe()
      .then(({ data }) => {
        setStoredAuth(token, data.user);
        setUser(data.user);
      })
      .catch(() => {
        clearStoredAuth();
        setUser(null);
      })
      .finally(() => setSessionChecked(true));
  }, []);

  const login = useCallback((token: string, u: AuthUser) => {
    setStoredAuth(token, u);
    setUser(u);
  }, []);

  const logout = useCallback(() => {
    clearStoredAuth();
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({
      user,
      isAuthenticated: Boolean(user),
      login,
      logout,
    }),
    [user, login, logout]
  );

  if (!sessionChecked) {
    return <AppLoading />;
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth debe usarse dentro de AuthProvider');
  }
  return ctx;
}
