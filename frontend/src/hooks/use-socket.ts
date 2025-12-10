import { io, Socket } from "socket.io-client";
import { create } from "zustand";

const BASE_URL =
  import.meta.env.MODE === "development" ? import.meta.env.VITE_API_URL : "/";

interface SocketState {
  socket: Socket | null;
  onlineUsers: string[];
  connectSocket: () => void;
  disconnectSocket: () => void;
}

// Zustand store to manage socket connection state
export const useSocket = create<SocketState>()((set, get) => ({
  socket: null,
  onlineUsers: [],

  /**
   * -------------------------------------------------
   * Function to connect the socket
   * -------------------------------------------------
   */
  connectSocket: () => {
    const { socket } = get();
    console.log(socket, "socket");

    // If socket is already connected, do nothing
    if (socket?.connected) return;

    // Create a new socket connection with credentials and auto-connect enabled
    const newSocket = io(BASE_URL, {
      withCredentials: true,
      autoConnect: true,
    });

    // Save the new socket instance to state
    set({ socket: newSocket });

    newSocket.on("connect", () => {
      console.log("Socket connected", newSocket.id);
    });

    // Update the onlineUsers state whenever server emits the 'online:users' event
    newSocket.on("online:users", (userIds) => {
      console.log("Online users", userIds);
      set({ onlineUsers: userIds });
    });
  },

  /**
   * -------------------------------------------------
   * Function to disconnect the socket
   * -------------------------------------------------
   */
  disconnectSocket: () => {
    const { socket } = get();

    if (socket) {
      socket.disconnect(); // Disconnect the socket
      set({ socket: null }); // Reset the socket in state
    }
  },
}));

// 4 hours 4min
