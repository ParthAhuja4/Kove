import { useState, useRef, useEffect } from "react";
import type { Chat, Message, User } from "../types/index";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { cn } from "../lib/utils";
import { Send, User as UserIcon, Paperclip } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface ChatWindowProps {
  chat: Chat;
  messages: Message[];
  onSendMessage: (payload: { text?: string; file?: File }) => void;
  user: User | null;
  isTyping: boolean;
  onTyping: () => void;
  onStopTyping: () => void;
}

const ChatWindow = ({
  chat,
  messages,
  onSendMessage,
  user,
  isTyping,
  onTyping,
  onStopTyping,
}: ChatWindowProps) => {
  const [text, setText] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = () => {
    if (text.trim() || selectedFile) {
      onSendMessage({ text: text.trim(), file: selectedFile || undefined });
      setText("");
      setSelectedFile(null);
      onStopTyping();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setText(e.target.value);
    onTyping();

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      onStopTyping();
    }, 1000); // 1 second delay
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleFileButtonClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="flex flex-col h-full bg-background">
      <div className="flex items-center p-4 border-b bg-card">
        <Avatar className="h-9 w-9 mr-3">
          <AvatarImage src="" alt="@shadcn" />
          <AvatarFallback>
            <UserIcon className="h-5 w-5" />
          </AvatarFallback>
        </Avatar>
        <h2 className="text-lg font-semibold">{chat.user.name}</h2>
      </div>
      <div className="flex-1 p-4 overflow-y-auto custom-scrollbar">
        {messages.map((msg) => (
          <div
            key={msg._id}
            className={cn(
              "flex mb-4",
              msg.sender === user?._id ? "justify-end" : "justify-start",
            )}
          >
            <div
              className={cn(
                "rounded-lg px-4 py-2 max-w-[70%]",
                msg.sender === user?._id
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground",
              )}
            >
              {msg.messageType === "text" && <p>{msg.text}</p>}
              {msg.messageType === "image" && msg.image?.url && (
                <img
                  src={msg.image.url}
                  alt="message image"
                  className="max-w-xs rounded-lg"
                />
              )}
              {/* Optional: Add timestamp or sender name */}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      <div className="p-4 border-t bg-card">
        {isTyping && (
          <p className="text-sm text-muted-foreground italic mb-2">
            {chat.user.name} is typing...
          </p>
        )}
        {selectedFile && (
          <div className="flex items-center mb-2 p-2 border rounded-md bg-muted">
            <Paperclip className="h-4 w-4 mr-2" />
            <span className="text-sm">{selectedFile.name}</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedFile(null)}
              className="ml-auto"
            >
              x
            </Button>
          </div>
        )}
        <div className="flex">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            className="hidden"
            accept="image/*"
          />
          <Button
            variant="ghost"
            size="icon"
            onClick={handleFileButtonClick}
            className="mr-2"
          >
            <Paperclip className="h-5 w-5" />
          </Button>
          <Input
            value={text}
            onChange={handleInputChange}
            onBlur={onStopTyping}
            onKeyPress={(e) => e.key === "Enter" && handleSend()}
            placeholder="Type a message..."
            className="flex-1 resize-none"
            disabled={!!selectedFile} // Disable text input if file is selected
          />
          <Button onClick={handleSend} className="ml-2 px-4 py-2">
            <Send className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ChatWindow;
