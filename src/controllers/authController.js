import User from "../models/User.js";
import { generateToken } from "../utils/jwt.js";
import { AppError } from "../utils/errorHandler.js";
import { asyncHandler } from "../middlewares/asyncHandler.js";
import { isValidEmail, validatePassword, validateName } from "../utils/validation.js";
import { sendPasswordResetOTPEmail } from "../utils/email.js";
import crypto from "crypto";

/**
 * @route   POST /api/auth/register
 * @desc    Register a new user
 * @access  Public
 */
export const register = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;

  // Validation
  if (!name || !email || !password) {
    throw new AppError("Please provide name, email, and password", 400);
  }

  if (!validateName(name).isValid) {
    throw new AppError(validateName(name).message, 400);
  }

  if (!isValidEmail(email)) {
    throw new AppError("Please provide a valid email address", 400);
  }

  const passwordValidation = validatePassword(password);
  if (!passwordValidation.isValid) {
    throw new AppError(passwordValidation.message, 400);
  }

  // Check if user already exists
  const existingUser = await User.findOne({ email: email.toLowerCase() });
  if (existingUser) {
    throw new AppError("User with this email already exists", 409);
  }

  // Create user
  const user = await User.create({
    name: name.trim(),
    email: email.toLowerCase().trim(),
    password,
    isOAuthUser: false,
  });

  // Generate token
  const token = generateToken({
    userId: user._id.toString(),
    email: user.email,
  });

  // Update last login
  user.lastLogin = new Date();
  await user.save();

  res.status(201).json({
    success: true,
    message: "User registered successfully",
    data: {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        isOAuthUser: user.isOAuthUser,
        hasCompletedAssessment: user.hasCompletedAssessment || false,
        currentSubscriptionType: user.currentSubscriptionType || "Free",
        createdAt: user.createdAt,
      },
      token,
    },
  });
});

/**
 * @route   POST /api/auth/login
 * @desc    Login user
 * @access  Public
 */
export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  // Validation
  if (!email || !password) {
    throw new AppError("Please provide email and password", 400);
  }

  if (!isValidEmail(email)) {
    throw new AppError("Please provide a valid email address", 400);
  }

  // Find user with password field
  const user = await User.findOne({ email: email.toLowerCase() }).select("+password");

  if (!user) {
    throw new AppError("Invalid email or password", 401);
  }

  // Check if user is OAuth-only user
  if (user.isOAuthUser && !user.password) {
    throw new AppError(
      "This account was created with social login. Please use Google or Facebook to sign in.",
      401
    );
  }

  // Verify password
  const isPasswordValid = await user.comparePassword(password);

  if (!isPasswordValid) {
    throw new AppError("Invalid email or password", 401);
  }

  // Generate token
  const token = generateToken({
    userId: user._id.toString(),
    email: user.email,
  });

  // Update last login
  user.lastLogin = new Date();
  await user.save({ validateBeforeSave: false });

  res.json({
    success: true,
    message: "Login successful",
    data: {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        isOAuthUser: user.isOAuthUser,
        avatar: user.avatar,
        hasCompletedAssessment: user.hasCompletedAssessment || false,
        assessmentCompletedAt: user.assessmentCompletedAt || null,
        currentSubscriptionType: user.currentSubscriptionType || "Free",
        lastLogin: user.lastLogin,
      },
      token,
    },
  });
});

/**
 * @route   POST /api/auth/oauth
 * @desc    Store or update OAuth user data (called from frontend after OAuth)
 * @access  Public
 */
