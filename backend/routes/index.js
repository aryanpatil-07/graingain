import { Router } from "express";
import healthRoutes from "./healthRoutes.js";
import aiRoutes from "./aiRoutes.js";
import ngoRoutes from "./ngoRoutes.js";
import restaurantRoutes from "./restaurantRoutes.js";
import requestRoutes from "./requestRoutes.js";

const router = Router();

// Health check
router.use("/", healthRoutes);

// AI analysis
router.use("/", aiRoutes);

// Resource APIs
router.use("/api/ngos", ngoRoutes);
router.use("/api/restaurants", restaurantRoutes);
router.use("/api/requests", requestRoutes);

export default router;
