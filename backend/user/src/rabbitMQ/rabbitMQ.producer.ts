import amqp from "amqplib";
import type { Message } from "@/controllers/user.controller.js";

let channel: amqp.Channel;

export const connectRabbitMQ = async (): Promise<void> => {
  const connectWithRetry = async (retries = 5): Promise<amqp.ChannelModel> => {
    for (let i = 0; i < retries; i++) {
      try {
        return await amqp.connect(process.env["RABBITMQ_URL"]!);
      } catch (err) {
        console.error(
          `RabbitMQ connection attempt ${i + 1} failed, retrying...`,
        );
        await new Promise((res) => setTimeout(res, 3000));
      }
    }
    throw new Error("Could not connect to RabbitMQ after retries");
  };

  const connection: amqp.ChannelModel = await connectWithRetry();

  channel = await connection.createChannel();
  await channel.assertQueue("send-otp", { durable: true });

  console.log("RABBITMQ CONNECTED");
};

export const publishToQueue = async (
  queueName: string,
  msg: Message,
): Promise<void> => {
  if (!channel) throw new Error("RabbitMQ not connected");

  channel.sendToQueue(queueName, Buffer.from(JSON.stringify(msg)), {
    persistent: true,
  });
};
