import "express";
import { UserDocument } from "@/models/user.model.js";
import { HydratedDocument } from "mongoose";

declare module "express-serve-static-core" {
  interface Request {
    user?: HydratedDocument<UserDocument>;
  }
}
