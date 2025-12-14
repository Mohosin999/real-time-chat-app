/* eslint-disable @typescript-eslint/no-explicit-any */
import { API } from "@/lib/axios-client";
import { toast } from "sonner";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { useSocket } from "./use-socket";
import type { LoginType, RegisterType, UserType } from "@/types/auth";

interface AuthState {
  user: UserType | null;

  isLoggingIn: boolean;
  isSigningUp: boolean;
  isAuthStatusLoading: boolean;

  register: (data: RegisterType) => Promise<void>;
  login: (data: LoginType) => Promise<void>;
  logout: () => Promise<void>;
  isAuthStatus: () => Promise<void>;
}

export const useAuth = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,

      isLoggingIn: false,
      isSigningUp: false,
      isAuthStatusLoading: false,

      /* ---------------------------------
       * Register
       * --------------------------------- */
      register: async (data) => {
        set({ isSigningUp: true });

        try {
          const res = await API.post("/auth/register", data);

          set({ user: res.data.user });

          // socket connect only once
          useSocket.getState().connectSocket();

          toast.success("Register successfully");
        } catch (err: any) {
          toast.error(err.response?.data?.message || "Register failed");
        } finally {
          set({ isSigningUp: false });
        }
      },

      /* ---------------------------------
       * Login
       * --------------------------------- */
      login: async (data) => {
        set({ isLoggingIn: true });

        try {
          const res = await API.post("/auth/login", data);

          set({ user: res.data.user });

          useSocket.getState().connectSocket();

          toast.success("Login successfully");
        } catch (err: any) {
          toast.error(err.response?.data?.message || "Login failed");
        } finally {
          set({ isLoggingIn: false });
        }
      },

      /* ---------------------------------
       * Logout
       * --------------------------------- */
      logout: async () => {
        try {
          await API.post("/auth/logout");

          set({ user: null });

          useSocket.getState().disconnectSocket();

          toast.success("Logout successfully");
        } catch (err: any) {
          toast.error(err.response?.data?.message || "Logout failed");
        }
      },

      /* ---------------------------------
       * Auth Status (ONLY when needed)
       * --------------------------------- */
      isAuthStatus: async () => {
        // 🚨 important: if already have user, skip API call
        if (get().user) return;

        set({ isAuthStatusLoading: true });

        try {
          const res = await API.get("/auth/status");

          set({ user: res.data.user });

          useSocket.getState().connectSocket();
        } catch {
          set({ user: null });
        } finally {
          set({ isAuthStatusLoading: false });
        }
      },
    }),
    {
      name: "auth-storage",
      // storage: createJSONStorage(() => localStorage),

      // // ✅ ONLY persist user
      // partialize: (state) => ({
      //   user: state.user,
      // }),

      // // ✅ reload হলে socket auto connect
      // onRehydrateStorage: () => (state) => {
      //   if (state?.user) {
      //     useSocket.getState().connectSocket();
      //   }
      // },
    }
  )
);
