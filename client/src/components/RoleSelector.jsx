import React from "react";

export function RoleSelector({ currentRole, onSelectRole, socketConnected }) {
  return (
    <div className="role-selector-wrapper">
      <div className="role-selector-bar">
        <div className="role-label-tag">
          <span className="live-dot-pulse"></span> Mode:
        </div>

        <div className="role-pill-group" role="tablist" aria-label="Select user mode">
          <button
            type="button"
            role="tab"
            aria-selected={currentRole === "donor"}
            className={`role-pill ${currentRole === "donor" ? "active" : ""}`}
            onClick={() => onSelectRole("donor")}
          >
            🍴 Restaurant / Hotel (Donor)
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={currentRole === "ngo"}
            className={`role-pill ${currentRole === "ngo" ? "active" : ""}`}
            onClick={() => onSelectRole("ngo")}
          >
            🏠 NGO / Shelter (Recipient)
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={currentRole === "dispatcher"}
            className={`role-pill ${currentRole === "dispatcher" ? "active" : ""}`}
            onClick={() => onSelectRole("dispatcher")}
          >
            🛰️ Live Dispatcher (Tracker)
          </button>
        </div>

        <div className="socket-status-pill">
          <span className={`ws-status-indicator ${socketConnected ? "connected" : "disconnected"}`}></span>
          <span className="ws-text">{socketConnected ? "WebSockets Live" : "Connecting WS..."}</span>
        </div>
      </div>
    </div>
  );
}
