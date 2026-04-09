import { memo, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";
import type { MessageType } from "@/types/chat";
import AvatarWithBadge from "../avatar-with-badge";
import { formatChatTime } from "@/lib/helper";
import { Button } from "../ui/button";
import { ReplyIcon, Trash2, MoreHorizontal } from "lucide-react";
import { useChat } from "@/hooks/use-chat";
import { toast } from "sonner";
import { API } from "@/lib/axios-client";
import { useOutsideClick } from "@/hooks/use-outside-click";
import AlertDialogPopup from "../alert-dialog-popup";

interface Props {
  message: MessageType;
  onReply: (message: MessageType) => void;
  chatId: string | null;
}
const ChatMessageBody = memo(({ message, onReply, chatId }: Props) => {
  const { user } = useAuth();
  const { removeMessage } = useChat();

  const userId = user?._id || null;
  const isCurrentUser = message.sender?._id === userId;
  const senderName = isCurrentUser ? "You" : message.sender?.name;

  const replySendername =
    message.replyTo?.sender?._id === userId
      ? "You"
      : message.replyTo?.sender?.name;

  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const {
    ref: mobileMenuRef,
    isOpen: showMobileMenu,
    setIsOpen: setShowMobileMenu,
  } = useOutsideClick(false);

  const containerClass = cn(
    "group flex gap-2 py-3 px-4",
    isCurrentUser && "flex-row-reverse text-left",
  );

  const contentWrapperClass = cn(
    "max-w-[70%]  flex flex-col relative",
    isCurrentUser && "items-end",
  );

  const messageClass = cn(
    "min-w-[200px] px-3 py-2 text-sm break-words shadow-sm",
    isCurrentUser
      ? "bg-accent dark:bg-primary/40 rounded-tr-xl rounded-l-xl"
      : "bg-[#F5F5F5] dark:bg-accent rounded-bl-xl rounded-r-xl",
  );

  const replyBoxClass = cn(
    `mb-2 p-2 text-xs rounded-md border-l-4 shadow-md !text-left`,
    isCurrentUser
      ? "bg-primary/20 border-l-primary"
      : "bg-gray-200 dark:bg-secondary border-l-[#CC4A31]",
  );

  const handleDeleteMessage = async () => {
    if (!chatId) return;
    try {
      await API.delete(`/messages/${message._id}`);
      removeMessage(chatId, message._id);
      toast.success("Message deleted");
      setShowDeleteDialog(false);
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || "Failed to delete message");
    }
  };

  const isDeleted = message.deletedAt;

  return (
    <>
      <div className={containerClass}>
        {!isCurrentUser && (
          <div className="flex-shrink-0 flex items-start">
            <AvatarWithBadge
              name={message.sender?.name || "No name"}
              src={message.sender?.avatar || ""}
            />
          </div>
        )}

        <div className={contentWrapperClass}>
          <div
            className={cn(
              "flex items-center gap-1",
              isCurrentUser && "flex-row-reverse",
            )}
          >
            <div className={messageClass}>
              {!isDeleted ? (
                <>
                  <div className="flex items-center justify-between gap-2 mb-0.5 pb-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold">
                        {senderName}
                      </span>
                      <span className="text-[11px] text-gray-700 dark:text-gray-300">
                        {formatChatTime(message?.createdAt)}
                      </span>
                    </div>
                    {/* Mobile: three dots with dropdown */}
                    <div ref={mobileMenuRef} className="relative md:hidden">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setShowMobileMenu(!showMobileMenu)}
                        className="!size-6 p-0"
                      >
                        <MoreHorizontal size={14} className="!stroke-[1.9]" />
                      </Button>
                      {showMobileMenu && (
                        <div className="absolute right-0 top-full mt-1 w-40 bg-background border border-border rounded-md shadow-lg z-50 py-1">
                          <button
                            onClick={() => {
                              onReply(message);
                              setShowMobileMenu(false);
                            }}
                            className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-accent transition-colors"
                          >
                            <ReplyIcon
                              className={cn(
                                "w-4 h-4",
                                isCurrentUser && "scale-x-[-1]",
                              )}
                            />
                            <span>Reply</span>
                          </button>
                          {isCurrentUser && (
                            <button
                              onClick={() => {
                                setShowMobileMenu(false);
                                setShowDeleteDialog(true);
                              }}
                              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-destructive hover:bg-destructive/10 transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                              <span>Delete</span>
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {message.replyTo && (
                    <div className={replyBoxClass}>
                      <h5 className="font-medium">{replySendername}</h5>
                      <p
                        className="font-normal text-muted-foreground
                 max-w-[250px]  truncate
                "
                      >
                        {message?.replyTo?.content ||
                          (message?.replyTo?.image ? "📷 Photo" : "")}
                      </p>
                    </div>
                  )}

                  {message?.image && (
                    <img
                      src={message?.image || ""}
                      alt=""
                      className="rounded-lg w-full h-auto max-w-[280px] md:max-w-xs"
                    />
                  )}

                  {message.content && <p>{message.content}</p>}
                </>
              ) : (
                <p className="italic text-muted-foreground text-sm">
                  This message was deleted
                </p>
              )}
            </div>

            {!isDeleted && (
              <div className="flex items-center gap-1">
                {/* Desktop: hover to show reply button */}
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => onReply(message)}
                  className="hidden md:flex opacity-0 group-hover:opacity-100
              transition-opacity rounded-full !size-8 cursor-pointer
              "
                >
                  <ReplyIcon
                    size={16}
                    className={cn(
                      "text-gray-500 dark:text-white !stroke-[1.9]",
                      isCurrentUser && "scale-x-[-1]",
                    )}
                  />
                </Button>

                {/* Desktop: hover to show delete button */}
                {isCurrentUser && (
                  <Button
                    variant="outline"
                    size="icon"
                    className="hidden md:flex opacity-0 group-hover:opacity-100
                    transition-opacity rounded-full !size-8
                    text-destructive hover:text-destructive cursor-pointer
                    "
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowDeleteDialog(true);
                    }}
                  >
                    <Trash2 size={16} className="!stroke-[1.9]" />
                  </Button>
                )}
              </div>
            )}
          </div>

          {message.status && (
            <span
              className="block
           text-[10px] text-gray-400 mt-0.5"
            >
              {message.status}
            </span>
          )}
        </div>
      </div>

      {/* Delete Message Confirmation Dialog */}
      <AlertDialogPopup
        open={showDeleteDialog}
        setOpen={setShowDeleteDialog}
        onDelete={handleDeleteMessage}
        title="Delete Message"
        description="Are you sure you want to delete this message? This action cannot be undone."
      />
    </>
  );
});

ChatMessageBody.displayName = "ChatMessageBody";

export default ChatMessageBody;
