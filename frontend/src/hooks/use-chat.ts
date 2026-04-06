/* eslint-disable @typescript-eslint/no-explicit-any */
import { create } from "zustand";
import type { UserType } from "@/types/auth";
import type {
  ChatType,
  CreateChatType,
  CreateMessageType,
  MessageType,
} from "@/types/chat";
import { API } from "@/lib/axios-client";
import { toast } from "sonner";
import { useAuth } from "./use-auth";
import { generateUUID } from "@/lib/helper";

interface ChatState {
  chats: ChatType[];
  users: UserType[];
  singleChat: {
    chat: ChatType;
    messages: MessageType[];
  } | null;

  currentAIStreamId: string | null;

  isChatsLoading: boolean;
  isUsersLoading: boolean;
  isCreatingChat: boolean;
  isSingleChatLoading: boolean;
  isSendingMsg: boolean;

  fetchAllUsers: () => void;
  fetchChats: () => void;
  createChat: (payload: CreateChatType) => Promise<ChatType | null>;
  fetchSingleChat: (chatId: string) => void;
  sendMessage: (payload: CreateMessageType) => void;
  deleteChat: (chatId: string) => Promise<boolean>;

  addNewChat: (newChat: ChatType) => void;
  updateChatLastMessage: (chatId: string, lastMessage: MessageType) => void;
  addNewMessage: (chatId: string, message: MessageType) => void;
  removeMessage: (chatId: string, messageId: string) => void;
}

