import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { authApi } from '../api/auth';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const cached = localStorage.getItem('pb_user');
      return cached ? JSON.parse(cached) : null;
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(true);

  const persistUser = useCallback((u) => {
    setUser(u);
    if (u) localStorage.setItem('pb_user', JSON.stringify(u));
    else localStorage.removeItem('pb_user');
  }, []);

  const refreshMe = useCallback(async () => {
    const token = localStorage.getItem('pb_token');
    if (!token) {
      setLoading(false);
      return;
    }
    try {
      const { user } = await authApi.me();
      persistUser(user);
    } catch {
      localStorage.removeItem('pb_token');
      persistUser(null);
    } finally {
      setLoading(false);
    }
  }, [persistUser]);

  useEffect(() => {
    refreshMe();
  }, [refreshMe]);

  const login = async (email, password) => {
    const data = await authApi.login({ email, password });
    localStorage.setItem('pb_token', data.token);
    persistUser(data.user);
    return data.user;
  };

  const register = async (payload) => {
    const data = await authApi.register(payload);
    localStorage.setItem('pb_token', data.token);
    persistUser(data.user);
    return data.user;
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } catch {
      /* ignore */
    }
    localStorage.removeItem('pb_token');
    persistUser(null);
  };

  const updateUser = (u) => persistUser(u);

  return (
    <AuthContext.Provider
      value={{ user, loading, login, register, logout, updateUser, refreshMe, isAuthed: !!user }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
