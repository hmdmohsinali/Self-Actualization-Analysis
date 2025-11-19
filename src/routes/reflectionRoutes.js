import express from "express";
import {
  createReflection,
  getReflections,
  getReflectionById,
  updateReflection,
  deleteReflection,
} from "../controllers/reflectionController.js";
import { authenticate } from "../middlewares/auth.js";

const router = express.Router();

router.use(authenticate);

router.post("/", createReflection);
router.get("/", getReflections);
router.get("/:id", getReflectionById);
router.patch("/:id", updateReflection);
router.delete("/:id", deleteReflection);

export default router;

