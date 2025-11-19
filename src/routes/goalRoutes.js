import express from "express";
import {
  createGoal,
  getGoals,
  getGoalById,
  updateGoal,
  deleteGoal,
} from "../controllers/goalController.js";
import { authenticate } from "../middlewares/auth.js";

const router = express.Router();

router.use(authenticate);

router.post("/", createGoal);
router.get("/", getGoals);
router.get("/:id", getGoalById);
router.patch("/:id", updateGoal);
router.delete("/:id", deleteGoal);

export default router;

