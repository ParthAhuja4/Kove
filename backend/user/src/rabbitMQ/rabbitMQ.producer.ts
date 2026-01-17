import amqp from "amqplib";
import type { Message } from "@/controllers/user.controller.js";

let channel: amqp.Channel;

export const connectRabbitMQ = async (): Promise<void> => {
  const connection = await amqp.connect({
    protocol: "amqp",
    hostname: "localhost",
    port: 5672,
    username: process.env["RABBITMQ_USERNAME"],
    password: process.env["RABBITMQ_PSWRD"],
  });

  channel = await connection.createChannel();

  await channel.assertQueue("send-otp", { durable: true });

  console.log("RABBITMQ CONNECTED");
};

export const publishToQueue = async (
  queueName: string,
  msg: Message
): Promise<void> => {
  if (!channel) throw new Error("RabbitMQ not connected");

  channel.sendToQueue(queueName, Buffer.from(JSON.stringify(msg)), {
    persistent: true,
  });
};
