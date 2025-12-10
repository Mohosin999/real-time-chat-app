/* eslint-disable @typescript-eslint/no-explicit-any */
import { API } from "@/lib/axios-client";
import { toast } from "sonner";
import { create } from "zustand";
import { useSocket } from "./use-socket";
import type { LoginType, RegisterType, UserType } from "@/types/auth";

interface AuthState {
  user: UserType | null;
  isLoggingIn: boolean;
  isSigningUp: boolean;
  isAuthStatusLoading: boolean;

  register: (data: RegisterType) => void;
  login: (data: LoginType) => void;
  logout: () => void;
  isAuthStatus: () => void;
}

// Create the Zustand store for authentication
export const useAuth = create<AuthState>()((set) => ({
  user: null,
  isSigningUp: false,
  isLoggingIn: false,
  isAuthStatusLoading: false,

  /**
   * -------------------------------------------------
   * Register a new user
   * -------------------------------------------------
   */
  register: async (data: RegisterType) => {
    set({ isSigningUp: true });

    try {
      const response = await API.post("/auth/register", data);
      set({ user: response.data.user });

      // Connect to socket after successful register
      useSocket.getState().connectSocket();

      toast.success("Register successfully");
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Register failed");
    } finally {
      set({ isSigningUp: false });
    }
  },

  /**
   * -------------------------------------------------
   * Log in a user
   * -------------------------------------------------
   */
  login: async (data: LoginType) => {
    set({ isLoggingIn: true });

    try {
      const response = await API.post("/auth/login", data);
      set({ user: response.data.user });

      // Connect to socket after successful login
      useSocket.getState().connectSocket();

      toast.success("Login successfully");
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Login failed");
    } finally {
      set({ isLoggingIn: false });
    }
  },

  /**
   * -------------------------------------------------
   * Logout the user
   * -------------------------------------------------
   */
  logout: async () => {
    try {
      await API.post("/auth/logout");
      set({ user: null });

      // Disconnect socket after logout
      useSocket.getState().disconnectSocket();

      toast.success("Logout successfully");
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Logout failed");
    }
  },

  /**
   * -------------------------------------------------
   * Check if the user is already authenticated
   * -------------------------------------------------
   */
  isAuthStatus: async () => {
    set({ isAuthStatusLoading: true });

    try {
      const response = await API.get("/auth/status");
      set({ user: response.data.user });

      // Connect socket if authenticated
      useSocket.getState().connectSocket();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Authentication failed");
      console.log(err);
    } finally {
      set({ isAuthStatusLoading: false });
    }
  },
}));
