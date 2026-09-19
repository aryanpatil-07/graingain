import { NgoModel } from "../models/Ngo.js";

export class NgoService {
  static async getAllNgos() {
    return await NgoModel.findAll();
  }

  static async getNgoById(id) {
    return await NgoModel.findById(id);
  }
}
