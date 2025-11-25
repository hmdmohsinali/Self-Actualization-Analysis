import mongoose from "mongoose";
import Question from "../models/Questions.js";
import UserAssessment from "../models/UserAssessment.js";
import User from "../models/User.js";
import { asyncHandler } from "../middlewares/asyncHandler.js";
import { AppError } from "../utils/errorHandler.js";
import { getCategoriesForSubscription, validateCategoriesForSubscription } from "../utils/subscription.js";
import PDFDocument from "pdfkit";

const VALID_SCORE_MIN = 1;
const VALID_SCORE_MAX = 7;

export const submitAssessment = asyncHandler(async (req, res) => {
  const userId = req.user?._id;

  if (!userId) {
    throw new AppError("User not authenticated", 401);
  }

  const { responses } = req.body || {};

  if (!Array.isArray(responses) || responses.length === 0) {
    throw new AppError("Responses are required", 400);
  }

  // Get user's subscription to validate categories
  const user = await User.findById(userId).select("currentSubscriptionType");
  
  if (!user) {
    throw new AppError("User not found", 404);
  }

  const subscriptionType = user.currentSubscriptionType || "Free";
  const availableCategories = getCategoriesForSubscription(subscriptionType);

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const questionIds = responses
      .map((response) => response?.questionId)
      .filter((id) => mongoose.Types.ObjectId.isValid(id));

    if (!questionIds.length) {
      throw new AppError("No valid question IDs provided", 400);
    }

    const questions = await Question.find({ _id: { $in: questionIds } })
      .select(["_id", "category"])
      .lean();

    if (!questions.length) {
      throw new AppError("No matching questions found for given IDs", 400);
    }

    // Get all unique categories from questions
    const questionCategories = [...new Set(questions.map((q) => q.category))];

    // Validate categories against subscription
    const validation = validateCategoriesForSubscription(questionCategories, subscriptionType);
    if (!validation.isValid) {
      throw new AppError(validation.message, 403);
    }

    const categoryTotals = {};
    const categoryCounts = {};
    const validResponses = [];

    for (const response of responses) {
      const question = questions.find((q) => q._id.toString() === response.questionId);
      if (!question) {
        continue;
      }

      // Double-check: ensure question category is available for subscription (extra security)
      if (!availableCategories.includes(question.category)) {
        throw new AppError(
          `Question from category "${question.category}" is not available in your ${subscriptionType} subscription.`,
          403
        );
      }

      const score = Number(response.selectedOption);
      if (Number.isNaN(score) || score < VALID_SCORE_MIN || score > VALID_SCORE_MAX) {
        continue;
      }

      validResponses.push({
        questionId: question._id,
        selectedOption: score,
        category: question.category,
      });

      categoryTotals[question.category] = (categoryTotals[question.category] || 0) + score;
      categoryCounts[question.category] = (categoryCounts[question.category] || 0) + 1;
    }

    if (!validResponses.length) {
      throw new AppError("No valid responses", 400);
    }

    const categoryScores = {};
    Object.keys(categoryTotals).forEach((categoryKey) => {
      categoryScores[categoryKey] = Number(
        (categoryTotals[categoryKey] / categoryCounts[categoryKey]).toFixed(2)
      );
    });

    const overallScore =
      Object.keys(categoryScores).length > 0
        ? Number(
            (
              Object.values(categoryScores).reduce((sum, value) => sum + value, 0) /
              Object.values(categoryScores).length
            ).toFixed(2)
          )
        : 0;

    await UserAssessment.create(
      [
        {
          userId,
          responses: validResponses,
          categoryScores,
          overallScore,
          completedAt: new Date(),
        },
      ],
      { session }
    );

    // Update user flag to indicate assessment completion
    const completionDate = new Date();
    await User.findByIdAndUpdate(
      userId,
      {
        hasCompletedAssessment: true,
        assessmentCompletedAt: completionDate,
      },
      { session }
    );

    await session.commitTransaction();

    res.status(200).json({
      success: true,
      message: "Assessment submitted successfully",
      categoryScores,
      overallScore,
      hasCompletedAssessment: true,
    });
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
});

