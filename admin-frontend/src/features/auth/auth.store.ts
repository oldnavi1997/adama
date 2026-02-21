import { create } from "zustand";

type User = {
  id: string;
  email: string;
  fullName: string;
  role: "CUSTOMER" | "ADMIN";
};

type AuthState = {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  setSession: (payload: { user: User; accessToken: string; refreshToken: string }) => void;
  hydrate: (payload: { user: User | null; accessToken: string | null; refreshToken: string | null }) => void;
  logout: () => void;
};

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  accessToken: null,
  refreshToken: null,
  setSession: ({ user, accessToken, refreshToken }) => {
    localStorage.setItem("admin_accessToken", accessToken);
    localStorage.setItem("admin_refreshToken", refreshToken);
    set({ user, accessToken, refreshToken });
  },
  hydrate: ({ user, accessToken, refreshToken }) => {
    set({ user, accessToken, refreshToken });
  },
  logout: () => {
    localStorage.removeItem("admin_accessToken");
    localStorage.removeItem("admin_refreshToken");
    set({ user: null, accessToken: null, refreshToken: null });
  }
}));
