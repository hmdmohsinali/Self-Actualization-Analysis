import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import crypto from "crypto";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      trim: true,
      required: function () {
        // Required only if not OAuth user
        return !this.isOAuthUser;
      },
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Please provide a valid email address"],
    },
    password: {
      type: String,
      required: function () {
        // Required only if not OAuth user
        return !this.isOAuthUser;
      },
      minlength: [6, "Password must be at least 6 characters long"],
      select: false, // Don't return password by default
    },
    isOAuthUser: {
      type: Boolean,
      default: false,
    },
    oauthProvider: {
      type: String,
      enum: ["google", "facebook", null],
      default: null,
    },
    oauthId: {
      type: String,
      default: null,
    },
    avatar: {
      type: String,
      default: null,
    },
    age: {
      type: Number,
      min: [0, "Age must be a positive number"],
      max: [120, "Age must be less than or equal to 120"],
    },
    focusAreas: {
      type: [String],
      default: [],
    },
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    lastLogin: {
      type: Date,
      default: null,
    },
    passwordResetToken: {
      type: String,
      default: null,
    },
    passwordResetExpires: {
      type: Date,
      default: null,
    },
    passwordResetOTP: {
      type: String,
      default: null,
    },
    passwordResetOTPExpires: {
      type: Date,
      default: null,
    },
    hasCompletedAssessment: {
      type: Boolean,
      default: false,
    },
    assessmentCompletedAt: {
      type: Date,
      default: null,
    },
    // Current subscription info (denormalized for quick access)
    currentSubscriptionType: {
      type: String,
      enum: ["Free", "Premium", "Coach"],
      default: "Free",
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: function (doc, ret) {
        delete ret.password;
        delete ret.__v;
        return ret;
      },
    },
  }
);

// Index for faster queries
userSchema.index({ email: 1 });
userSchema.index({ oauthProvider: 1, oauthId: 1 });

// Hash password before saving (only for non-OAuth users)
userSchema.pre("save", async function (next) {
  if (!this.isModified("password") || this.isOAuthUser) {
    return next();
  }

  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Instance method to compare password
userSchema.methods.comparePassword = async function (candidatePassword) {
  if (!this.password) {
    return false;
  }
  return await bcrypt.compare(candidatePassword, this.password);
};

// Static method to find user by email or OAuth
userSchema.statics.findByEmailOrOAuth = async function (email, oauthProvider, oauthId) {
  if (oauthProvider && oauthId) {
    return await this.findOne({
      $or: [
        { email, oauthProvider, oauthId },
        { email, oauthProvider },
        { email },
      ],
    });
  }
  return await this.findOne({ email });
};

// Instance method to generate password reset token
userSchema.methods.generatePasswordResetToken = function () {
  const resetToken = crypto.randomBytes(32).toString("hex");

  // Hash the token and save to database
  this.passwordResetToken = crypto.createHash("sha256").update(resetToken).digest("hex");
  this.passwordResetExpires = Date.now() + 10 * 60 * 1000; // 10 minutes

  return resetToken;
};

// Instance method to clear password reset token
userSchema.methods.clearPasswordResetToken = function () {
  this.passwordResetToken = undefined;
  this.passwordResetExpires = undefined;
};

// Instance method to generate password reset OTP
userSchema.methods.generatePasswordResetOTP = function () {
  const otp = `${Math.floor(100000 + Math.random() * 900000)}`; // 6-digit OTP

  this.passwordResetOTP = crypto.createHash("sha256").update(otp).digest("hex");
  this.passwordResetOTPExpires = Date.now() + 10 * 60 * 1000; // 10 minutes

  // Clear any existing token-based reset data
  this.passwordResetToken = undefined;
  this.passwordResetExpires = undefined;

  return otp;
};

// Instance method to clear password reset OTP
userSchema.methods.clearPasswordResetOTP = function () {
  this.passwordResetOTP = undefined;
  this.passwordResetOTPExpires = undefined;
};

const User = mongoose.model("User", userSchema);

export default User;

