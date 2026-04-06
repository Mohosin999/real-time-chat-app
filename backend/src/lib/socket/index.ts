import { Server as HTTPServer } from "http";
import jwt from "jsonwebtoken";
import { Server, type Socket } from "socket.io";
import { validateChatParticipant } from "../chat";

interface AuthenticatedSocket extends Socket {
  userId?: string;
}

let io: Server | null = null;

const onlineUsers = new Map<string, string>();

export const initializeSocket = (httpServer: HTTPServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: process.env.FRONTEND_ORIGIN,
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

  io.use(async (socket: AuthenticatedSocket, next) => {
    try {
      let token = socket.handshake.auth.token;

      if (!token) {
        const cookieHeader = socket.handshake.headers.cookie;
        if (cookieHeader) {
          const cookies = cookieHeader.split(";").map((c) => c.trim());
          for (const cookie of cookies) {
            const [key, ...valueParts] = cookie.split("=");
            if (key === "accessToken") {
              token = valueParts.join("=");
              break;
            }
          }
        }
      }

      console.log("[Socket Auth] Token received:", token ? "yes" : "no");

      if (!token) return next(new Error("Unauthorized"));

      const decodedToken = jwt.verify(token, process.env.JWT_SECRET!, {
        algorithms: ["HS256"],
        audience: ["user"],
      }) as {
        userId: string;
      };
      if (!decodedToken) return next(new Error("Unauthorized"));

      socket.userId = decodedToken.userId;
      next();
    } catch (error) {
      console.log("[Socket Auth] Error:", error);
      next(new Error("Internal server error"));
    }
  });

  io.on("connection", (socket: AuthenticatedSocket) => {
    const userId = socket.userId!;
    const newSocketId = socket.id;

    if (!socket.userId) {
      socket.disconnect();
      return;
    }

    // Register socket for the user
    onlineUsers.set(userId, newSocketId);

    // BroadCast online users to all socket
    io?.emit("online:users", Array.from(onlineUsers.keys()));

    // Create personnal room for user
    socket.join(`user:${userId}`);

    socket.on(
      "chat:join",
      async (chatId: string, callback?: (err?: string) => void) => {
        try {
          await validateChatParticipant(chatId, userId);
          socket.join(`chat:${chatId}`);

          callback?.();
        } catch (error) {
          callback?.("Error joining chat");
        }
      }
    );

    socket.on("chat:leave", (chatId: string) => {
      if (chatId) {
        socket.leave(`chat:${chatId}`);
      }
    });

    socket.on("typing", (chatId: string) => {
      socket.join(`chat:${chatId}`);
      io?.to(`chat:${chatId}`).emit("typing", {
        chatId,
        userId,
      });
    });

    socket.on("stopTyping", (chatId: string) => {
      io?.to(`chat:${chatId}`).emit("stopTyping", {
        chatId,
        userId,
      });
    });

    socket.on("disconnect", () => {
      if (onlineUsers.get(userId) === newSocketId) {
        if (userId) onlineUsers.delete(userId);

        io?.emit("online:users", Array.from(onlineUsers.keys()));
      }
    });
  });
};

function getIO() {
  if (!io) {
    throw new Error("Socket.io not initialized");
  }
  return io;
}

export const emitNewChatToParticpants = (
  participantIds: string[] = [],
  chat: any
) => {
  const io = getIO();
  for (const participantId of participantIds) {
    io.to(`user:${participantId}`).emit("chat:new", chat);
  }
};

export const emitNewMessageToChatRoom = (
  senderId: string, //userId that sent the message
  chatId: string,
  message: any
) => {
  const io = getIO();
  const senderSocketId = onlineUsers.get(senderId?.toString());

  if (senderSocketId) {
    io.to(`chat:${chatId}`).except(senderSocketId).emit("message:new", message);
  } else {
    io.to(`chat:${chatId}`).emit("message:new", message);
  }
};

export const emitLastMessageToParticipants = (
  participantIds: string[],
  chatId: string,
  lastMessage: any
) => {
  const io = getIO();
  const payload = { chatId, lastMessage };

  for (const participantId of participantIds) {
    io.to(`user:${participantId}`).emit("chat:update", payload);
  }
};

export const emitMessageDeleted = (
  participantIds: string[],
  chatId: string,
  messageId: string
) => {
  const io = getIO();
  const payload = { chatId, messageId };

  for (const participantId of participantIds) {
    io.to(`user:${participantId}`).emit("message:deleted", payload);
  }
};

export const emitChatDeleted = (
  participantIds: string[],
  chatId: string
) => {
  const io = getIO();
  const payload = { chatId };

  for (const participantId of participantIds) {
    io.to(`user:${participantId}`).emit("chat:deleted", payload);
  }
};
