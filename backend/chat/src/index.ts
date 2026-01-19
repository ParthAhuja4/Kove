import "dotenv/config";
import express, { urlencoded } from "express";
import type { Application } from "express";
import cors from "cors";
import connectDB from "./config/db.js";
import chatRouter from "./routes/chat.route.js";

const app: Application = express();
const port: number = Number(process.env["PORT"] || 5002);

const init = async (): Promise<void> => {
  await connectDB();

  app.listen(port, (): void => console.log("Server started"));
  app.use(urlencoded());
  app.use(express.json());
  app.use(cors());
  app.use("/api/v1/chat", chatRouter);
};

init();
