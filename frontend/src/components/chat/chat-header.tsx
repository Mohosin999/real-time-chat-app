import { getOtherUserAndGroup } from "@/lib/helper";
import type { ChatType } from "@/types/chat";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import AvatarWithBadge from "../avatar-with-badge";

interface Props {
  chat: ChatType;
  currentUserId: string | null;
  isTyping?: boolean;
  typingUsers?: string[];
}
const ChatHeader = ({
  chat,
  currentUserId,
  isTyping,
  typingUsers = [],
}: Props) => {
  const navigate = useNavigate();
  const { name, subheading, avatar, isOnline, isGroup } = getOtherUserAndGroup(
    chat,
    currentUserId,
  );

  // Get typing users names (for group chats)
  const getTypingText = () => {
    if (!isTyping) return null;

    if (isGroup && typingUsers.length > 0) {
      // For group chats, you'd need to map userIds to names
      // For now, show a generic message
      return typingUsers.length === 1
        ? "typing"
        : `${typingUsers.length} people are typing...`;
    }

    return "typing";
  };

  return (
    <div
      className="sticky top-0
    flex items-center gap-5 border-b border-border
    bg-card px-2 z-50
    "
    >
      <div className="h-14 px-4 flex items-center">
        <div>
          <ArrowLeft
            className="w-5 h-5 inline-block lg:hidden
          text-muted-foreground cursor-pointer
          mr-2
          "
            onClick={() => navigate("/")}
          />
        </div>
        <AvatarWithBadge
          name={name}
          src={avatar}
          isGroup={isGroup}
          isOnline={isOnline}
        />
        <div className="ml-2">
          <h5 className="font-semibold">{name}</h5>
          <p
            className={`text-sm ${
              isTyping
                ? "text-blue-500 dark:text-blue-400"
                : isOnline
                  ? "text-green-500"
                  : "text-muted-foreground"
            }`}
          >
            {isTyping ? (
              <span className="flex items-center gap-1">
                {getTypingText()}
                <span className="inline-flex gap-0.5 ml-0.5">
                  <span
                    className="w-1 h-1 bg-current rounded-full animate-bounce"
                    style={{ animationDelay: "0ms" }}
                  />
                  <span
                    className="w-1 h-1 bg-current rounded-full animate-bounce"
                    style={{ animationDelay: "150ms" }}
                  />
                  <span
                    className="w-1 h-1 bg-current rounded-full animate-bounce"
                    style={{ animationDelay: "300ms" }}
                  />
                </span>
              </span>
            ) : (
              subheading
            )}
          </p>
        </div>
      </div>
      <div>
        <div
          className={`flex-1
            text-center
            py-4 h-full
            border-b-2
            border-primary
            font-medium
            text-primary`}
        >
          Chat
        </div>
      </div>
    </div>
  );
};

export default ChatHeader;
