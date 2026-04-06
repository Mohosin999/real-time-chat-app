import Chat from "../../model/Chat";
import Message from "../../model/Message";
import User from "../../model/User";
import { badRequest } from "../../utils/error";
import { emitNewChatToParticpants, emitChatDeleted } from "../socket";

export const createChatService = async (
  userId: string,
  body: {
    participantId?: string;
    isGroup?: boolean;
    participants?: string[];
    groupName?: string;
  }
) => {
  const { participantId, isGroup, participants, groupName } = body;

  let chat;
  let allParticipantIds: string[] = [];

  // ------------------------------
  // HANDLE GROUP CHAT CREATION
  // ------------------------------
  if (isGroup && participants?.length && groupName) {
    // Add current user to the participants list
    allParticipantIds = [...participants, userId];

    // Create a new group chat
    chat = await Chat.create({
      participants: allParticipantIds,
      isGroup: true,
      groupName,
      createdBy: userId,
    });

    // ------------------------------
    // HANDLE ONE-TO-ONE CHAT CREATION
    // ------------------------------
  } else if (participantId) {
    // FIX NEEDED: Set both participant IDs for private chat
    allParticipantIds = [userId, participantId];

    // Check if a chat already exists between these exact two users
    const existingChat = await Chat.findOne({
      participants: {
        $all: allParticipantIds, // Must contain both users
        $size: 2, // Must be exactly 2 users (ensures private chat)
      },
    }).populate("participants", "name avatar");

    // If chat already exists, return it instead of creating a new one
    if (existingChat) return existingChat;

    // Create a new private chat
    chat = await Chat.create({
      participants: allParticipantIds,
      isGroup: false,
      createdBy: userId,
    });
  }

  // Implement websocket events
  const populatedChat = await chat?.populate("participants", "name avatar");
  const participantIdStrings = populatedChat?.participants.map((p) => {
    return p._id.toString();
  });

  emitNewChatToParticpants(participantIdStrings, populatedChat);

  return chat;
};

export const getUserChatsService = async (userId: string) => {
  // Fetch all chats where the given user is a participant.
  // `$in: [userId]` checks if the `participants` array contains the user.
  const chats = await Chat.find({
    participants: {
      $in: [userId],
    },
  })
    // Populate chat participants with only 'name' and 'avatar' fields
    .populate("participants", "name avatar")

    // Populate lastMessage details
    .populate({
      path: "lastMessage",
      populate: {
        path: "sender", // Populate the sender of the last message
        select: "name avatar", // Only include name and avatar of the sender
      },
    })

    // Sort chats by most recently updated (latest message appears first)
    .sort({ updatedAt: -1 });

  return chats;
};

export const getSingleChatService = async (chatId: string, userId: string) => {
  // Find the chat by ID but also ensure the requesting user is a participant.
  // This prevents unauthorized users from accessing other users' chats.
  const chat = await Chat.findOne({
    _id: chatId,
    participants: {
      $in: [userId],
    },
  }).populate("participants", "name avatar");

  // If the chat does not exist or the user is not a participant, throw an error
  if (!chat) throw badRequest("Chat not found");

  // Fetch all messages belonging to this chat
  const messages = await Message.find({ chatId })
    .populate("sender", "name avatar") // Populate sender details for each message
    .populate({
      path: "replyTo", // If a message is a reply to another message
      select: "content image sender", // Include basic fields of the replied message
      populate: {
        path: "sender", // Populate the sender of the replied message as well
        select: "name avatar",
      },
    })
    .sort({ createdAt: 1 }); // Sort messages from oldest to newest

  // Return chat information and its messages together
  return {
    chat,
    messages,
  };
};

export const validateChatParticipant = async (
  chatId: string,
  userId: string
) => {
  const chat = await Chat.findOne({
    _id: chatId,
    participants: {
      $in: [userId],
    },
  });

  if (!chat) throw badRequest("User not a participant in chat");
  return chat;
};

export const deleteChatService = async (chatId: string, userId: string) => {
  const chat = await Chat.findOne({
    _id: chatId,
    createdBy: userId,
  });

  if (!chat) throw badRequest("You are not authorized to delete this chat");

  // Get participants before deleting to emit event
  const participantIds = chat.participants.map((id) => id.toString());

  await Message.deleteMany({ chatId });
  await Chat.findByIdAndDelete(chatId);

  // Emit chat deletion event to all participants
  emitChatDeleted(participantIds, chatId);

  return { success: true };
};
