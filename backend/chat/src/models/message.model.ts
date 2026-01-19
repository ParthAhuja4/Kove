import mongoose, { Schema, InferSchemaType } from "mongoose";

const msgSchema = new Schema(
  {
    chatId: {
      type: Schema.Types.ObjectId,
      ref: "Chat",
      required: true,
    },
    sender: { type: String, required: true },
    text: String,
    image: {
      url: String,
      publicId: String,
    },
    messageType: { type: String, enum: ["text", "image"], default: "text" },
    seen: { type: Boolean, default: false },
    seenAt: { type: Date, default: null },
  },
  { timestamps: true },
);

export type MessageDocument = InferSchemaType<typeof msgSchema>;

const Message =
  mongoose.models["message"] ||
  mongoose.model<MessageDocument>("Message", msgSchema);

export default Message;
