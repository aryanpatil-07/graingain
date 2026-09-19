import { SurplusRequestModel } from "../models/SurplusRequest.js";
import { DeliveryLogModel } from "../models/DeliveryLog.js";
import { SocketService } from "./socketService.js";

export class RequestService {
  static async getAllRequests() {
    return await SurplusRequestModel.findAllWithLogs();
  }

  static async getRequestById(id) {
    return await SurplusRequestModel.findById(id);
  }

  static async createRequest(requestData) {
    const newRequest = await SurplusRequestModel.create(requestData);

    // Record initial status in delivery logs
    await DeliveryLogModel.create(
      newRequest.id,
      "PENDING",
      "Request created and pending NGO acceptance"
    );

    // Broadcast via WebSockets
    SocketService.broadcastRequestCreated(newRequest);

    return newRequest;
  }

  static async updateRequestStatus(id, status, note) {
    const updatedRequest = await SurplusRequestModel.updateStatus(id, status);
    if (!updatedRequest) {
      return null;
    }

    await DeliveryLogModel.create(
      id,
      status,
      note || `Status changed to ${status}`
    );

    SocketService.broadcastStatusUpdated({
      request: updatedRequest,
      status,
      note
    });

    return updatedRequest;
  }

  static async reportRequestDelay(id, delayMinutes, reason) {
    const updatedRequest = await SurplusRequestModel.reportDelay(id, delayMinutes, reason);
    if (!updatedRequest) {
      return null;
    }

    await DeliveryLogModel.create(
      id,
      "DELAYED",
      `Delivery delayed by ${delayMinutes} mins: ${reason}`
    );

    SocketService.broadcastDeliveryDelayed({
      request: updatedRequest,
      delay_minutes: delayMinutes,
      reason,
      timestamp: new Date().toISOString()
    });

    return updatedRequest;
  }
}
