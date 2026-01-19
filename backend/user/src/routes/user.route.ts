import {
  generateOTP,
  getAllUsers,
  getMyData,
  loginUserOTP,
  loginUserPswrd,
  getUser,
  registerUser,
  updateName,
} from "@/controllers/user.controller.js";
import authUser from "@/middlewares/auth.middleware.js";
import { Router } from "express";

const userRouter: Router = Router();

userRouter.post("/register-user", registerUser);
userRouter.post("/generate-otp", generateOTP);
userRouter.post("/login-user-pswrd", loginUserPswrd);
userRouter.post("/login-user-otp", loginUserOTP);
userRouter.get("/profile", authUser, getMyData);
userRouter.post("/update-name", authUser, updateName);
userRouter.post("/users", authUser, getAllUsers);
userRouter.post("/:id", authUser, getUser);

export default userRouter;
