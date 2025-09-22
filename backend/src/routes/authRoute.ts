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

const router = Router();

// Auth routes
router.post("/signup", signupController);
router.post("/signin", signinController);

// Protected route example
router.get("/profile", authmiddleware, (req: AuthRequest, res: Response) => {
  res.json({
    success: true,
    message: "Protected route accessed",
    user: req.user,
  });
});

export default router;
