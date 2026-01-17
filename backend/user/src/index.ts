import "dotenv/config";
import express from "express";
import type { Application } from "express";
import connectDB from "./config/db.js";
import connectRedis from "./config/redis.js";
import { connectRabbitMQ } from "./rabbitMQ/rabbitMQ.producer.js";
import cors from "cors";

import userRouter from "./routes/user.route.js";

const app: Application = express();
const port: number = Number(process.env["PORT"] || 5000);

const init = async (): Promise<void> => {
  await connectDB();
  await connectRedis();
  await connectRabbitMQ();

  app.listen(port, (): void => console.log("Server started"));

  app.use(express.json());
  app.use(cors());
  app.use("/api/v1/user", userRouter);
};

init();
