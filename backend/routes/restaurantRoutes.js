import { Router } from "express";
import { RestaurantController } from "../controllers/restaurantController.js";

const router = Router();

router.get("/", RestaurantController.getRestaurants);

export default router;
