import React, { useState } from "react";
import { emitUpdateStatus, emitReportDelay } from "../services/socket";

export function LiveDeliveryTracker({ requests, currentRole, latestAlert, clearAlert }) {
  const [delayInputId, setDelayInputId] = useState(null);
  const [delayMins, setDelayMins] = useState(15);
  const [delayReason, setDelayReason] = useState("Traffic Congestion");

  const handleStatusChange = (id, newStatus, note) => {
    emitUpdateStatus(id, newStatus, note);
  };

  const handleReportDelay = (id) => {
    if (!delayMins || delayMins <= 0) return;
    emitReportDelay(id, Number(delayMins), delayReason);
    setDelayInputId(null);
  };

  const getStatusStepIndex = (status) => {
    switch (status) {
      case "PENDING": return 1;
      case "ACCEPTED": return 2;
      case "IN_TRANSIT": return 3;
      case "DELAYED": return 3;
      case "DELIVERED": return 4;
      default: return 1;
    }
  };

  return (
    <div className="live-delivery-tracker glass-panel">
      <div className="tracker-header">
        <div>
          <h2>🛰️ Real-Time Food Delivery Dispatcher</h2>
          <p className="subtitle">
            2-Way WebSocket channel connecting Restaurants, Hotels & NGOs with live status updates.
          </p>
        </div>
        <div className="live-pill">
          <span className="live-dot pulse"></span> LIVE SYNC
        </div>
      </div>

      {/* Real-Time WebSocket Alert Banner */}
      {latestAlert && (
        <div className={`realtime-alert-banner alert-${latestAlert.type}`}>
          <div className="alert-content">
            <span className="alert-icon">
              {latestAlert.type === "delay" ? "⚠️" : "📢"}
            </span>
            <div>
              <strong>{latestAlert.title}</strong>
              <p>{latestAlert.message}</p>
            </div>
          </div>
          <button className="alert-close-btn" onClick={clearAlert}>✕</button>
        </div>
      )}

      {requests.length === 0 ? (
        <div className="empty-tracker">
          <div className="empty-icon">📦</div>
          <h3>No Surplus Requests Active</h3>
          <p>Submit a surplus food description above to trigger real-time dispatching.</p>
        </div>
      ) : (
        <div className="requests-grid">
          {requests.map((req) => {
            const stepIndex = getStatusStepIndex(req.status);
            const isDelayed = req.status === "DELAYED";

            return (
              <div key={req.id} className={`tracker-card ${isDelayed ? "card-delayed" : ""}`}>
                <div className="tracker-card-header">
                  <div className="req-title-group">
                    <span className="req-id">Request #{req.id}</span>
                    <h3>{req.food_type}</h3>
                  </div>
                  <div className={`status-badge status-${req.status.toLowerCase()}`}>
                    {isDelayed ? `⚠️ DELAYED (+${req.delay_minutes || 0}m)` : req.status}
                  </div>
                </div>

                <div className="req-details-grid">
                  <div className="detail-box">
                    <span className="label">Destination NGO</span>
                    <span className="val highlight">{req.ngo_name || "Helping Hands"}</span>
                  </div>
                  <div className="detail-box">
                    <span className="label">Safe For</span>
                    <span className="val">{req.expiry_hours ? Number(req.expiry_hours).toFixed(1) : 4} hrs</span>
                  </div>
                  <div className="detail-box">
                    <span className="label">Urgency Level</span>
                    <span className={`val urgency-${(req.urgency || "MEDIUM").toLowerCase()}`}>
                      {req.urgency || "MEDIUM"}
                    </span>
                  </div>
                  <div className="detail-box">
                    <span className="label">Estimated Pickup ETA</span>
                    <span className="val">{req.eta_minutes ? req.eta_minutes + (req.delay_minutes || 0) : 30} mins</span>
                  </div>
                </div>

                {req.description && (
                  <p className="req-description">
                    <strong>Details:</strong> "{req.description}"
                  </p>
                )}

                {/* Status Stepper */}
                <div className="stepper-wrapper">
                  <div className="stepper-track">
                    <div className="stepper-progress" style={{ width: `${((stepIndex - 1) / 3) * 100}%` }}></div>
                  </div>
                  <div className="stepper-steps">
                    <div className={`step-item ${stepIndex >= 1 ? "completed" : ""}`}>
                      <div className="step-circle">1</div>
                      <span className="step-text">Requested</span>
                    </div>
                    <div className={`step-item ${stepIndex >= 2 ? "completed" : ""}`}>
                      <div className="step-circle">2</div>
                      <span className="step-text">Accepted</span>
                    </div>
                    <div className={`step-item ${stepIndex >= 3 ? (isDelayed ? "warning" : "completed") : ""}`}>
                      <div className="step-circle">{isDelayed ? "!" : "3"}</div>
                      <span className="step-text">{isDelayed ? "Delayed" : "In Transit"}</span>
                    </div>
                    <div className={`step-item ${stepIndex >= 4 ? "completed" : ""}`}>
                      <div className="step-circle">4</div>
                      <span className="step-text">Delivered</span>
                    </div>
                  </div>
                </div>

                {isDelayed && req.delay_reason && (
                  <div className="delay-notice-box">
                    ⚠️ Delay Reason: <strong>{req.delay_reason}</strong> (+{req.delay_minutes} mins)
                  </div>
                )}

                {/* Actions Bar for NGOs/Shelters or Dispatchers */}
                <div className="tracker-actions">
                  {req.status === "PENDING" && (
                    <button
                      className="btn-action btn-accept"
                      onClick={() => handleStatusChange(req.id, "ACCEPTED", "NGO Accepted Surplus Request")}
                    >
                      ✓ Accept Pickup Request
                    </button>
                  )}

                  {req.status === "ACCEPTED" && (
                    <button
                      className="btn-action btn-transit"
                      onClick={() => handleStatusChange(req.id, "IN_TRANSIT", "Food Picked Up & In Transit")}
                    >
                      🚚 Mark In Transit
                    </button>
                  )}

                  {(req.status === "IN_TRANSIT" || req.status === "ACCEPTED" || req.status === "DELAYED") && (
                    <button
                      className="btn-action btn-delay"
                      onClick={() => setDelayInputId(delayInputId === req.id ? null : req.id)}
                    >
                      ⚠️ Report Delay
                    </button>
                  )}

                  {(req.status === "IN_TRANSIT" || req.status === "DELAYED") && (
                    <button
                      className="btn-action btn-complete"
                      onClick={() => handleStatusChange(req.id, "DELIVERED", "Food Delivered to NGO Shelter Successfully")}
                    >
                      🎉 Confirm Delivery
                    </button>
                  )}
                </div>

                {/* Inline Delay Reporting Form */}
                {delayInputId === req.id && (
                  <div className="delay-form-popover">
                    <h4>Report Delivery Delay</h4>
                    <div className="delay-inputs">
                      <label>
                        Extra Minutes:
                        <input
                          type="number"
                          value={delayMins}
                          onChange={(e) => setDelayMins(e.target.value)}
                          min="5"
                          max="120"
                        />
                      </label>
                      <label>
                        Reason:
                        <select value={delayReason} onChange={(e) => setDelayReason(e.target.value)}>
                          <option value="Traffic Congestion">Heavy Traffic</option>
                          <option value="Vehicle Breakdown">Vehicle Breakdown</option>
                          <option value="Weather Delay">Rain / Bad Weather</option>
                          <option value="Preparation Delay">Food Prep Delay</option>
                        </select>
                      </label>
                    </div>
                    <div className="delay-form-actions">
                      <button className="btn-confirm-delay" onClick={() => handleReportDelay(req.id)}>
                        Send WebSocket Delay Alert
                      </button>
                      <button className="btn-cancel-delay" onClick={() => setDelayInputId(null)}>
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
