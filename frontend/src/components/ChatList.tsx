import type { Chat } from "../types/index";
import { cn } from "../lib/utils";
import { Link } from "react-router-dom";
import { Input } from "./ui/input";
import { useState } from "react";
import { Search, User as UserIcon } from "lucide-react"; // Importing Lucide icons

interface ChatListProps {
  chats: Chat[];
  selectedChat: Chat | null;
  onSelectChat: (chat: Chat) => void;
}

const ChatList = ({ chats, selectedChat, onSelectChat }: ChatListProps) => {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredChats = chats.filter((chat) =>
    chat.user.name.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  return (
    <div className="flex flex-col h-full bg-card">
      <div className="p-4 border-b">
        <div className="relative">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search chats"
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>
      <div className="flex-1 overflow-y-auto">
        {filteredChats.length === 0 ? (
          <p className="p-4 text-center text-muted-foreground">
            No chats found.
          </p>
        ) : (
          filteredChats.map((chat) => (
            <div
              key={chat._id}
              className={cn(
                "flex items-center gap-3 p-4 border-b border-border hover:bg-accent hover:text-accent-foreground cursor-pointer transition-colors duration-200",
                selectedChat?._id === chat._id && "bg-muted text-foreground",
              )}
              onClick={() => onSelectChat(chat)}
            >
              <UserIcon className="h-6 w-6 text-muted-foreground" />{" "}
              {/* Placeholder for user avatar */}
              <div className="flex-1">
                <div className="flex justify-between items-center">
                  <Link
                    to={`/user/${chat.user._id}`}
                    onClick={(e) => e.stopPropagation()}
                    className="font-semibold text-foreground hover:underline"
                  >
                    {chat.user.name}
                  </Link>
                  {chat.unseenCount > 0 && (
                    <span className="ml-auto flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">
                      {chat.unseenCount}
                    </span>
                  )}
                </div>
                <p className="text-sm text-muted-foreground truncate">
                  {chat.latestMessage?.text || "No messages yet"}
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ChatList;