export const oauthCallback = asyncHandler(async (req, res) => {
  const { name, email, oauthProvider, oauthId, avatar } = req.body;

  // Validation
  if (!email || !oauthProvider || !oauthId) {
    throw new AppError("Please provide email, oauthProvider, and oauthId", 400);
  }

  if (!["google", "facebook"].includes(oauthProvider.toLowerCase())) {
    throw new AppError("Invalid OAuth provider. Supported: google, facebook", 400);
  }

  if (!isValidEmail(email)) {
    throw new AppError("Please provide a valid email address", 400);
  }

  const provider = oauthProvider.toLowerCase();
  const normalizedEmail = email.toLowerCase().trim();

  // Find existing user by email or OAuth credentials
  let user = await User.findByEmailOrOAuth(normalizedEmail, provider, oauthId);

  if (user) {
    // Update existing user with OAuth info if not already set
    if (!user.isOAuthUser) {
      user.isOAuthUser = true;
      user.oauthProvider = provider;
      user.oauthId = oauthId;
    }

    // Update name and avatar if provided and different
    if (name && name.trim() && (!user.name || user.name !== name.trim())) {
      user.name = name.trim();
    }

    if (avatar && avatar !== user.avatar) {
      user.avatar = avatar;
    }

    user.lastLogin = new Date();
    await user.save({ validateBeforeSave: false });
  } else {
    // Create new OAuth user
    user = await User.create({
      name: name ? name.trim() : email.split("@")[0], // Use email prefix if name not provided
      email: normalizedEmail,
      isOAuthUser: true,
      oauthProvider: provider,
      oauthId,
      avatar: avatar || null,
      isEmailVerified: true, // OAuth emails are typically verified
    });
  }

  // Generate token
  const token = generateToken({
    userId: user._id.toString(),
    email: user.email,
  });

  res.status(user.isNew ? 201 : 200).json({
    success: true,
    message: user.isNew ? "OAuth user created successfully" : "OAuth login successful",
    data: {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        isOAuthUser: user.isOAuthUser,
        oauthProvider: user.oauthProvider,
        avatar: user.avatar,
        hasCompletedAssessment: user.hasCompletedAssessment || false,
        assessmentCompletedAt: user.assessmentCompletedAt || null,
        currentSubscriptionType: user.currentSubscriptionType || "Free",
        lastLogin: user.lastLogin,
      },
      token,
    },
  });
});

/**
 * @route   GET /api/auth/me
 * @desc    Get current authenticated user
 * @access  Private
 */
export const getCurrentUser = asyncHandler(async (req, res) => {
  // User is attached by authenticate middleware
  res.json({
    success: true,
    data: {
      user: req.user,
    },
  });
});

/**
 * @route   PUT /api/auth/profile
 * @desc    Update user profile
 * @access  Private
 */
export const updateProfile = asyncHandler(async (req, res) => {
  const { name, age, focusAreas, avatar } = req.body;
  const user = req.user;

  const updates = {};

  if (name !== undefined) {
    const nameValidation = validateName(name);
    if (!nameValidation.isValid) {
      throw new AppError(nameValidation.message, 400);
    }
    updates.name = name.trim();
  }

  if (age !== undefined) {
    const parsedAge = Number(age);
    if (!Number.isFinite(parsedAge) || parsedAge < 0 || parsedAge > 120) {
      throw new AppError("Age must be a number between 0 and 120", 400);
    }
    updates.age = Math.round(parsedAge);
  }

  if (focusAreas !== undefined) {
    if (!Array.isArray(focusAreas)) {
      throw new AppError("Focus areas must be an array of strings", 400);
    }

    const sanitizedFocusAreas = focusAreas.map((item) => {
      if (typeof item !== "string") {
        throw new AppError("Focus areas must contain only strings", 400);
      }
      const trimmed = item.trim();
      if (!trimmed) {
        throw new AppError("Focus areas cannot contain empty strings", 400);
      }
      return trimmed;
    });

    updates.focusAreas = [...new Set(sanitizedFocusAreas)];
  }

  if (avatar !== undefined) {
    if (avatar !== null && typeof avatar !== "string") {
      throw new AppError("Avatar must be a string URL or null", 400);
    }
    const trimmedAvatar =
      typeof avatar === "string" ? avatar.trim() : null;
    updates.avatar = trimmedAvatar || null;
  }

  if (Object.keys(updates).length === 0) {
    throw new AppError("No valid fields provided for update", 400);
  }

  Object.assign(user, updates);

  await user.save({ validateBeforeSave: false });

  res.json({
    success: true,
    message: "Profile updated successfully",
    data: {
      user,
    },
  });
});

