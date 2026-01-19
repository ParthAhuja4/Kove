import jwt from "jsonwebtoken";
import type { JwtPayload } from "jsonwebtoken";
import type { Request, Response, RequestHandler, NextFunction } from "express";
import ApiError from "@/utils/ApiError.js";
import mongoose from "mongoose";
import { connectionInstance } from "@/config/db.js";
import { User } from "@/controllers/chat.controller.js";

export interface AccessTokenPayload extends JwtPayload {
  id: string;
}
export const isAccessTokenPayload = (
  payload: string | JwtPayload,
): payload is AccessTokenPayload => {
  return (
    typeof payload === "object" &&
    payload !== null &&
    typeof (payload as any).id === "string"
  );
};
const JWT_SECRET = process.env["JWT_SECRET"];
if (!JWT_SECRET) {
  console.error("JWT_SECRET is not defined");
  process.exit(1);
}

const authUser: RequestHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    let { token } = req.headers;
    if (!token || typeof token !== "string") {
      return res.status(401).json({
        success: false,
        message: "Not Authorised!.. Login Again",
      });
    }

    const token_decode: JwtPayload | string = jwt.verify(token, JWT_SECRET);
    if (!isAccessTokenPayload(token_decode)) {
      throw new ApiError(401, "Invalid token");
    }
    const user: User = await connectionInstance?.connection.db
      .collection("users")
      .findOne({ _id: new mongoose.Types.ObjectId(token_decode.id) });

    if (!user) {
      return res.status(404).json({ message: "User Not Found" });
    }
    req.user = user;
    return next();
  } catch (e) {
    return res.status(500).json({ success: false });
  }
};

export default authUser;
