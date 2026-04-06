import mongoose from "mongoose";
import Chat from "../../model/Chat";
import Message from "../../model/Message";
import { badRequest, notFound } from "../../utils/error";
import cloudinary from "../../config/cloudinary";
import { emitLastMessageToParticipants, emitNewMessageToChatRoom, emitMessageDeleted } from "../socket";

export const sendMessageService = async (
  userId: string,
  body: {
    chatId?: string;
    content?: string;
    image?: string;
    replyToId?: string;
  }
) => {
  const { chatId, content, image, replyToId } = body;

  const chat = await Chat.findOne({
    _id: chatId,
    participants: {
      $in: [userId],
    },
  });

  if (!chat) throw badRequest("Chat not found or unauthorized");

  if (replyToId) {
    const replyMessage = await Message.findOne({
      _id: replyToId,
      chatId,
    });
    if (!replyMessage) throw notFound("Reply message not found");
  }

  let imageUrl;

  if (image) {
    // Upload the image to cloudinary
    const uploadRes = await cloudinary.uploader.upload(image);
    imageUrl = uploadRes.secure_url;
  }

  const newMessage = await Message.create({
    chatId,
    sender: userId,
    content,
    image: imageUrl,
    replyTo: replyToId || null,
  });

  await newMessage.populate([
    { path: "sender", select: "name avatar" },
    {
      path: "replyTo",
      select: "content image sender",
      populate: {
        path: "sender",
        select: "name avatar",
      },
    },
  ]);

    chat.lastMessage = newMessage._id as mongoose.Types.ObjectId;
    await chat.save();

    //websocket emit the new Message to the chat room
    emitNewMessageToChatRoom(userId, chatId, newMessage);

    //websocket emit the lastmessage to members (personnal room user)
    const allParticipantIds = chat.participants.map((id) => id.toString());
    emitLastMessageToParticipants(allParticipantIds, chatId, newMessage);

  return {
    userMessage: newMessage,
    chat,
  };
};

export const deleteMessageService = async (messageId: string, userId: string) => {
  const message = await Message.findOne({
    _id: messageId,
    sender: userId,
  });

  if (!message) throw badRequest("Message not found or unauthorized to delete");

  // Store image URL before nulling it out (for Cloudinary deletion)
  const imageUrl = message.image;
  
  // Soft delete the message (null content/image, set deletedAt)
  message.content = null;
  message.image = null;
  message.deletedAt = new Date();
  await message.save();

  // Delete image from Cloudinary if it existed
  if (imageUrl) {
    const publicId = imageUrl.split("/").pop()?.split(".")[0];
    if (publicId) {
      await cloudinary.uploader.destroy(publicId);
    }
  }

  // Get chat to update lastMessage
  const chat = await Chat.findById(message.chatId);
  
  if (chat && chat.lastMessage?.toString() === messageId) {
    const lastMsg = await Message.findOne({
      chatId: message.chatId,
      _id: { $ne: messageId },
      deletedAt: null,
    }).sort({ createdAt: -1 });

    chat.lastMessage = (lastMsg?._id as mongoose.Types.ObjectId) || null;
    await chat.save();

    if (lastMsg) {
      const allParticipantIds = chat.participants.map((id) => id.toString());
      emitLastMessageToParticipants(allParticipantIds, message.chatId.toString(), lastMsg);
    }
  }

  // Emit message deletion to all chat participants for real-time sync
  if (chat) {
    const allParticipantIds = chat.participants.map((id) => id.toString());
    emitMessageDeleted(allParticipantIds, message.chatId.toString(), messageId);
  }

  return { success: true };
};
