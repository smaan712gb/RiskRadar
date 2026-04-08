import { create } from 'zustand';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: string;
  tenantId: string;
  tenantName?: string;
  tenantSlug?: string;
}

interface AuthState {
  token: string | null;
  user: AuthUser | null;
  isAuthenticated: boolean;
  login: (token: string, user: AuthUser) => void;
  logout: () => void;
  hydrate: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  token: null,
  user: null,
  isAuthenticated: false,

  login: (token, user) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('riskradar_token', token);
      localStorage.setItem('riskradar_user', JSON.stringify(user));
    }
    set({ token, user, isAuthenticated: true });
  },

  logout: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('riskradar_token');
      localStorage.removeItem('riskradar_user');
    }
    set({ token: null, user: null, isAuthenticated: false });
  },

  hydrate: () => {
    if (typeof window === 'undefined') return;
    const token = localStorage.getItem('riskradar_token');
    const userStr = localStorage.getItem('riskradar_user');
    if (token && userStr) {
      try {
        const user = JSON.parse(userStr) as AuthUser;
        set({ token, user, isAuthenticated: true });
      } catch {
        set({ token: null, user: null, isAuthenticated: false });
      }
    }
  },
}));
