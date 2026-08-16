import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { ApiError, authApi, setUnauthorizedHandler } from '../api/client';
import type { SessionInfo } from '../api/types';

interface AuthContextValue {
  session: SessionInfo | null;
  status: 'checking' | 'authenticated' | 'anonymous';
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  /** Called by any API consumer that receives a 401 mid-session (idle timeout, revoked cookie). */
  handleUnauthorized: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<SessionInfo | null>(null);
  const [status, setStatus] = useState<AuthContextValue['status']>('checking');

  useEffect(() => {
    authApi
      .me()
      .then((info) => {
        setSession(info);
        setStatus('authenticated');
      })
      .catch(() => setStatus('anonymous'));
  }, []);

  const login = useCallback(async (username: string, password: string) => {
    await authApi.login(username, password);
    const info = await authApi.me();
    setSession(info);
    setStatus('authenticated');
  }, []);

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } catch (err) {
      if (!(err instanceof ApiError)) throw err;
    }
    setSession(null);
    setStatus('anonymous');
  }, []);

  const handleUnauthorized = useCallback(() => {
    setSession(null);
    setStatus('anonymous');
  }, []);

  // Any 401 from any API call (not just the ones a caller happens to check
  // for) drops the app back to the login screen immediately.
  useEffect(() => {
    setUnauthorizedHandler(handleUnauthorized);
    return () => setUnauthorizedHandler(null);
  }, [handleUnauthorized]);

  const value = useMemo(
    () => ({ session, status, login, logout, handleUnauthorized }),
    [session, status, login, logout, handleUnauthorized]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
