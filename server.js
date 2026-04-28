import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { analyzeFood } from "./services/aiService.js";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = 5000;

app.post("/analyze", async (req, res) => {
  const { description } = req.body;

  const result = await analyzeFood(description);

  res.json(result);
});

app.get("/test-ai", async (req, res) => {
  const result = await analyzeFood("15 veg meals, cooked rice 2 hours ago");

  console.log(result);

  res.json(result);
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
