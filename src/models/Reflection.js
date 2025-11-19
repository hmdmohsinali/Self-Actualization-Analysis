import mongoose from "mongoose";

const reflectionSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    mood: {
      type: String,
      enum: ["angry", "anxious", "sad", "stressed", "neutral", "happy"],
      required: true,
    },
    note: { type: String, maxlength: 300 },
    date: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export default mongoose.model("Reflection", reflectionSchema);
