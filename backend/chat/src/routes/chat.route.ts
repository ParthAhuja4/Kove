import upload from "@/config/multer.js";
import {
  createNewChat,
  getAllChats,
  getMessageByChat,
  sendMessage,
} from "@/controllers/chat.controller.js";
import authUser from "@/middlewares/auth.middleware.js";
import { Router } from "express";

const chatRouter: Router = Router();

chatRouter.post("/new", authUser, createNewChat);
chatRouter.post("/all", authUser, getAllChats);
chatRouter.get("/message/:chatId", authUser, getMessageByChat);
chatRouter.post("/send-message", authUser, upload.single("image"), sendMessage);

export default chatRouter;