/**
 * @route   POST /api/auth/forgot-password
 * @desc    Send password reset email
 * @access  Public
 */
export const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;

  // Validation
  if (!email) {
    throw new AppError("Please provide an email address", 400);
  }

  if (!isValidEmail(email)) {
    throw new AppError("Please provide a valid email address", 400);
  }

  // Find user
  const user = await User.findOne({ email: email.toLowerCase() });

  // Check if user exists
  if (!user) {
    throw new AppError("No account found with this email address", 404);
  }

  // Check if user is OAuth-only (no password to reset)
  if (user.isOAuthUser && !user.password) {
    throw new AppError(
      "This account was created with social login. Please use Google or Facebook to sign in.",
      400
    );
  }

  // Generate reset OTP
  const otp = user.generatePasswordResetOTP();
  await user.save({ validateBeforeSave: false });

  try {
    // Send password reset OTP email
    await sendPasswordResetOTPEmail({
      email: user.email,
      name: user.name,
      otp,
    });

    res.json({
      success: true,
      message: "Password reset code has been sent to your email address.",
    });
  } catch (error) {
    // If email fails, clear the reset OTP
    user.passwordResetOTP = undefined;
    user.passwordResetOTPExpires = undefined;
    await user.save({ validateBeforeSave: false });

    console.error("Password reset email error:", error);
    throw new AppError("Failed to send password reset code. Please try again later.", 500);
  }
});

/**
 * @route   POST /api/auth/reset-password
 * @desc    Reset password using OTP
 * @access  Public
 */
export const resetPassword = asyncHandler(async (req, res) => {
  const { otp, password } = req.body;

  // Validation
  if (!otp || !password) {
    throw new AppError("Please provide the reset code and new password", 400);
  }

  const passwordValidation = validatePassword(password);
  if (!passwordValidation.isValid) {
    throw new AppError(passwordValidation.message, 400);
  }

  // Hash the OTP to compare with stored hash
  const hashedOTP = crypto.createHash("sha256").update(otp).digest("hex");

  // Find user with valid reset OTP
  const user = await User.findOne({
    passwordResetOTP: hashedOTP,
    passwordResetOTPExpires: { $gt: Date.now() }, // OTP not expired
  });

  if (!user) {
    throw new AppError("Invalid or expired password reset code", 400);
  }

  // Check if user is OAuth-only
  if (user.isOAuthUser && !user.password) {
    // Allow setting password for OAuth users
    user.isOAuthUser = false;
  }

  // Set new password
  user.password = password;
  user.clearPasswordResetOTP();
  user.clearPasswordResetToken();
  await user.save();

  // Generate new token for immediate login
  const authToken = generateToken({
    userId: user._id.toString(),
    email: user.email,
  });

  res.json({
    success: true,
    message: "Password has been reset successfully",
    data: {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        isOAuthUser: user.isOAuthUser,
      },
      token: authToken,
    },
  });
});

/**
 * @route   POST /api/auth/verify-reset-token
 * @desc    Verify if reset OTP is valid (optional, for frontend validation)
 * @access  Public
 */
export const verifyResetToken = asyncHandler(async (req, res) => {
  const { otp } = req.body;

  if (!otp) {
    throw new AppError("Please provide a reset code", 400);
  }

  // Hash the OTP to compare with stored hash
  const hashedOTP = crypto.createHash("sha256").update(otp).digest("hex");

  // Find user with valid reset OTP
  const user = await User.findOne({
    passwordResetOTP: hashedOTP,
    passwordResetOTPExpires: { $gt: Date.now() },
  });

  if (!user) {
    throw new AppError("Invalid or expired password reset code", 400);
  }

  res.json({
    success: true,
    message: "Reset code is valid",
  });
});

