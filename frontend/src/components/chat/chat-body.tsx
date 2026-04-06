import { useChat } from "@/hooks/use-chat";
import { useSocket } from "@/hooks/use-socket";
import type { MessageType } from "@/types/chat";
import { useEffect, useRef } from "react";
import ChatBodyMessage from "./chat-body-message";

interface Props {
  chatId: string | null;
  messages: MessageType[];
  onReply: (message: MessageType) => void;
}
const ChatBody = ({ chatId, messages, onReply }: Props) => {
  const { socket } = useSocket();
  const { addNewMessage, removeMessage } = useChat();
  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!chatId) return;
    if (!socket) return;

    const handleNewMessage = (msg: MessageType) => addNewMessage(chatId, msg);
    const handleMessageDeleted = ({ messageId }: { chatId: string; messageId: string }) => {
      removeMessage(chatId, messageId);
    };

    socket.on("message:new", handleNewMessage);
    socket.on("message:deleted", handleMessageDeleted);
    
    return () => {
      socket.off("message:new", handleNewMessage);
      socket.off("message:deleted", handleMessageDeleted);
    };
  }, [socket, chatId, addNewMessage, removeMessage]);

  useEffect(() => {
    if (!messages.length) return;
    bottomRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [messages]);

  return (
    <div className="w-full max-w-6xl mx-auto flex flex-col px-3 py-2">
      {messages.map((message) => (
        <ChatBodyMessage
          key={message._id}
          message={message}
          onReply={onReply}
          chatId={chatId}
        />
      ))}

      <div ref={bottomRef} />
    </div>
  );
};

export default ChatBody;
