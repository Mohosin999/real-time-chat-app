import mongoose from "mongoose";
import Chat from "../../model/Chat";
import Message from "../../model/Message";
import { badRequest, notFound } from "../../utils/error";
import cloudinary from "../../config/cloudinary";
import { emitLastMessageToParticipants, emitNewMessageToChatRoom } from "../socket";

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
