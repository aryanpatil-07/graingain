let ioInstance = null;

export class SocketService {
  static init(io) {
    ioInstance = io;
  }

  static getIO() {
    return ioInstance;
  }

  static broadcastRequestCreated(request) {
    if (ioInstance) {
      console.log(`📢 WebSockets: Broadcast new surplus request #${request.id}`);
      ioInstance.emit("request_created", request);
    }
  }

  static broadcastStatusUpdated({ request, status, note }) {
    if (ioInstance) {
      console.log(`📢 WebSockets: Request #${request.id} status updated to ${status}`);
      ioInstance.emit("status_updated", { request, status, note });
    }
  }

  static broadcastDeliveryDelayed({ request, delay_minutes, reason, timestamp }) {
    if (ioInstance) {
      console.log(`⚠️ WebSockets: Delivery delay reported for Request #${request.id}`);
      ioInstance.emit("delivery_delayed", {
        request,
        delay_minutes,
        reason,
        timestamp: timestamp || new Date().toISOString()
      });
      ioInstance.emit("status_updated", {
        request,
        status: "DELAYED",
        note: `Delayed by ${delay_minutes} mins`
      });
    }
  }
}
