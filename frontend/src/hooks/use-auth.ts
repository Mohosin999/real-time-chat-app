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

  setUser: (user: UserType | null) => void;
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

      setUser: (user) => set({ user }),

      /* ---------------------------------
       * Register
       * --------------------------------- */
      register: async (data) => {
        set({ isSigningUp: true });

        try {
          const res = await API.post("/auth/register", data);

          set({ user: res.data.user });

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
          
          // Disconnect socket
          useSocket.getState().disconnectSocket();
          
          // Clear localStorage (Zustand persist storage)
          localStorage.removeItem("auth-storage");
          
          // Reset all auth state
          set({ user: null, isLoggingIn: false, isSigningUp: false, isAuthStatusLoading: false });

          toast.success("Logout successfully");
          window.location.href = "/sign-in";
        } catch (err: any) {
          toast.error(err.response?.data?.message || "Logout failed");
        }
      },

      /* ---------------------------------
       * Auth Status (ONLY when needed)
       * --------------------------------- */
      isAuthStatus: async () => {
        const existingUser = get().user;
        
        // If we already have a user from persist, skip API call and just connect socket
        if (existingUser) {
          useSocket.getState().connectSocket();
          return;
        }
        
        set({ isAuthStatusLoading: true });

        try {
          const res = await API.get("/auth/status");

          if (res.data.user) {
            set({ user: res.data.user });
            useSocket.getState().connectSocket();
          }
        } catch {
          // API failed, user remains null
        } finally {
          set({ isAuthStatusLoading: false });
        }
      },
    }),
    {
      name: "auth-storage",
      partialize: (state) => ({
        user: state.user,
      }),
      onRehydrateStorage: () => (state) => {
        if (state?.user) {
          useSocket.getState().connectSocket();
        }
      },
    }
  )
);
