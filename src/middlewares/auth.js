import { verifyToken } from "../utils/jwt.js";
import User from "../models/User.js";
import { AppError } from "../utils/errorHandler.js";

/**
 * Middleware to authenticate user via JWT token
 * Attaches user object to req.user if token is valid
 */
export const authenticate = async (req, res, next) => {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw new AppError("No token provided", 401);
    }

    const token = authHeader.substring(7); // Remove "Bearer " prefix

    // Verify token
    const decoded = verifyToken(token);

    // Find user and attach to request
    const user = await User.findById(decoded.userId).select("-password");

    if (!user) {
      throw new AppError("User not found", 404);
    }

    req.user = user;
    next();
  } catch (error) {
    if (error instanceof AppError) {
      return res.status(error.statusCode).json({
        success: false,
        error: error.message,
      });
    }

    // Handle JWT errors
    if (error.message === "Token has expired" || error.message === "Invalid token") {
      return res.status(401).json({
        success: false,
        error: error.message,
      });
    }

    res.status(500).json({
      success: false,
      error: "Authentication failed",
    });
  }
};

/**
 * Optional authentication middleware
 * Attaches user if token is present, but doesn't fail if missing
 */
export const optionalAuthenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.substring(7);
      const decoded = verifyToken(token);
      const user = await User.findById(decoded.userId).select("-password");
      if (user) {
        req.user = user;
      }
    }
    next();
  } catch (error) {
    // Silently fail for optional auth
    next();
  }
};

