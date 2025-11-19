import express from "express";
import {
  register,
  login,
  oauthCallback,
  getCurrentUser,
  updateProfile,
  forgotPassword,
  resetPassword,
  verifyResetToken,
} from "../controllers/authController.js";
import { authenticate } from "../middlewares/auth.js";

const router = express.Router();

// Public routes
router.post("/register", register);
router.post("/login", login);
router.post("/oauth", oauthCallback);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);
router.post("/verify-reset-token", verifyResetToken);

// Protected routes
router.get("/me", authenticate, getCurrentUser);
router.put("/profile", authenticate, updateProfile);

export default router;

