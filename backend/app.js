import express from "express";
import cors from "cors";
import routes from "./routes/index.js";

const app = express();

// Middlewares
app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PATCH"]
  })
);
app.use(express.json({ limit: "10mb" }));

// Routes
app.use("/", routes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: "Not found",
    message: `Route ${req.method} ${req.path} does not exist`
  });
});

// Global error handling middleware
app.use((err, req, res, next) => {
  console.error("Unhandled Application Error:", err);
  res.status(err.status || 500).json({
    error: "Internal Server Error",
    message: err.message || "An unexpected error occurred"
  });
});

export default app;
