import mongoose from "mongoose";
import Subscription from "../models/Subscription.js";
import User from "../models/User.js";
import { asyncHandler } from "../middlewares/asyncHandler.js";
import { AppError } from "../utils/errorHandler.js";
import {
  SUBSCRIPTION_CATEGORIES,
  SUBSCRIPTION_PRICING,
  SUBSCRIPTION_TYPES,
  VALID_CATEGORIES,
  DEFAULT_CATEGORIES,
  getCategoriesForSubscription,
  getPricingForSubscription,
  validateCategoriesForSubscription,
  getSubscriptionInfo,
} from "../utils/subscription.js";

/**
 * @route   POST /api/subscriptions
 * @desc    Create/record subscription after successful payment
 * @access  Private
 */
export const createSubscription = asyncHandler(async (req, res) => {
  const userId = req.user?._id;

  if (!userId) {
    throw new AppError("User not authenticated", 401);
  }

  const {
    subscriptionType,
    stripePaymentIntentId,
    stripeCustomerId,
    stripeSubscriptionId,
    paymentStatus = "succeeded",
    expiresAt,
  } = req.body;

  // Validation
  if (!subscriptionType) {
    throw new AppError("Subscription type is required", 400);
  }

  if (!SUBSCRIPTION_TYPES.includes(subscriptionType)) {
    throw new AppError(`Invalid subscription type. Must be one of: ${SUBSCRIPTION_TYPES.join(", ")}`, 400);
  }

  // Validate payment details for paid plans
  if (subscriptionType !== "Free") {
    if (!stripePaymentIntentId) {
      throw new AppError("Stripe payment intent ID is required for paid subscriptions", 400);
    }
  }

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // Deactivate previous active subscriptions
    await Subscription.updateMany(
      { userId, isActive: true },
      { isActive: false },
      { session }
    );

    // Get available categories for this subscription type
    const availableCategories = getCategoriesForSubscription(subscriptionType);
    const amount = getPricingForSubscription(subscriptionType);

    // Create new subscription
    const subscription = await Subscription.create(
      [
        {
          userId,
          subscriptionType,
          amount,
          currency: "USD",
          stripePaymentIntentId: subscriptionType !== "Free" ? stripePaymentIntentId : null,
          stripeCustomerId: subscriptionType !== "Free" ? stripeCustomerId : null,
          stripeSubscriptionId: subscriptionType !== "Free" ? stripeSubscriptionId : null,
          paymentStatus,
          startedAt: new Date(),
          expiresAt: expiresAt ? new Date(expiresAt) : null,
          isActive: true,
        },
      ],
      { session }
    );

    // Update user's current subscription info
    await User.findByIdAndUpdate(
      userId,
      {
        currentSubscriptionType: subscriptionType,
      },
      { session }
    );

    await session.commitTransaction();

    res.status(201).json({
      success: true,
      message: "Subscription created successfully",
      data: {
        subscription: subscription[0],
        availableCategories, // Return available categories for frontend to show
      },
    });
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
});

/**
 * @route   GET /api/subscriptions/current
 * @desc    Get user's current active subscription
 * @access  Private
 */
export const getCurrentSubscription = asyncHandler(async (req, res) => {
  const userId = req.user?._id;

  if (!userId) {
    throw new AppError("User not authenticated", 401);
  }

  // Get active subscription
  const subscription = await Subscription.findOne({
    userId,
    isActive: true,
  }).sort({ createdAt: -1 });

    // If no active subscription, return default Free subscription info
    if (!subscription) {
      const user = await User.findById(userId).select("currentSubscriptionType");
      const subscriptionType = user?.currentSubscriptionType || "Free";
      const subscriptionInfo = getSubscriptionInfo(subscriptionType);
      
      return res.json({
        success: true,
        data: {
          subscription: {
            subscriptionType,
            isActive: true,
          },
          availableCategories: subscriptionInfo.availableCategories,
        },
      });
    }

    const subscriptionInfo = getSubscriptionInfo(subscription.subscriptionType);

    res.json({
      success: true,
      data: {
        subscription,
        availableCategories: subscriptionInfo.availableCategories,
      },
    });
});

/**
 * @route   GET /api/subscriptions/available-categories
 * @desc    Get available categories for a subscription type
 * @access  Private
 */
export const getAvailableCategories = asyncHandler(async (req, res) => {
  const userId = req.user?._id;

  if (!userId) {
    throw new AppError("User not authenticated", 401);
  }

  const { subscriptionType } = req.query;

  // If subscription type provided, return categories for that type
  if (subscriptionType) {
    if (!SUBSCRIPTION_TYPES.includes(subscriptionType)) {
      throw new AppError(`Invalid subscription type. Must be one of: ${SUBSCRIPTION_TYPES.join(", ")}`, 400);
    }

    return res.json({
      success: true,
      data: getSubscriptionInfo(subscriptionType),
    });
  }

  // Otherwise, get user's current subscription
  const subscription = await Subscription.findOne({
    userId,
    isActive: true,
  }).sort({ createdAt: -1 });

  const userSubscriptionType = subscription?.subscriptionType || "Free";

  res.json({
    success: true,
    data: getSubscriptionInfo(userSubscriptionType),
  });
});

/**
 * @route   PATCH /api/subscriptions/status
 * @desc    Update subscription payment status (for webhooks)
 * @access  Private
 */
export const updateSubscriptionStatus = asyncHandler(async (req, res) => {
  const userId = req.user?._id;

  if (!userId) {
    throw new AppError("User not authenticated", 401);
  }

  const { stripePaymentIntentId, paymentStatus } = req.body;

  if (!stripePaymentIntentId || !paymentStatus) {
    throw new AppError("Payment intent ID and payment status are required", 400);
  }

  if (!["pending", "succeeded", "failed", "canceled", "refunded"].includes(paymentStatus)) {
    throw new AppError("Invalid payment status", 400);
  }

  const subscription = await Subscription.findOne({
    userId,
    stripePaymentIntentId,
  });

  if (!subscription) {
    throw new AppError("Subscription not found", 404);
  }

  subscription.paymentStatus = paymentStatus;

  // If payment failed or was refunded, deactivate subscription
  if (paymentStatus === "failed" || paymentStatus === "refunded") {
    subscription.isActive = false;

    // Revert user to Free plan
    await User.findByIdAndUpdate(userId, {
      currentSubscriptionType: "Free",
    });
  }

  await subscription.save();

  res.json({
    success: true,
    message: "Subscription status updated successfully",
    data: {
      subscription,
    },
  });
});

