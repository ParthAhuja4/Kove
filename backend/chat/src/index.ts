import "dotenv/config";
import express, { urlencoded } from "express";
import type { Application } from "express";
import cors from "cors";
import http from "http";
import connectDB from "./config/db.js";
import chatRouter from "./routes/chat.route.js";
import { initSocketServer } from "./socket.js";

const app: Application = express();
const port: number = Number(process.env["PORT"] || 5002);
const httpServer = http.createServer(app);
export const io = initSocketServer(httpServer);

const init = async (): Promise<void> => {
  await connectDB();

  httpServer.listen(port, (): void => console.log("Server started"));
  app.use(urlencoded());
  app.use(express.json());
  app.use(cors());
  app.use("/api/v1/chat", chatRouter);
};

init();
