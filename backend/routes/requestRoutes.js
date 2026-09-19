import { Router } from "express";
import { RequestController } from "../controllers/requestController.js";

const router = Router();

router.get("/", RequestController.getAllRequests);
router.post("/", RequestController.createRequest);
router.patch("/:id/status", RequestController.updateStatus);
router.patch("/:id/delay", RequestController.reportDelay);

export default router;
