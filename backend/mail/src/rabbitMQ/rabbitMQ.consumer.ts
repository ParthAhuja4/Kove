import amqp from "amqplib";
import nodemailer from "nodemailer";
import provideHTML from "@/utils/template.js";

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
  auth: {
    user: process.env["GMAIL_USER"],
    pass: process.env["GMAIL_PASS"],
  },
});

export const startSendOtpConsumer = async (): Promise<void> => {
  const connectWithRetry = async (retries = 5): Promise<amqp.ChannelModel> => {
    for (let i = 0; i < retries; i++) {
      try {
        return await amqp.connect(process.env["RABBITMQ_URL"]!);
      } catch (err) {
        console.error(
          `RabbitMQ consumer connection attempt ${i + 1} failed, retrying...`,
        );
        await new Promise((res) => setTimeout(res, 3000));
      }
    }
    throw new Error("Consumer could not connect to RabbitMQ after retries");
  };

  const connection: amqp.ChannelModel = await connectWithRetry();
  const channel = await connection.createChannel();

  await channel.assertQueue("send-otp", { durable: true });
  channel.prefetch(2);

  console.log("RABBITMQ CONSUMER STARTED");

  channel.consume("send-otp", async (msg) => {
    if (!msg) return;

    const headers = msg.properties.headers || {};
    const retryCount = headers["x-retries"] ?? 0;
    const MAX_RETRIES = 1;

    try {
      const { to, subject, otp } = JSON.parse(msg.content.toString());
      const body: string = provideHTML(otp);

      await transporter.sendMail({
        from: `"Kove" <${process.env["GMAIL_USER"]}>`,
        to,
        subject,
        html: body,
      });

      channel.ack(msg);
    } catch (err) {
      console.error(`OTP send failed (retry ${retryCount})`, err);

      if (retryCount >= MAX_RETRIES) {
        console.error("Max retries reached");
        channel.ack(msg);
      } else {
        channel.sendToQueue("send-otp", msg.content, {
          persistent: true,
          headers: { "x-retries": retryCount + 1 },
        });
        channel.ack(msg);
        console.log(`Requeued OTP for retry #${retryCount + 1}`);
      }
    }
  });
};
