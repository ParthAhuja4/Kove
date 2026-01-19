import { redisClient } from "@/config/redis.js";
import { publishToQueue } from "@/rabbitMQ/rabbitMQ.producer.js";
import ApiError from "@/utils/ApiError.js";
import asyncHandler from "@/utils/asyncHandler.js";
import type { RequestHandler } from "express";
import validator from "validator";
import bcrypt from "bcrypt";
import User from "@/models/user.model.js";
import ApiResponse from "@/utils/ApiResponse.js";
import jwt from "jsonwebtoken";
import type { UserDocument } from "@/models/user.model.js";
import type { HydratedDocument } from "mongoose";
import { ParsedQs } from "qs";

const JWT_SECRET = process.env["JWT_SECRET"];
const TOKEN_EXPIRY = Number(process.env["USER_ACCESS_TOKEN_EXPIRY"]);

if (!JWT_SECRET) {
  console.error("JWT_SECRET is not defined");
  process.exit(1);
}

if (!TOKEN_EXPIRY) {
  console.error("USER_ACCESS_TOKEN_EXPIRY is not defined");
  process.exit(1);
}

export type Message = {
  to: string;
  subject: string;
  otp: string;
};

export const registerUser: RequestHandler = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    throw new ApiError(400, "Missing required fields");
  }

  if (!validator.isEmail(email)) {
    throw new ApiError(422, "Invalid email");
  }

  if (!validator.isStrongPassword(password)) {
    throw new ApiError(422, "Try a stronger password");
  }

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw new ApiError(409, "User already exists");
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const user: HydratedDocument<UserDocument> = await User.create({
    name,
    email,
    password: hashedPassword,
  });

  const token = jwt.sign({ id: user._id.toString() }, JWT_SECRET, {
    expiresIn: TOKEN_EXPIRY,
  });

  return res
    .status(201)
    .json(new ApiResponse(201, { token }, "User registered successfully"));
});

export const generateOTP: RequestHandler = asyncHandler(async (req, res) => {
  const { email } = req.body;

  if (!validator.isEmail(email)) {
    throw new ApiError(422, "Invalid email");
  }

  const rateLimitKey = `otp:ratelimit:${email}`;
  if (await redisClient.get(rateLimitKey)) {
    throw new ApiError(429, "Too many OTP requests, try later");
  }

  const user = await User.findOne({ email });

  if (user) {
    let otp = await redisClient.get(`otp:${email}`);

    if (!otp) {
      otp = Math.floor(100000 + Math.random() * 900000).toString();

      await redisClient.set(`otp:${email}`, otp, { EX: 300 });

      await publishToQueue("send-otp", {
        to: email,
        subject: "Kove Login OTP",
        otp,
      });
    }
  }

  await redisClient.set(rateLimitKey, "true", { EX: 60 });

  return res
    .status(200)
    .json(
      new ApiResponse(200, null, "If the account exists, an OTP has been sent"),
    );
});

export const loginUserOTP: RequestHandler = asyncHandler(async (req, res) => {
  const { email, otp } = req.body;

  if (!validator.isEmail(email)) {
    throw new ApiError(422, "Invalid email");
  }

  if (!otp) {
    throw new ApiError(400, "OTP is required");
  }

  const storedOtp = await redisClient.get(`otp:${email}`);

  if (!storedOtp || storedOtp !== otp) {
    throw new ApiError(401, "Invalid credentials");
  }

  const user: HydratedDocument<UserDocument> | null = await User.findOne({
    email,
  });

  if (!user) {
    throw new ApiError(401, "Invalid credentials");
  }

  await redisClient.del(`otp:${email}`);

  const token = jwt.sign({ id: user._id.toString() }, JWT_SECRET, {
    expiresIn: TOKEN_EXPIRY,
  });

  return res
    .status(200)
    .json(new ApiResponse(200, { token }, "User logged in"));
});

export const loginUserPswrd: RequestHandler = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!validator.isEmail(email)) {
    throw new ApiError(422, "Invalid email");
  }

  if (!password) {
    throw new ApiError(400, "Password is required");
  }

  const user: HydratedDocument<UserDocument> | null = await User.findOne({
    email,
  });

  if (!user) {
    throw new ApiError(401, "Invalid credentials");
  }

  const isMatch = await bcrypt.compare(password, user.password);

  if (!isMatch) {
    throw new ApiError(401, "Invalid credentials");
  }

  const token = jwt.sign({ id: user._id.toString() }, JWT_SECRET, {
    expiresIn: TOKEN_EXPIRY,
  });

  return res
    .status(200)
    .json(new ApiResponse(200, { token }, "User logged in"));
});

export const getMyData: RequestHandler = asyncHandler(async (req, res) => {
  const { user } = req;
  if (!user) {
    throw new ApiError(404, "User Not Found");
  }
  const userObj: any = user.toObject();
  delete userObj.password;
  return res
    .status(200)
    .json(new ApiResponse(200, { user: userObj }, "User Fetched Successfully"));
});

export const updateName: RequestHandler = asyncHandler(async (req, res) => {
  const { user } = req;
  if (!user) {
    throw new ApiError(404, "User Not Found");
  }
  await User.updateOne(
    { _id: user._id },
    { $set: { name: req.body.name.trim() } },
  );

  return res.status(200).json(new ApiResponse(200, null, "Name Updated"));
});

export const getAllUsers: RequestHandler = asyncHandler(async (req, res) => {
  const nextCursor = req.query["nextCursor"];

  let query: { _id?: string | ParsedQs | (string | ParsedQs)[] } = {};
  if (nextCursor) {
    query._id = { $gt: nextCursor };
  }

  const users = await User.find(query)
    .sort({ _id: 1 })
    .limit(10)
    .select(["-password"]);
  const lastUser = users[users.length - 1];
  const newCursor = lastUser ? lastUser._id : null;

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { users, pagination: { nextCursor: newCursor } },
        "Users Fetched",
      ),
    );
});

export const getUser: RequestHandler = asyncHandler(async (req, res) => {
  if (!req.params["id"]) {
    throw new ApiError(404, "User Id Not Found");
  }
  const user = await User.findOne({ _id: req.params["id"] }).select([
    "-password",
  ]);
  return res.status(200).json(new ApiResponse(200, { user }, "User Fetched"));
});
