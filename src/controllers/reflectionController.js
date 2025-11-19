import mongoose from "mongoose";
import Reflection from "../models/Reflection.js";
import { asyncHandler } from "../middlewares/asyncHandler.js";
import { AppError } from "../utils/errorHandler.js";

const VALID_MOODS = ["angry", "anxious", "sad", "stressed", "neutral", "happy"];

export const createReflection = asyncHandler(async (req, res) => {
  const userId = req.user?._id;

  if (!userId) {
    throw new AppError("User not authenticated", 401);
  }

  const { mood, note, date } = req.body;

  if (!mood) {
    throw new AppError("Mood is required", 400);
  }

  if (!VALID_MOODS.includes(mood)) {
    throw new AppError(`Mood must be one of: ${VALID_MOODS.join(", ")}`, 400);
  }

  if (note && typeof note !== "string") {
    throw new AppError("Note must be a string", 400);
  }

  if (note && note.trim().length > 300) {
    throw new AppError("Note cannot exceed 300 characters", 400);
  }

  let reflectionDate = Date.now();
  if (date !== undefined) {
    const parsedDate = new Date(date);
    if (Number.isNaN(parsedDate.getTime())) {
      throw new AppError("Date must be a valid ISO string or timestamp", 400);
    }
    reflectionDate = parsedDate;
  }

  const reflection = await Reflection.create({
    userId,
    mood,
    note: note ? note.trim() : undefined,
    date: reflectionDate,
  });

  res.status(201).json({ success: true, data: reflection });
});

export const getReflections = asyncHandler(async (req, res) => {
  const userId = req.user?._id;

  if (!userId) {
    throw new AppError("User not authenticated", 401);
  }

  const { start, end } = req.query;
  const filters = { userId };

  if (start || end) {
    const dateFilter = {};

    if (start) {
      const startDate = new Date(start);
      if (Number.isNaN(startDate.getTime())) {
        throw new AppError("Start date must be a valid date", 400);
      }
      dateFilter.$gte = startDate;
    }

    if (end) {
      const endDate = new Date(end);
      if (Number.isNaN(endDate.getTime())) {
        throw new AppError("End date must be a valid date", 400);
      }
      dateFilter.$lte = endDate;
    }

    if (dateFilter.$gte && dateFilter.$lte && dateFilter.$lte < dateFilter.$gte) {
      throw new AppError("End date must be on or after the start date", 400);
    }

    filters.date = dateFilter;
  }

  const reflections = await Reflection.find(filters).sort({ date: -1 });

  res.json({ success: true, total: reflections.length, data: reflections });
});

export const getReflectionById = asyncHandler(async (req, res) => {
  const userId = req.user?._id;

  if (!userId) {
    throw new AppError("User not authenticated", 401);
  }

  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new AppError("Invalid reflection identifier", 400);
  }

  const reflection = await Reflection.findOne({ _id: id, userId });

  if (!reflection) {
    throw new AppError("Reflection not found", 404);
  }

  res.json({ success: true, data: reflection });
});

export const updateReflection = asyncHandler(async (req, res) => {
  const userId = req.user?._id;

  if (!userId) {
    throw new AppError("User not authenticated", 401);
  }

  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new AppError("Invalid reflection identifier", 400);
  }

  const updates = {};
  const { mood, note, date } = req.body;

  if (mood !== undefined) {
    if (!VALID_MOODS.includes(mood)) {
      throw new AppError(`Mood must be one of: ${VALID_MOODS.join(", ")}`, 400);
    }
    updates.mood = mood;
  }

  if (note !== undefined) {
    if (typeof note !== "string") {
      throw new AppError("Note must be a string", 400);
    }
    if (note.trim().length > 300) {
      throw new AppError("Note cannot exceed 300 characters", 400);
    }
    updates.note = note.trim();
  }

  if (date !== undefined) {
    const parsedDate = new Date(date);
    if (Number.isNaN(parsedDate.getTime())) {
      throw new AppError("Date must be a valid ISO string or timestamp", 400);
    }
    updates.date = parsedDate;
  }

  if (Object.keys(updates).length === 0) {
    throw new AppError("No valid fields provided for update", 400);
  }

  const reflection = await Reflection.findOneAndUpdate(
    { _id: id, userId },
    updates,
    { new: true }
  );

  if (!reflection) {
    throw new AppError("Reflection not found", 404);
  }

  res.json({ success: true, data: reflection });
});

export const deleteReflection = asyncHandler(async (req, res) => {
  const userId = req.user?._id;

  if (!userId) {
    throw new AppError("User not authenticated", 401);
  }

  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new AppError("Invalid reflection identifier", 400);
  }

  const reflection = await Reflection.findOneAndDelete({ _id: id, userId });

  if (!reflection) {
    throw new AppError("Reflection not found", 404);
  }

  res.json({ success: true, message: "Reflection deleted successfully" });
});

