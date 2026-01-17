import "dotenv/config";
import express from "express";
import type { Application } from "express";
import { startSendOtpConsumer } from "./rabbitMQ/rabbitMQ.consumer.js";

const app: Application = express();
const port: number = Number(process.env["PORT"] || 5001);

const init = async (): Promise<void> => {
  await startSendOtpConsumer();
  app.listen(port, (): void => console.log("Server started"));
};

init();
