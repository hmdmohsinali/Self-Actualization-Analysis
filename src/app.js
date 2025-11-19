import express from "express";
import dotenv from "dotenv";
import { connectDB } from "./config/db.js";
import authRoutes from "./routes/authRoutes.js";
import questionRoutes from "./routes/questionRoutes.js";
import assessmentRoutes from "./routes/assessmentRoutes.js";
import goalRoutes from "./routes/goalRoutes.js";
import reflectionRoutes from "./routes/reflectionRoutes.js";
import { errorHandler } from "./utils/errorHandler.js";

dotenv.config();

// Connect to database (non-blocking for serverless)
connectDB().catch((err) => {
  console.error("Database connection error:", err);
});

const app = express();

// CORS middleware
app.use((req, res, next) => {
  const allowedOrigins = process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(",")
    : ["http://localhost:3000", "http://localhost:5173"];

  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin) || !origin) {
    res.setHeader("Access-Control-Allow-Origin", origin || "*");
  }

  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, PATCH, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.setHeader("Access-Control-Allow-Credentials", "true");

  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }
  next();
});

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Welcome/root endpoint
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Welcome to Self Actualization Analysis API",
    version: "1.0.0",
    endpoints: {
      health: "/health",
      auth: {
        register: "POST /api/auth/register",
        login: "POST /api/auth/login",
        oauth: "POST /api/auth/oauth",
        forgotPassword: "POST /api/auth/forgot-password",
        resetPassword: "POST /api/auth/reset-password",
        verifyResetToken: "POST /api/auth/verify-reset-token",
        getCurrentUser: "GET /api/auth/me",
        updateProfile: "PUT /api/auth/profile",
      },
      questions: {
        list: "GET /api/questions",
      },
      assessment: {
        submit: "POST /api/assessment/submit",
        result: "GET /api/assessment/result",
      },
      goals: {
        create: "POST /api/goals",
        list: "GET /api/goals",
        retrieve: "GET /api/goals/:id",
        update: "PATCH /api/goals/:id",
        delete: "DELETE /api/goals/:id",
      },
      reflections: {
        create: "POST /api/reflections",
        list: "GET /api/reflections",
        retrieve: "GET /api/reflections/:id",
        update: "PATCH /api/reflections/:id",
        delete: "DELETE /api/reflections/:id",
      },
    },
    timestamp: new Date().toISOString(),
  });
});

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/questions", questionRoutes);
app.use("/api/assessment", assessmentRoutes);
app.use("/api/goals", goalRoutes);
app.use("/api/reflections", reflectionRoutes);

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({
    success: true,
    message: "Server is running",
    timestamp: new Date().toISOString(),
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: "Route not found",
  });
});

// Global error handler (must be last)
app.use(errorHandler);

export default app;
