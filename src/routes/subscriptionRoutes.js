import express from "express";
import {
  createSubscription,
  getCurrentSubscription,
  getAvailableCategories,
  updateSubscriptionStatus,
} from "../controllers/subscriptionController.js";
import { authenticate } from "../middlewares/auth.js";

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Create subscription after payment
router.post("/", createSubscription);

// Get current subscription
router.get("/current", getCurrentSubscription);

// Get available categories
router.get("/available-categories", getAvailableCategories);

// Update subscription status (for webhooks or manual updates)
router.patch("/status", updateSubscriptionStatus);

export default router;

