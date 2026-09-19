import { io } from "socket.io-client";

const SOCKET_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

export const socket = io(SOCKET_URL, {
  autoConnect: true,
  reconnection: true,
  reconnectionAttempts: 10,
  reconnectionDelay: 1000
});

export function joinRole(role) {
  if (socket.connected) {
    socket.emit("join_role", role);
  } else {
    socket.once("connect", () => {
      socket.emit("join_role", role);
    });
  }
}

export function emitCreateRequest(requestData) {
  socket.emit("create_request", requestData);
}

export function emitUpdateStatus(id, status, note) {
  socket.emit("update_status", { id, status, note });
}

export function emitReportDelay(id, delay_minutes, reason) {
  socket.emit("report_delay", { id, delay_minutes, reason });
}
