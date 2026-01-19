import Chat, { ChatDocument } from "@/models/chat.model.js";
import ApiError from "@/utils/ApiError.js";
import ApiResponse from "@/utils/ApiResponse.js";
import asyncHandler from "@/utils/asyncHandler.js";
import type { RequestHandler } from "express";
import { HydratedDocument } from "mongoose";
import fs from "fs";
import Message from "@/models/message.model.js";
import mongoose from "mongoose";

export type User = {
  _id: string;
  name: string;
  email: string;
  password?: string;
  createdAt: string;
  updatedAt: string;
};

export const createNewChat: RequestHandler = asyncHandler(async (req, res) => {
  if (!req.user || !req.user._id) {
    throw new ApiError(404, "User Not Found");
  }
  const userId: string = req.user._id;

  const { otherUserId } = req.body;

  if (!otherUserId) {
    throw new ApiError(400, "Other UserId Not Specified");
  }

  const existingChat: HydratedDocument<ChatDocument> | null =
    await Chat.findOne({
      users: { $all: [userId, otherUserId], $size: 2 },
    });

  if (existingChat) {
    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          { chatId: existingChat._id },
          "Chat Already Exists",
        ),
      );
  }

  const newChat: HydratedDocument<ChatDocument> = await Chat.create({
    users: [userId, otherUserId],
  });

  return res
    .status(200)
    .json(new ApiResponse(200, { chatId: newChat._id }, "Chat Created"));
});

export const getAllChats: RequestHandler = asyncHandler(async (req, res) => {
  if (!req.user || !req.user._id) {
    throw new ApiError(404, "User Not Found");
  }
  const userId = req.user._id.toString();

  const chats = await Chat.aggregate([
    // 1. Match chats where the current user is a participant
    {
      $match: {
        users: { $elemMatch: { $eq: userId } },
      },
    },
    // 2. Sort by latest interaction
    {
      $sort: { updatedAt: -1 },
    },
    // 3. Lookup the 'other' participant's details
    {
      $lookup: {
        from: "users",
        let: { chatUsers: "$users" },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  { $in: [{ $toString: "$_id" }, "$$chatUsers"] }, // Must be in the chat
                  { $ne: [{ $toString: "$_id" }, userId] }, // Must NOT be the current user
                ],
              },
            },
          },
          {
            $project: {
              password: 0, // Exclude sensitive fields
              createdAt: 0,
              updatedAt: 0,
            },
          },
        ],
        as: "participantDetails",
      },
    },
    // 4. Flatten the participant array (since we expect 1 other person in 1v1 chats)
    {
      $unwind: {
        path: "$participantDetails",
        preserveNullAndEmptyArrays: true, // Keep chat even if user is deleted
      },
    },
    // 5. Lookup Unseen Message Count
    {
      $lookup: {
        from: "messages",
        let: { chatId: "$_id" },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  { $eq: ["$chatId", "$$chatId"] }, // Match Chat ID
                  { $ne: ["$sender", userId] }, // Sender is not me
                  { $eq: ["$seen", false] }, // Message is not seen
                ],
              },
            },
          },
          { $count: "count" }, // Just get the number
        ],
        as: "unseenCountInfo",
      },
    },
    // 6. Format the final output
    {
      $addFields: {
        unseenCount: {
          $ifNull: [{ $arrayElemAt: ["$unseenCountInfo.count", 0] }, 0],
        },
        user: {
          $ifNull: ["$participantDetails", { _id: null, name: "Unknown User" }],
        },
      },
    },
    // 7. Clean up temporary fields
    {
      $project: {
        participantDetails: 0,
        unseenCountInfo: 0,
        users: 0, // Optional: remove if you only want the 'user' object
      },
    },
  ]);

  return res
    .status(200)
    .json(new ApiResponse(200, { chats }, "Chats Fetched Successfully"));
});

const removeLocalFile = async (filePath: string | undefined) => {
  if (filePath) {
    try {
      await fs.promises.unlink(filePath);
    } catch (error) {
      console.error("Error removing file:", error);
    }
  }
};

