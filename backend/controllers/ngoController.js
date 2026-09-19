import { NgoService } from "../services/ngoService.js";

export class NgoController {
  static async getNgos(req, res) {
    try {
      const ngos = await NgoService.getAllNgos();
      res.json(ngos);
    } catch (err) {
      console.error("❌ Error fetching NGOs:", err);
      res.status(500).json({ error: "Failed to fetch NGOs" });
    }
  }
}