export const useChat = create<ChatState>()((set, get) => ({
  chats: [],
  users: [],
  singleChat: null,

  isChatsLoading: false,
  isUsersLoading: false,
  isCreatingChat: false,
  isSingleChatLoading: false,
  isSendingMsg: false,

  currentAIStreamId: null,

  /**
   * Fetch the list of all users from the backend.
   * Usually used when starting a new chat.
   */
  fetchAllUsers: async () => {
    set({ isUsersLoading: true });

    try {
      // API call to retrieve all users
      const { data } = await API.get("/users");

      // Store the fetched users in Zustand state
      set({ users: data.users });
    } catch (error: any) {
      // Show an error toast if API fails
      toast.error(error?.response?.data?.message || "Failed to fetch users");
    } finally {
      // Loading ends whether success or fail
      set({ isUsersLoading: false });
    }
  },

  /**
   * Fetch all chats for the logged-in user.
   */
  fetchChats: async () => {
    set({ isChatsLoading: true });

    try {
      // Get all chat records
      const { data } = await API.get("/chats");

      // Update chat state
      set({ chats: data.chats });
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to fetch chats");
    } finally {
      set({ isChatsLoading: false });
    }
  },

  /**
   * Create a new chat between two or more users.
   * Returns the created chat so the caller can redirect to it.
   */
  createChat: async (payload: CreateChatType) => {
    set({ isCreatingChat: true });

    try {
      // Backend request to create the chat
      const response = await API.post("/chats", { ...payload });

      // Add the newly created chat to the top of chat list
      get().addNewChat(response.data.chat);

      toast.success("Chat created successfully");

      return response.data.chat;
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to create chat");
      return null;
    } finally {
      set({ isCreatingChat: false });
    }
  },

  /**
   * Fetch a single chat with all messages for chat screen.
   */
  fetchSingleChat: async (chatId: string) => {
    set({ isSingleChatLoading: true });

    try {
      // Load chat & messages
      const { data } = await API.get(`/chats/${chatId}`);

      // Save result in Zustand state
      set({ singleChat: data });
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to fetch chat");
    } finally {
      set({ isSingleChatLoading: false });
    }
  },

  /**
   * Send a message inside a chat.
   * Includes:
   * 1. Sending temporary message instantly (for fast UI)
   * 2. Replacing it with real message after server response
   */
  sendMessage: async (payload: CreateMessageType) => {
    set({ isSendingMsg: true });

    const { chatId, replyTo, content, image } = payload;
    const { user } = useAuth.getState();

    // If no chatId or no logged-in user, skip
    if (!chatId || !user?._id) return;

    /**
     * Create a temporary message object
     * This makes the UI feel instant, without waiting for API
     */
    const tempId = generateUUID();
    const tempMessage = {
      _id: tempId,
      chatId,
      content: content || "",
      image: image || null,
      sender: user,
      replyTo: replyTo || null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: "sending...", // Helps UI show loading bubble
    };

    // Push temporary message to UI if user is inside this chat
    set((state) => {
      if (state.singleChat?.chat?._id !== chatId) return state;
      return {
        singleChat: {
          ...state.singleChat,
          messages: [...state.singleChat.messages, tempMessage],
        },
      };
    });

    try {
      /**
       * Send message to backend
       * Backend returns the REAL message with database ID + timestamps
       */
      const { data } = await API.post("/messages", {
        chatId,
        content,
        image,
        replyToId: replyTo?._id,
      });

      const { userMessage } = data;

      /**
       * Replace temporary message with the real message
       */
      set((state) => {
        if (!state.singleChat) return state;

        return {
          singleChat: {
            ...state.singleChat,
            messages: state.singleChat.messages.map((msg) =>
              msg._id === tempId ? userMessage : msg
            ),
          },
        };
      });
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to send message");
    } finally {
      set({ isSendingMsg: false });
    }
  },

  /**
   * Add or move a chat to the top of the chat list.
   * Used when:
   * - A new chat is created
   * - A chat already exists → move it to top
   */
  addNewChat: (newChat: ChatType) => {
    set((state) => {
      const exists = state.chats.find((c) => c._id === newChat._id);

      // Chat exists → move it to the top
      if (exists) {
        return {
          chats: [newChat, ...state.chats.filter((c) => c._id !== newChat._id)],
        };
      }

      // Chat is new → add to the top
      return { chats: [newChat, ...state.chats] };
    });
  },

  /**
   * Update a chat’s last message (used for side chat list)
   * and move that chat to top.
   */
  updateChatLastMessage: (chatId, lastMessage) => {
    set((state) => {
      const targetChat = state.chats.find((c) => c._id === chatId);

      if (!targetChat) return state;

      /**
       * Create a new chat list
       * - Put the updated chat at the top
       * - Keep all other chats below in their previous order
       */
      return {
        chats: [
          { ...targetChat, lastMessage },
          ...state.chats.filter((c) => c._id !== chatId),
        ],
      };
    });
  },

  /**
   * Add a new message to currently opened chat screen.
   * Used for real-time WebSocket message receive.
   */
  addNewMessage: (chatId, message) => {
    const openedChat = get().singleChat;

    // Only add if the user is inside the same chat
    if (openedChat?.chat._id === chatId) {
      set({
        singleChat: {
          chat: openedChat.chat,
          messages: [...openedChat.messages, message],
        },
      });
    }
  },

  /**
   * Delete a chat (only by the creator)
   * Removes from database and clears from local state
   */
  deleteChat: async (chatId: string) => {
    try {
      await API.delete(`/chats/${chatId}`);

      set((state) => ({
        chats: state.chats.filter((c) => c._id !== chatId),
        // Clear singleChat if it's the one being deleted
        singleChat: state.singleChat?.chat._id === chatId ? null : state.singleChat,
      }));

      toast.success("Chat deleted successfully");
      return true;
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to delete chat");
      return false;
    }
  },

  /**
   * Remove a message from local state (for unsend/delete functionality)
   * Marks the message as deleted rather than removing it completely
   */
  removeMessage: (chatId: string, messageId: string) => {
    set((state) => {
      if (!state.singleChat || state.singleChat.chat._id !== chatId) {
        return state;
      }
      return {
        singleChat: {
          ...state.singleChat,
          // Mark message as deleted instead of removing it
          messages: state.singleChat.messages.map((msg) =>
            msg._id === messageId
              ? { ...msg, content: null, image: null, deletedAt: new Date().toISOString() }
              : msg
          ),
        },
      };
    });
  },
}));
