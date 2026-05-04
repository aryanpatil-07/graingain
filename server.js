import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { analyzeFood } from "./services/aiService.js";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json({ limit: "10mb" }));

const PORT = process.env.PORT || 5000;

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Main analyze endpoint
app.post("/analyze", async (req, res) => {
  try {
    console.log("📨 POST /analyze received");
    console.log("🔍 DEBUG: req.body =", req.body);
    
    const { description } = req.body;
    console.log("🔍 DEBUG: description =", description);

    if (!description || typeof description !== "string" || description.trim().length === 0) {
      console.log("❌ Invalid description");
      return res.status(400).json({
        error: "Invalid request",
        message: "Please provide a non-empty 'description' field"
      });
    }

    if (description.length > 1000) {
      return res.status(400).json({
        error: "Invalid request",
        message: "Description must be less than 1000 characters"
      });
    }

    const result = await analyzeFood(description.trim());
    console.log("✅ Analysis complete:", result);
    res.json(result);
  } catch (err) {
    console.error("❌ Analyze endpoint error:", err);
    res.status(500).json({
      error: "Server error",
      message: err.message || "Unable to analyze food. Please try again later."
    });
  }
});

// Test endpoint (optional)
app.get("/test-ai", async (req, res) => {
  try {
    const result = await analyzeFood("15 veg meals, cooked rice 2 hours ago");
    console.log("Test AI result:", result);
    res.json(result);
  } catch (err) {
    console.error("Test AI error:", err.message);
    res.status(500).json({
      error: "Test failed",
      message: "Unable to test AI service"
    });
  }
});

// Debug endpoint
app.get("/debug", (req, res) => {
  res.json({
    status: "ok",
    env_check: {
      has_api_key: !!process.env.FEATHERLESS_API_KEY,
      has_model: !!process.env.FEATHERLESS_MODEL,
      port: PORT
    }
  });
});
// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: "Not found",
    message: `Route ${req.method} ${req.path} does not exist`
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);
  res.status(500).json({
    error: "Internal server error",
    message: "Something went wrong. Please try again later."
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
  console.log(`🔗 API endpoint: POST http://localhost:${PORT}/analyze`);
  console.log(`❤️ Health check: GET http://localhost:${PORT}/health`);
  if (process.env.NODE_ENV !== "production") {
    console.log(`🧪 Test endpoint: GET http://localhost:${PORT}/test-ai`);
  }
});
