import { Router } from "express";
import { NgoController } from "../controllers/ngoController.js";

const router = Router();

router.get("/", NgoController.getNgos);

export default router;
