import amqp from "amqplib";
import nodemailer from "nodemailer";
import provideHTML from "@/utils/template.js";
import type { Transporter } from "nodemailer";

const transporter: Transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
  auth: {
    user: process.env["GMAIL_USER"],
    pass: process.env["GMAIL_PASS"],
  },
});

export const startSendOtpConsumer = async (): Promise<void> => {
  const connection = await amqp.connect({
    protocol: "amqp",
    hostname: "localhost",
    port: 5672,
    username: process.env["RABBITMQ_USERNAME"],
    password: process.env["RABBITMQ_PSWRD"],
  });

  const channel = await connection.createChannel();

  await channel.assertQueue("send-otp", { durable: true });

  channel.prefetch(2);

  console.log("RABBITMQ CONSUMER STARTED");

  channel.consume("send-otp", async (msg) => {
    if (!msg) return;

    // Read retry count from message headers
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
