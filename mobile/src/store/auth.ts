import { create } from 'zustand';

interface User {
  id: string;
  email: string | null;
}

interface AuthState {
  accessToken: string | null;
  user: User | null;
  isAuthenticated: boolean;
  hasCheckedSession: boolean;
  setSession: (accessToken: string, user: User) => void;
  setCookieSession: (user: User) => void;
  markSessionChecked: () => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  accessToken: null,
  user: null,
  isAuthenticated: false,
  hasCheckedSession: false,
  setSession: (accessToken, user) =>
    set({
      accessToken,
      user,
      isAuthenticated: true,
      hasCheckedSession: true,
    }),
  setCookieSession: (user) =>
    set({
      user,
      isAuthenticated: true,
      hasCheckedSession: true,
    }),
  markSessionChecked: () =>
    set({
      hasCheckedSession: true,
    }),
  logout: () =>
    set({
      accessToken: null,
      user: null,
      isAuthenticated: false,
      hasCheckedSession: true,
    }),
}));
