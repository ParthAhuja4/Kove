import mongoose, { Schema, InferSchemaType } from "mongoose";

const chatSchema = new Schema(
  {
    users: [{ type: String, require: true }],
    latestMessage: { text: String, sender: String },
  },
  { timestamps: true },
);

export type ChatDocument = InferSchemaType<typeof chatSchema>;

const Chat =
  mongoose.models["chat"] || mongoose.model<ChatDocument>("Chat", chatSchema);

export default Chat;
