import mongoose from "mongoose";

const subscriptionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    subscriptionType: {
      type: String,
      enum: ["Free", "Premium", "Coach"],
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      default: 0, // Free is $0
    },
    currency: {
      type: String,
      default: "USD",
    },
    // Stripe payment details
    stripePaymentIntentId: {
      type: String,
      default: null,
    },
    stripeCustomerId: {
      type: String,
      default: null,
    },
    stripeSubscriptionId: {
      type: String,
      default: null,
    },
    paymentStatus: {
      type: String,
      enum: ["pending", "succeeded", "failed", "canceled", "refunded"],
      default: "pending",
    },
    // Subscription period
    startedAt: {
      type: Date,
      default: Date.now,
    },
    expiresAt: {
      type: Date,
      default: null, // Free plan doesn't expire, paid plans can be monthly/yearly
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Index for active subscriptions lookup
subscriptionSchema.index({ userId: 1, isActive: 1 });
subscriptionSchema.index({ stripePaymentIntentId: 1 });

const Subscription = mongoose.model("Subscription", subscriptionSchema);

export default Subscription;

