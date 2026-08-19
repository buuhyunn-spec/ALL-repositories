/**
 * Auth service — stub.
 * ★ Replace with real OAuth / JWT logic when auth is added.
 *   - login()   → api.post('/auth/login', credentials) → store token
 *   - logout()  → api.post('/auth/logout') → clear token
 *   - getMe()   → api.get('/auth/me')
 */
import type { User } from '../types';

export const authService = {
  async login(_email: string, _password: string): Promise<User> {
    // TODO: replace with real API call
    throw new Error('Auth not implemented yet');
  },

  async logout(): Promise<void> {
    // TODO: clear token from storage / cookies
  },

  async getMe(): Promise<User | null> {
    // TODO: validate stored token, return user or null
    return null;
  },
};
