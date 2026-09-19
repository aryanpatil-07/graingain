import { Router } from "express";
import { AiController } from "../controllers/aiController.js";

const router = Router();

router.post("/analyze", AiController.analyzeFoodDescription);

export default router;
