import { Server, Socket } from "socket.io";
import { Server as HttpServer } from "http";
import { User } from "./controllers/chat.controller.js";

interface SocketWithUser extends Socket {
  user?: User;
}

export const initSocketServer = (server: HttpServer) => {
  const io = new Server(server, {
    cors: {
      origin: "http://localhost:5173", // Frontend URL
      methods: ["GET", "POST"],
    },
  });

  io.use((socket, next) => {
    const token = socket.handshake.auth["token"];
    if (!token) {
      return next(new Error("Authentication error"));
    }
    next();
  });

  io.on("connection", (socket: SocketWithUser) => {
    console.log("A user connected:", socket.id);

    socket.on("join_room", (chatId) => {
      socket.join(chatId);
      console.log(`User ${socket.id} joined room ${chatId}`);
    });

    socket.on("leave_room", (chatId) => {
      socket.leave(chatId);
      console.log(`User ${socket.id} left room ${chatId}`);
    });

    socket.on("typing", ({ chatId }) => {
      socket.to(chatId).emit("typing", { chatId });
    });

    socket.on("stop_typing", ({ chatId }) => {
      socket.to(chatId).emit("stop_typing", { chatId });
    });

    socket.on("disconnect", () => {
      console.log("User disconnected:", socket.id);
    });
  });

  return io;
};
