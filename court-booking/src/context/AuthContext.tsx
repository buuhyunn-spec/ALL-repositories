/**
 * Auth context — stub that returns null user.
 * Components call useAuth() throughout; when real auth lands
 * only this file changes — no component updates needed.
 */
import { createContext, useContext, useState, type ReactNode } from 'react';
import type { User } from '../types';

interface AuthContextValue {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user] = useState<User | null>(null);
  const [isLoading] = useState(false);

  async function login(_email: string, _password: string) {
    // TODO: call authService.login(), set user
    throw new Error('Auth not implemented yet');
  }

  function logout() {
    // TODO: call authService.logout(), clear user
  }

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
