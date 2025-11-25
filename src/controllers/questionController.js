import Question from "../models/Questions.js";
import User from "../models/User.js";
import { asyncHandler } from "../middlewares/asyncHandler.js";
import { AppError } from "../utils/errorHandler.js";
import {
  VALID_CATEGORIES,
  DEFAULT_CATEGORIES,
  getCategoriesForSubscription,
  validateCategoriesForSubscription,
} from "../utils/subscription.js";

export const getQuestions = asyncHandler(async (req, res) => {
  const { categories, limit = 100, page = 1 } = req.query;

  const limitNum = Math.min(Math.max(parseInt(limit, 10) || 100, 1), 200);
  const pageNum = Math.max(parseInt(page, 10) || 1, 1);

  // Get user's subscription type
  let currentSubscriptionType = "Free";
  let availableCategories = DEFAULT_CATEGORIES;

  if (req.user) {
    const user = await User.findById(req.user._id).select("currentSubscriptionType");
    if (user && user.currentSubscriptionType) {
      currentSubscriptionType = user.currentSubscriptionType;
      availableCategories = getCategoriesForSubscription(currentSubscriptionType);
    }
  }

  // Parse categories from query (can be comma-separated string or array)
  let selectedCategories = [];
  if (categories) {
    if (typeof categories === "string") {
      selectedCategories = categories.split(",").map((cat) => cat.trim());
    } else if (Array.isArray(categories)) {
      selectedCategories = categories;
    }
  } else {
    // If no categories provided, use all available categories for subscription
    selectedCategories = availableCategories;
  }

  // Validate categories against subscription
  if (req.user) {
    const validation = validateCategoriesForSubscription(selectedCategories, currentSubscriptionType);
    if (!validation.isValid) {
      throw new AppError(validation.message, 403);
    }
  } else {
    // For non-authenticated users, only allow Free categories
    const invalidCategories = selectedCategories.filter((cat) => !DEFAULT_CATEGORIES.includes(cat));
    if (invalidCategories.length > 0) {
      throw new AppError(
        `Unauthorized categories: ${invalidCategories.join(", ")}. Free plan allows: ${DEFAULT_CATEGORIES.join(", ")}`,
        403
      );
    }
  }

  // Validate category names
  const invalidCategoryNames = selectedCategories.filter((cat) => !VALID_CATEGORIES.includes(cat));
  if (invalidCategoryNames.length > 0) {
    throw new AppError(`Invalid category names: ${invalidCategoryNames.join(", ")}`, 400);
  }

  // Build filters
  const filters = {
    isActive: true,
    category: { $in: selectedCategories },
  };

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
    selectedCategories,
    availableCategories,
    currentSubscriptionType,
    data: questions,
  });
});

