import { io, Socket } from "socket.io-client";
import { create } from "zustand";

// const BASE_URL =
//   import.meta.env.MODE === "development" ? import.meta.env.VITE_API_URL : "/";

const BASE_URL = import.meta.env.VITE_API_URL || "/";

interface SocketState {
  socket: Socket | null;
  onlineUsers: string[];
  typingUsers: Record<string, string[]>;
  connectSocket: () => void;
  disconnectSocket: () => void;
  emitTyping: (chatId: string) => void;
  emitStopTyping: (chatId: string) => void;
}

export const useSocket = create<SocketState>()((set, get) => ({
  socket: null,
  onlineUsers: [],
  typingUsers: {},

  connectSocket: () => {
    const { socket } = get();
    if (socket?.connected) return;

    const newSocket = io(BASE_URL, {
      withCredentials: true,
      autoConnect: true,
    });

    set({ socket: newSocket });

    newSocket.on("connect", () => {
      console.log("Socket connected", newSocket.id);
    });

    newSocket.on("connect_error", (err) => {
      console.error("Socket connection error:", err.message);
    });

    newSocket.on("online:users", (userIds) => {
      console.log("Online users", userIds);
      set({ onlineUsers: userIds });
    });

    newSocket.on("typing", ({ chatId, userId }) => {
      console.log("Received typing event:", chatId, userId);
      set((state) => {
        const currentTyping = state.typingUsers[chatId] || [];
        if (!currentTyping.includes(userId)) {
          return {
            typingUsers: {
              ...state.typingUsers,
              [chatId]: [...currentTyping, userId],
            },
          };
        }
        return state;
      });
    });

    newSocket.on("stopTyping", ({ chatId, userId }) => {
      console.log("Received stopTyping event:", chatId, userId);
      set((state) => {
        const currentTyping = state.typingUsers[chatId] || [];
        return {
          typingUsers: {
            ...state.typingUsers,
            [chatId]: currentTyping.filter((id) => id !== userId),
          },
        };
      });
    });
  },

  disconnectSocket: () => {
    const { socket } = get();
    if (socket) {
      socket.disconnect();
      set({ socket: null });
    }
  },

  emitTyping: (chatId: string) => {
    const { socket } = get();
    if (socket?.connected) {
      socket.emit("typing", chatId);
    }
  },

  emitStopTyping: (chatId: string) => {
    const { socket } = get();
    if (socket?.connected) {
      socket.emit("stopTyping", chatId);
    }
  },
}));
