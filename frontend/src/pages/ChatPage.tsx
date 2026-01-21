import { useEffect, useState, useRef } from "react";
import { useAuth } from "../hooks/useAuth";
import { createSocket } from "../services/socket";
import { Socket } from "socket.io-client";
import type { Chat, Message, User } from "../types";
import ChatList from "../components/ChatList";
import ChatWindow from "../components/ChatWindow";
import chatApi from "../services/chatApi";
import NewChatModal from "../components/NewChatModal";
import api from "../services/api";
import { Link } from "react-router-dom";
import { Button } from "../components/ui/button";
import {
  LogOut,
  User as UserIcon,
  MessageSquarePlus,
  ArrowLeft,
} from "lucide-react"; // Lucide icons

const ChatPage = () => {
  const { user, token, logout } = useAuth();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [chats, setChats] = useState<Chat[]>([]);
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
  const selectedChatRef = useRef<Chat | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true); // State to manage sidebar visibility

  useEffect(() => {
    selectedChatRef.current = selectedChat;
  }, [selectedChat]);

  useEffect(() => {
    if (token) {
      const newSocket = createSocket(token);
      setSocket(newSocket);

      return () => {
        newSocket.disconnect();
      };
    }
  }, [token]);

  useEffect(() => {
    const fetchChats = async () => {
      try {
        const { data } = await chatApi.get("/");
        setChats(data.data.chats);
      } catch (error) {
        console.error("Failed to fetch chats", error);
      }
    };
    fetchChats();
  }, [user]);

  useEffect(() => {
    if (socket) {
      const handleReceiveMessage = (message: Message) => {
        const currentChat = selectedChatRef.current;
        if (currentChat && message.chatId === currentChat._id) {
          setMessages((prevMessages) => {
            // Prevent adding duplicate messages if they already exist (e.g., due to server emitting twice)
            if (
              prevMessages.some(
                (existingMsg) => existingMsg._id === message._id,
              )
            ) {
              return prevMessages;
            }
            return [...prevMessages, message];
          });
        }
        // Update chat list with new message preview
        setChats((prevChats) =>
          prevChats.map((chat) =>
            chat._id === message.chatId
              ? {
                  ...chat,
                  latestMessage: { text: message.text, sender: message.sender },
                }
              : chat,
          ),
        );
      };

      const handleTyping = ({ chatId }: { chatId: string }) => {
        const currentChat = selectedChatRef.current;
        if (currentChat && chatId === currentChat._id) {
          setIsTyping(true);
        }
      };

      const handleStopTyping = ({ chatId }: { chatId: string }) => {
        const currentChat = selectedChatRef.current;
        if (currentChat && chatId === currentChat._id) {
          setIsTyping(false);
        }
      };

      socket.on("receive_message", handleReceiveMessage);
      socket.on("typing", handleTyping);
      socket.on("stop_typing", handleStopTyping);

      // Cleanup function to remove listeners
      return () => {
        socket.off("receive_message", handleReceiveMessage);
        socket.off("typing", handleTyping);
        socket.off("stop_typing", handleStopTyping);
      };
    }
  }, [socket]);

  const handleSelectChat = async (chat: Chat) => {
    setSelectedChat(chat);
    setIsTyping(false); // Reset typing state when changing chat
    try {
      const { data } = await chatApi.get(`/${chat._id}`);
      setMessages(data.data.messages);
      socket?.emit("join_room", chat._id);
      // On small screens, hide sidebar and show chat window
      if (window.innerWidth < 768) {
        // Assuming md breakpoint is 768px
        setIsSidebarOpen(false);
      }
    } catch (error) {
      console.error("Failed to fetch messages", error);
    }
  };

  const handleSendMessage = async (payload: { text?: string; file?: File }) => {
    if (socket && selectedChat) {
      try {
        const formData = new FormData();
        formData.append("chatId", selectedChat._id);
        if (payload.text) {
          formData.append("text", payload.text);
        }
        if (payload.file) {
          formData.append("image", payload.file); // "image" is the field name the backend expects
        }

        await chatApi.post("/send", formData, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        });
      } catch (error) {
        console.error("Failed to send message", error);
      }
    }
  };

  const handleTyping = () => {
    if (socket && selectedChat) {
      socket.emit("typing", { chatId: selectedChat._id });
    }
  };

  const handleStopTyping = () => {
    if (socket && selectedChat) {
      socket.emit("stop_typing", { chatId: selectedChat._id });
    }
  };

  const handleOpenModal = async () => {
    try {
      // Reset state when modal opens
      setAllUsers([]);
      setNextCursor(null);
      const { data } = await api.post("/users");
      setAllUsers(data.data.users);
      setNextCursor(data.data.pagination.nextCursor);
      setIsModalOpen(true);
    } catch (error) {
      console.error("Failed to fetch users", error);
    }
  };

  const handleLoadMoreUsers = async () => {
    if (!nextCursor) return;
    try {
      const { data } = await api.get(`/users?nextCursor=${nextCursor}`);
      setAllUsers((prevUsers) => [...prevUsers, ...data.data.users]);
      setNextCursor(data.data.pagination.nextCursor);
    } catch (error) {
      console.error("Failed to fetch more users", error);
    }
  };

  const handleCreateNewChat = async (selectedUser: User) => {
    try {
      await chatApi.post("/new", { otherUserId: selectedUser._id });
      handleCloseModal();
      // Refresh chat list
      const { data } = await chatApi.get("/");
      setChats(data.data.chats);
    } catch (error) {
      console.error("Failed to create new chat", error);
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setAllUsers([]);
    setNextCursor(null);
  };

  const handleBackToChatList = () => {
    setSelectedChat(null);
    setIsSidebarOpen(true);
  };

  return (
    <div className="flex h-screen bg-background text-foreground">
      {/* Left Sidebar - Chat List (visible on small screens when no chat selected, or always on md and larger) */}
      <aside
        className={`flex-col border-r bg-card shadow-lg ${
          isSidebarOpen
            ? "flex w-full md:w-1/4 lg:w-1/5"
            : "hidden md:flex md:w-1/4 lg:w-1/5"
        }`}
      >
        <div className="flex items-center justify-between p-4 border-b border-border bg-primary text-primary-foreground">
          <h1 className="text-3xl font-extrabold">Kove</h1>
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="icon"
              asChild
              className="hover:bg-primary-foreground/20 text-primary-foreground"
            >
              <Link to="/profile">
                <UserIcon className="h-5 w-5" />
              </Link>
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleOpenModal}
              className="hover:bg-primary-foreground/20 text-primary-foreground"
            >
              <MessageSquarePlus className="h-5 w-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={logout}
              className="hover:bg-primary-foreground/20 text-primary-foreground"
            >
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto bg-muted/20">
          <ChatList
            chats={chats}
            onSelectChat={handleSelectChat}
            selectedChat={selectedChat}
          />
        </div>
      </aside>

      {/* Right Content - Chat Window (visible on small screens when chat selected, or always on md and larger) */}
      <main
        className={`flex-1 flex-col ${
          selectedChat && !isSidebarOpen ? "flex" : "hidden md:flex"
        }`}
      >
        {selectedChat ? (
          <>
            {/* Header for Chat Window with back button on small screens */}
            <div className="flex items-center p-4 border-b bg-card md:hidden">
              <Button
                variant="ghost"
                size="icon"
                onClick={handleBackToChatList}
                className="mr-2"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <h2 className="text-lg font-semibold">
                {selectedChat.user.name}
              </h2>
            </div>
            <ChatWindow
              chat={selectedChat}
              messages={messages}
              onSendMessage={handleSendMessage}
              user={user}
              isTyping={isTyping}
              onTyping={handleTyping}
              onStopTyping={handleStopTyping}
            />
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center bg-background p-4">
            <MessageSquarePlus className="h-20 w-20 text-primary mb-4 animate-bounce" />
            <p className="text-xl text-muted-foreground font-semibold">
              Select a chat to start messaging
            </p>
            <p className="text-muted-foreground mt-2">
              Or click the{" "}
              <MessageSquarePlus className="inline-block h-4 w-4" /> icon to
              start a new one!
            </p>
          </div>
        )}
      </main>

      {isModalOpen && (
        <NewChatModal
          users={allUsers.filter((u) => u._id !== user?._id)}
          onSelectUser={handleCreateNewChat}
          onClose={handleCloseModal}
          onLoadMore={handleLoadMoreUsers}
          hasMore={!!nextCursor}
        />
      )}
    </div>
  );
};

export default ChatPage;