export const getLatestAssessment = asyncHandler(async (req, res) => {
    const userId = req.user?._id;
  
    if (!userId) {
      throw new AppError("User not authenticated", 401);
    }
  
    const latestAssessment = await UserAssessment.findOne({ userId })
      .sort({ createdAt: -1 })
      .lean();
  
    if (!latestAssessment) {
      throw new AppError("No assessment found for this user", 404);
    }
  
    const categoryScores = latestAssessment.categoryScores || {};
  
    const overallScore =
      latestAssessment.overallScore ??
      (Object.keys(categoryScores).length
        ? Number(
            (
              Object.values(categoryScores).reduce((sum, value) => sum + value, 0) /
              Object.values(categoryScores).length
            ).toFixed(2)
          )
        : 0);
  
    // Define static chart metadata (bands and descriptions)
    const chartMeta = {
      performanceBands: [
        { label: "Dysfunctional / Extreme", range: [1, 2], color: "#E63946" },
        { label: "Getting By", range: [3, 4], color: "#F1C40F" },
        { label: "Thriving", range: [5, 6], color: "#2ECC71" },
        { label: "Maximizing", range: [7, 7], color: "#27AE60" },
      ],
      categoryDescriptions: {
        Survival: "Physical needs, health, energy, rest, and nutrition.",
        Safety: "Stability, financial security, and sense of control.",
        Social: "Belonging, love, connection, and relationships.",
        Self: "Confidence, respect, and personal achievement.",
        "Meta-Needs": "Purpose, creativity, contribution, and self-actualization.",
      },
    };
  
    // Optional insight logic (can expand later)
    const lowestCategories = Object.entries(categoryScores)
      .sort(([, a], [, b]) => a - b)
      .slice(0, 2)
      .map(([cat]) => cat);
  
    res.status(200).json({
      success: true,
      message: "Latest assessment retrieved successfully",
      data: {
        assessmentId: latestAssessment._id,
        categoryScores,
        overallScore,
        lowestCategories,
        completedAt: latestAssessment.createdAt || latestAssessment.completedAt,
        chartMeta,
      },
    });
  });
  

  export const downloadAssessmentPDF = asyncHandler(async (req, res) => {
    const userId = req.user?._id;
    if (!userId) throw new AppError("User not authenticated", 401);
  
    const latestAssessment = await UserAssessment.findOne({ userId })
      .sort({ createdAt: -1 })
      .lean();
    if (!latestAssessment) throw new AppError("No assessment found", 404);
  
    const categoryScores = latestAssessment.categoryScores || {};
    const overallScore =
      latestAssessment.overallScore ??
      (Object.values(categoryScores).length
        ? Number(
            (
              Object.values(categoryScores).reduce((a, b) => a + b, 0) /
              Object.values(categoryScores).length
            ).toFixed(2)
          )
        : 0);
  
    // ---- Create PDF ----
    const doc = new PDFDocument({ margin: 50 });
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="assessment-summary.pdf"`
    );
    doc.pipe(res);
  
    doc.fontSize(20).text("Self-Actualization Assessment Summary", { align: "center" });
    doc.moveDown();
  
    doc.fontSize(12).text(`Date: ${new Date(latestAssessment.createdAt).toLocaleDateString()}`);
    doc.text(`User ID: ${userId}`);
    doc.moveDown();
  
    doc.fontSize(14).text("Category Scores", { underline: true });
    doc.moveDown(0.5);
  
    Object.entries(categoryScores).forEach(([cat, val]) => {
      doc.text(`${cat}: ${val}/7`);
    });
  
    doc.moveDown(1);
    doc.fontSize(14).text(`Overall Score: ${overallScore}/7`, { bold: true });
    doc.moveDown(1);
  
    // Optional: add chart legend / band descriptions
    const bands = [
      { label: "Dysfunctional / Extreme", range: [1, 2] },
      { label: "Getting By", range: [3, 4] },
      { label: "Thriving", range: [5, 6] },
      { label: "Maximizing", range: [7, 7] },
    ];
    doc.fontSize(12).text("Performance Bands:", { underline: true });
    bands.forEach((b) => doc.text(`${b.label}  (${b.range[0]}-${b.range[1]})`));
  
    doc.end();
  });