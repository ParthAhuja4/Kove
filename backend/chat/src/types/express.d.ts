import { User } from "@/controllers/chat.controller";
import "express";

declare module "express-serve-static-core" {
  interface Request {
    user?: User;
  }
}
