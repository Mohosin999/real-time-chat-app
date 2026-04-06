import mongoose, { Document, model, Schema } from "mongoose";

export interface MessageDocument extends Document {
  chatId: mongoose.Types.ObjectId;
  sender: mongoose.Types.ObjectId;
  content?: string;
  image?: string;
  replyTo?: mongoose.Types.ObjectId;
  deletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const messageSchema = new Schema<MessageDocument>(
  {
    chatId: {
      type: Schema.Types.ObjectId,
      ref: "Chat",
      required: true,
    },
    content: { type: String },
    image: { type: String },
    sender: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    replyTo: {
      type: Schema.Types.ObjectId,
      ref: "Message",
      default: null,
    },
    deletedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

const Message = model<MessageDocument>("Message", messageSchema);

export default Message;
