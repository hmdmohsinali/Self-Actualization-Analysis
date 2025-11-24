import express from "express";
import { submitAssessment, getLatestAssessment, downloadAssessmentPDF } from "../controllers/assessmentController.js";
import { authenticate } from "../middlewares/auth.js";

const router = express.Router();

router.post("/submit", authenticate, submitAssessment);
router.get("/result", authenticate, getLatestAssessment);
router.get("/download-pdf", authenticate, downloadAssessmentPDF);

export default router;

