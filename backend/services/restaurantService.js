import { RestaurantModel } from "../models/Restaurant.js";

export class RestaurantService {
  static async getAllRestaurants() {
    return await RestaurantModel.findAll();
  }

  static async getRestaurantById(id) {
    return await RestaurantModel.findById(id);
  }
}
