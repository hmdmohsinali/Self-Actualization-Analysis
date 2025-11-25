import express from "express";
import { getQuestions } from "../controllers/questionController.js";
import { optionalAuthenticate } from "../middlewares/auth.js";

const router = express.Router();

// Optional authentication - allows both authenticated and non-authenticated users
// Non-authenticated users get Free plan categories (Survival, Safety)
// Authenticated users get their subscription's enabled categories
router.get("/", optionalAuthenticate, getQuestions);

export default router;

