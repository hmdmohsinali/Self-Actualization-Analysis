import mongoose from "mongoose";
import Goal from "../models/Goal.js";
import { asyncHandler } from "../middlewares/asyncHandler.js";
import { AppError } from "../utils/errorHandler.js";

const GOAL_TYPES = ["Career", "Health", "Personal", "Spiritual"];

const parseDate = (value, fieldName) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new AppError(`${fieldName} must be a valid date`, 400);
  }
  return date;
};

export const createGoal = asyncHandler(async (req, res) => {
  const userId = req.user?._id;

  if (!userId) {
    throw new AppError("User not authenticated", 401);
  }

  const { title, description, startDate, endDate, type } = req.body;

  if (!title || !startDate || !endDate || !type) {
    throw new AppError("Missing required fields", 400);
  }

  if (!GOAL_TYPES.includes(type)) {
    throw new AppError(`Invalid goal type. Allowed types: ${GOAL_TYPES.join(", ")}`, 400);
  }

  const parsedStartDate = parseDate(startDate, "Start date");
  const parsedEndDate = parseDate(endDate, "End date");

  if (parsedEndDate < parsedStartDate) {
    throw new AppError("End date must be on or after the start date", 400);
  }

  const goal = await Goal.create({
    userId,
    title: title.trim(),
    description: description ? description.trim() : undefined,
    startDate: parsedStartDate,
    endDate: parsedEndDate,
    type,
  });

  res.status(201).json({ success: true, data: goal });
});

export const getGoals = asyncHandler(async (req, res) => {
  const userId = req.user?._id;

  if (!userId) {
    throw new AppError("User not authenticated", 401);
  }

  const { status } = req.query;
  const filters = { userId };

  if (status) {
    if (status === "active") {
      filters.isCompleted = false;
    } else if (status === "completed") {
      filters.isCompleted = true;
    } else {
      throw new AppError("Status must be either 'active' or 'completed'", 400);
    }
  }

  const goals = await Goal.find(filters).sort({ createdAt: -1 });

  res.json({ success: true, total: goals.length, data: goals });
});

export const getGoalById = asyncHandler(async (req, res) => {
  const userId = req.user?._id;

  if (!userId) {
    throw new AppError("User not authenticated", 401);
  }

  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new AppError("Invalid goal identifier", 400);
  }

  const goal = await Goal.findOne({ _id: id, userId });

  if (!goal) {
    throw new AppError("Goal not found", 404);
  }

  res.json({ success: true, data: goal });
});

export const updateGoal = asyncHandler(async (req, res) => {
  const userId = req.user?._id;

  if (!userId) {
    throw new AppError("User not authenticated", 401);
  }

  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new AppError("Invalid goal identifier", 400);
  }

  const updates = {};
  const { title, description, startDate, endDate, type, isCompleted } = req.body;

  if (title !== undefined) {
    if (!title.trim()) {
      throw new AppError("Title cannot be empty", 400);
    }
    updates.title = title.trim();
  }

  if (description !== undefined) {
    updates.description = description ? description.trim() : "";
  }

  if (type !== undefined) {
    if (!GOAL_TYPES.includes(type)) {
      throw new AppError(`Invalid goal type. Allowed types: ${GOAL_TYPES.join(", ")}`, 400);
    }
    updates.type = type;
  }

  if (isCompleted !== undefined) {
    if (typeof isCompleted !== "boolean") {
      throw new AppError("isCompleted must be a boolean value", 400);
    }
    updates.isCompleted = isCompleted;
  }

  let parsedStartDate;
  if (startDate !== undefined) {
    parsedStartDate = parseDate(startDate, "Start date");
    updates.startDate = parsedStartDate;
  }

  let parsedEndDate;
  if (endDate !== undefined) {
    parsedEndDate = parseDate(endDate, "End date");
    updates.endDate = parsedEndDate;
  }

  if (parsedStartDate && parsedEndDate && parsedEndDate < parsedStartDate) {
    throw new AppError("End date must be on or after the start date", 400);
  }

  const existingGoal = await Goal.findOne({ _id: id, userId });

  if (!existingGoal) {
    throw new AppError("Goal not found", 404);
  }

  if (!updates.startDate && parsedEndDate && existingGoal.startDate > parsedEndDate) {
    throw new AppError("End date must be on or after the start date", 400);
  }

  if (!updates.endDate && parsedStartDate && existingGoal.endDate < parsedStartDate) {
    throw new AppError("End date must be on or after the start date", 400);
  }

  Object.assign(existingGoal, updates);
  await existingGoal.save();

  res.json({ success: true, data: existingGoal });
});

export const deleteGoal = asyncHandler(async (req, res) => {
  const userId = req.user?._id;

  if (!userId) {
    throw new AppError("User not authenticated", 401);
  }

  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new AppError("Invalid goal identifier", 400);
  }

  const goal = await Goal.findOneAndDelete({ _id: id, userId });

  if (!goal) {
    throw new AppError("Goal not found", 404);
  }

  res.json({ success: true, message: "Goal deleted successfully" });
});

