import { RequestService } from "../services/requestService.js";

export function registerRequestSocketHandlers(io, socket) {
  // Client joins a specific role room (e.g., 'donor', 'ngo', 'dispatcher')
  socket.on("join_role", (role) => {
    socket.join(`role_${role}`);
    console.log(`👤 Socket ${socket.id} joined role room: role_${role}`);
  });

  // Real-time Surplus Food Request creation via WebSockets
  socket.on("create_request", async (data) => {
    try {
      await RequestService.createRequest(data);
    } catch (err) {
      console.error("❌ Socket create_request error:", err.message);
      socket.emit("error_alert", { message: "Failed to create request via WebSockets" });
    }
  });

  // Real-time Status Update via WebSockets
  socket.on("update_status", async (data) => {
    try {
      const { id, status, note } = data;
      const updated = await RequestService.updateRequestStatus(id, status, note);
      if (!updated) {
        return socket.emit("error_alert", { message: "Request not found" });
      }
    } catch (err) {
      console.error("❌ Socket update_status error:", err.message);
      socket.emit("error_alert", { message: "Failed to update status" });
    }
  });

  // Real-time Delivery Delay Alert via WebSockets
  socket.on("report_delay", async (data) => {
    try {
      const { id, delay_minutes, reason } = data;
      const updated = await RequestService.reportRequestDelay(id, delay_minutes, reason);
      if (!updated) {
        return socket.emit("error_alert", { message: "Request not found" });
      }
    } catch (err) {
      console.error("❌ Socket report_delay error:", err.message);
      socket.emit("error_alert", { message: "Failed to report delay" });
    }
  });
}
