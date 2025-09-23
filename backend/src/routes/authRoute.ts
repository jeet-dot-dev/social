import { Router } from "express";
import type { Request, Response } from "express";
import {
  signinController,
  signupController,
} from "../controllers/authController.js";
import { authmiddleware } from "../middlewares/authmiddleware.js";

interface AuthRequest extends Request {
  user?: {
    userId: number;
    email: string;
  };
}

const authrouter = Router();

// Auth routes
authrouter.post("/signup", signupController);
authrouter.post("/signin", signinController);

// Protected route example
authrouter.get("/profile", authmiddleware, (req: AuthRequest, res: Response) => {
  res.json({
    success: true,
    message: "Protected route accessed",
    user: req.user,
  });
});

export default authrouter;
