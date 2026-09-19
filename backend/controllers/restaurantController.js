import { RestaurantService } from "../services/restaurantService.js";

export class RestaurantController {
  static async getRestaurants(req, res) {
    try {
      const restaurants = await RestaurantService.getAllRestaurants();
      res.json(restaurants);
    } catch (err) {
      console.error("❌ Error fetching restaurants:", err);
      res.status(500).json({ error: "Failed to fetch restaurants" });
    }
  }
}
