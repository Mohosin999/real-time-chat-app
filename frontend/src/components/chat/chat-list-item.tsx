import { getOtherUserAndGroup } from "@/lib/helper";
import { cn } from "@/lib/utils";
import type { ChatType } from "@/types/chat";
import { useLocation, useNavigate } from "react-router-dom";
import AvatarWithBadge from "../avatar-with-badge";
import { formatChatTime } from "../../lib/helper";
import { useChat } from "@/hooks/use-chat";
import { useAuth } from "@/hooks/use-auth";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Trash2, MoreVertical } from "lucide-react";
import { useState } from "react";

interface PropsType {
  chat: ChatType;
  currentUserId: string | null;
  onClick?: () => void;
}
const ChatListItem = ({ chat, currentUserId, onClick }: PropsType) => {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { deleteChat } = useChat();
  const { user } = useAuth();
  const { lastMessage, createdAt, createdBy } = chat;

  const { name, avatar, isOnline, isGroup } = getOtherUserAndGroup(
    chat,
    currentUserId
  );

  const [showMenu, setShowMenu] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const getLastMessageText = () => {
    if (!lastMessage) {
      return isGroup
        ? chat.createdBy === currentUserId
          ? "Group created"
          : "You were added"
        : "Send a message";
    }
    if (lastMessage.image) return "📷 Photo";
    if (lastMessage.deletedAt) return "This message was deleted";

    if (isGroup && lastMessage.sender) {
      return `${
        lastMessage.sender._id === currentUserId
          ? "You"
          : lastMessage.sender.name
      }: ${lastMessage.content}`;
    }

    return lastMessage.content;
  };

  const handleDelete = async () => {
    await deleteChat(chat._id);
    if (pathname.includes(chat._id)) {
      navigate("/chat");
    }
    setShowDeleteDialog(false);
    setShowMenu(false);
  };

  const isCreator = createdBy === user?._id;

  return (
    <>
      <button
        onClick={onClick}
        className={cn(
          `w-full flex items-center gap-2 p-2 rounded-sm
           hover:bg-sidebar-accent transition-colors text-left relative group`,
          pathname.includes(chat._id) && "!bg-sidebar-accent"
        )}
      >
        <AvatarWithBadge
          name={name}
          src={avatar}
          isGroup={isGroup}
          isOnline={isOnline}
        />

        <div className="flex-1 min-w-0">
          <div
            className="
           flex items-center justify-between mb-0.5
          "
          >
            <h5 className="text-sm font-semibold truncate">{name}</h5>
            <span
              className="text-xs
               ml-2 shrink-0 text-muted-foreground
              "
            >
              {formatChatTime(lastMessage?.updatedAt || createdAt)}
            </span>
          </div>
          <p className="text-xs truncate text-muted-foreground -mt-px">
            {getLastMessageText()}
          </p>
        </div>

        {isCreator && (
          <div className="relative">
            <button
              className="p-1.5 hover:bg-sidebar-accent rounded-md transition-colors opacity-0 group-hover:opacity-100"
              onClick={(e) => {
                e.stopPropagation();
                setShowMenu(!showMenu);
              }}
            >
              <MoreVertical className="w-4 h-4" />
            </button>

            {showMenu && (
              <div
                className="absolute right-0 top-full mt-1 w-48 bg-background border border-border rounded-md shadow-lg z-50"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-destructive hover:bg-destructive/10 transition-colors rounded-md"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowMenu(false);
                    setShowDeleteDialog(true);
                  }}
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Delete Chat</span>
                </button>
              </div>
            )}
          </div>
        )}
      </button>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Chat</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this chat? This action cannot be
              undone and all messages will be permanently deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default ChatListItem;
