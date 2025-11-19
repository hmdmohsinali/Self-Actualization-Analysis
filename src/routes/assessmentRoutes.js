import express from "express";
import { submitAssessment, getLatestAssessment } from "../controllers/assessmentController.js";
import { authenticate } from "../middlewares/auth.js";

const router = express.Router();

router.post("/submit", authenticate, submitAssessment);
router.get("/result", authenticate, getLatestAssessment);


export default router;

