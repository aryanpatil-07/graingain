import { analyzeFood } from "../services/aiService.js";

export class AiController {
  static async analyzeFoodDescription(req, res) {
    try {
      const { description } = req.body;

      if (!description || typeof description !== "string" || description.trim().length === 0) {
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
      res.json(result);
    } catch (err) {
      console.error("❌ Analyze endpoint error:", err);
      res.status(500).json({
        error: "Server error",
        message: err.message || "Unable to analyze food. Please try again later."
      });
    }
  }
}
