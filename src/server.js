import app from "./app.js";

// For local development, start the server
if (process.env.VERCEL !== "1" && !process.env.VERCEL_ENV) {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => console.log(`🚀 Server running on port http://localhost:${PORT}`));
}

// Export as Vercel serverless function
export default app;
