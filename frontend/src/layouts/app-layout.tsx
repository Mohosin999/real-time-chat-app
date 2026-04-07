import AppWrapper from "@/components/app-wrapper";
import ChatList from "@/components/chat/chat-list";
import useChatId from "@/hooks/use-chat-id";
import { cn } from "@/lib/utils";
import { Outlet } from "react-router-dom";

const AppLayout = () => {
  const chatId = useChatId();

  return (
    <AppWrapper>
      <div className="h-screen flex overflow-hidden">
        {/* ================= LEFT SIDE (Chat List) ================= */}
        <div
          className={cn(
            "h-full flex-shrink-0",
            // Mobile behavior
            chatId ? "hidden lg:block" : "block",
            // Desktop fixed width
            // "lg:w-[420px]",
            chatId ? "w-[420px]" : "lg:w-[380px]",
            // "border-r border-border bg-sidebar",
          )}
        >
          <ChatList />
        </div>

        {/* ================= RIGHT SIDE (Chat Area) ================= */}
        <div
          className={cn(
            "flex-1 h-full flex flex-col min-w-0",
            // Mobile behavior
            chatId ? "block" : "hidden lg:flex",
          )}
        >
          <Outlet />
        </div>
      </div>
    </AppWrapper>
  );
};

export default AppLayout;