export const sendMessage: RequestHandler = asyncHandler(async (req, res) => {
  const senderId = req.user?._id;
  const { chatId, text } = req.body;
  const imageFile = req.file;

  if (!chatId) {
    await removeLocalFile(imageFile?.path);
    throw new ApiError(400, "ChatId is required");
  }

  if (!text && !imageFile) {
    throw new ApiError(400, "Message content (text or image) is required");
  }

  // We look for a chat with this ID where the users array includes the sender.
  const chat = await Chat.findOne({
    _id: chatId,
    users: senderId,
  });

  if (!chat) {
    await removeLocalFile(imageFile?.path);
    throw new ApiError(404, "Chat not found or user not authorized");
  }

  // 3. Construct Message Data
  const messageData = {
    chatId,
    sender: senderId,
    text: text || "",
    messageType: imageFile ? "image" : "text",
    ...(imageFile && {
      image: {
        url: imageFile.path,
        publicId: imageFile.filename,
      },
    }),
  };

  try {
    const [msg] = await Promise.all([
      Message.create(messageData),
      Chat.findByIdAndUpdate(
        chatId,
        {
          latestMessage: {
            text: imageFile ? "Photo" : text,
            sender: senderId,
          },
        },
        { new: true },
      ),
    ]);
    await removeLocalFile(imageFile?.path);
    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          { message: msg, sender: senderId },
          "Message Sent",
        ),
      );
  } catch (error) {
    await removeLocalFile(imageFile?.path);
    throw error;
  }
});

export const getMessageByChat: RequestHandler = asyncHandler(
  async (req, res) => {
    if (!req.user || !req.user._id) {
      throw new ApiError(404, "User Not Found");
    }

    const userId = req.user._id.toString();
    const chatId = req.params["chatId"];

    if (!chatId) {
      throw new ApiError(400, "ChatId Not Specified");
    }

    // Convert chatId to ObjectId for the aggregation
    const chatObjectId = new mongoose.Types.ObjectId(chatId.toString());

    // 1. Mark unseen messages from the *other* user as seen
    // We do this in parallel with the fetch or just before.
    // Since we want the returned messages to show "seen: true", we do it first.
    await Message.updateMany(
      {
        chatId: chatId,
        sender: { $ne: userId }, // Sender is not me
        seen: false,
      },
      {
        $set: { seen: true, seenAt: new Date() },
      },
    );

    // 2. Aggregate Chat details + Other Participant + Messages
    const chatData = await Chat.aggregate([
      {
        $match: {
          _id: chatObjectId,
          // Ensure the current user is actually in this chat
          users: { $elemMatch: { $eq: userId } },
        },
      },
      // Lookup the 'other' participant's details (Same logic as getAllChats)
      {
        $lookup: {
          from: "users",
          let: { chatUsers: "$users" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $in: [{ $toString: "$_id" }, "$$chatUsers"] },
                    { $ne: [{ $toString: "$_id" }, userId] },
                  ],
                },
              },
            },
            {
              $project: {
                name: 1,
                email: 1,
              },
            },
          ],
          as: "otherParticipant",
        },
      },
      // Unwind the participant (we expect 1 other person)
      {
        $unwind: {
          path: "$otherParticipant",
          preserveNullAndEmptyArrays: true,
        },
      },
      // Lookup Messages for this chat
      {
        $lookup: {
          from: "messages",
          let: { chatId: "$_id" },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ["$chatId", "$$chatId"] },
              },
            },
            { $sort: { createdAt: 1 } }, // Oldest first
          ],
          as: "messages",
        },
      },
      // Final Projection
      {
        $project: {
          _id: 1,
          users: 1,
          otherParticipant: {
            $ifNull: ["$otherParticipant", { _id: null, name: "Unknown User" }],
          },
          messages: 1,
        },
      },
    ]);

    if (!chatData || chatData.length === 0) {
      throw new ApiError(404, "Chat not found or you are not a participant");
    }

    const result = chatData[0];

    return res.status(200).json(
      new ApiResponse(
        200,
        {
          chatId: result._id,
          otherUser: result.otherParticipant,
          messages: result.messages,
        },
        "Messages Fetched Successfully",
      ),
    );
  },
);
