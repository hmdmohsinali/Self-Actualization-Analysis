import mongoose from "mongoose";

const questionSchema = new mongoose.Schema(
  {
    questionText: {
      type: String,
      required: true,
      trim: true,
    },
    answerOptions: {
      type: [String], // e.g., ["1 - Not at all true", "2 - Rarely true", ...]
      required: true,
    },
    correctAnswer: {
      type: String,
      default: null,
    },
    pointValue: {
      type: Number,
      default: 0,
    },
    category: {
      type: String,
      enum: ["Survival", "Safety", "Social", "Self", "Meta-Needs"],
      required: true,
    },
    questionType: {
      type: String,
      enum: ["Multiple Choice - Horizontal", "Multiple Choice - Vertical"],
      default: "Multiple Choice - Horizontal",
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

const Question = mongoose.model("Question", questionSchema);
export default Question;
