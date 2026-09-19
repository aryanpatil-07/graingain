import React from "react";

export function RoleSelector({ currentRole, onSelectRole, socketConnected }) {
  return (
    <div className="role-selector-container">
      <div className="role-selector-bar">
        <div className="role-label">
          <span className="pulse-dot"></span> Mode:
        </div>
        <div className="role-buttons">
          <button
            className={`role-btn ${currentRole === "donor" ? "active" : ""}`}
            onClick={() => onSelectRole("donor")}
          >
            🍴 Restaurant / Hotel (Donor)
          </button>
          <button
            className={`role-btn ${currentRole === "ngo" ? "active" : ""}`}
            onClick={() => onSelectRole("ngo")}
          >
            🏠 NGO / Shelter (Recipient)
          </button>
          <button
            className={`role-btn ${currentRole === "dispatcher" ? "active" : ""}`}
            onClick={() => onSelectRole("dispatcher")}
          >
            🛰️ Live Dispatcher (Tracker)
          </button>
        </div>
        <div className="socket-badge">
          <span className={`ws-status-dot ${socketConnected ? "connected" : "disconnected"}`}></span>
          {socketConnected ? "WebSockets Live" : "Connecting WS..."}
        </div>
      </div>
    </div>
  );
}
