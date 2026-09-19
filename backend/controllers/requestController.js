import { RequestService } from "../services/requestService.js";

export class RequestController {
  static async getAllRequests(req, res) {
    try {
      const requests = await RequestService.getAllRequests();
      res.json(requests);
    } catch (err) {
      console.error("❌ Error fetching requests:", err);
      res.status(500).json({ error: "Failed to fetch requests" });
    }
  }

  static async createRequest(req, res) {
    try {
      const newRequest = await RequestService.createRequest(req.body);
      res.status(201).json(newRequest);
    } catch (err) {
      console.error("❌ Error creating request:", err);
      res.status(500).json({ error: "Failed to create surplus request" });
    }
  }

  static async updateStatus(req, res) {
    try {
      const { id } = req.params;
      const { status, note } = req.body;

      const updatedRequest = await RequestService.updateRequestStatus(id, status, note);
      if (!updatedRequest) {
        return res.status(404).json({ error: "Request not found" });
      }

      res.json(updatedRequest);
    } catch (err) {
      console.error("❌ Error updating status:", err);
      res.status(500).json({ error: "Failed to update request status" });
    }
  }

  static async reportDelay(req, res) {
    try {
      const { id } = req.params;
      const { delay_minutes, reason } = req.body;

      const updatedRequest = await RequestService.reportRequestDelay(id, delay_minutes, reason);
      if (!updatedRequest) {
        return res.status(404).json({ error: "Request not found" });
      }

      res.json(updatedRequest);
    } catch (err) {
      console.error("❌ Error reporting delay:", err);
      res.status(500).json({ error: "Failed to report delay" });
    }
  }
}
