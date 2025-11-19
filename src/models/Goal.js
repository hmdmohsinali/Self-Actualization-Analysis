import mongoose from "mongoose";

const goalSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, maxlength: 300 },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    type: {
      type: String,
      enum: ["Career", "Health", "Personal", "Spiritual"],
      required: true,
    },
    isCompleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export default mongoose.model("Goal", goalSchema);
