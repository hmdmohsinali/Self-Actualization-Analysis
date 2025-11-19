import Question from "../models/Questions.js";
import { asyncHandler } from "../middlewares/asyncHandler.js";
import { AppError } from "../utils/errorHandler.js";

const VALID_CATEGORIES = ["Survival", "Safety", "Social", "Self", "Meta-Needs"];

export const getQuestions = asyncHandler(async (req, res) => {
  const { category, limit = 100, page = 1 } = req.query;

  const limitNum = Math.min(Math.max(parseInt(limit, 10) || 100, 1), 200);
  const pageNum = Math.max(parseInt(page, 10) || 1, 1);

  if (category) {
    if (!VALID_CATEGORIES.includes(category)) {
      throw new AppError("Invalid category", 400);
    }
  }

  const filters = {};

  if (category) {
    filters.category = category;
  }

  const questions = await Question.find(filters)
    .sort({ category: 1, createdAt: 1 })
    .skip((pageNum - 1) * limitNum)
    .limit(limitNum)
    .lean();

  if (!questions.length) {
    throw new AppError("No questions found", 404);
  }

  res.status(200).json({
    success: true,
    total: questions.length,
    data: questions,
  });
});

