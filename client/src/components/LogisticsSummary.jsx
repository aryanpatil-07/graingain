import React from 'react';
import '../styles/summary.css';

export function LogisticsSummary({
  centre,
  distanceKm,
  etaMinutes,
  foodType,
  expiryHours,
  urgency,
  onRequestPickup
}) {
  if (!centre) {
    return (
      <div className="logistics-editorial-box empty-state-box">
        <span className="empty-box-icon">📍</span>
        <h4>No NGO Selected Yet</h4>
        <p>Click any partner marker on the interactive map above to calculate route and dispatch.</p>
      </div>
    );
  }

  const urgencyClass = (urgency || 'MEDIUM').toLowerCase();

  return (
    <div className="logistics-editorial-box">
      <div className="summary-editorial-header">
        <div>
          <span className="summary-kicker">DISPATCH LOGISTICS READY</span>
          <h3 className="summary-title">Surplus Routing Summary</h3>
        </div>
        <span className={`urgency-pill urgency-${urgencyClass}`}>
          {urgency} URGENCY
        </span>
      </div>

      <div className="summary-metrics-grid">
        <div className="metric-tile">
          <span className="metric-tile-label">Food Classification</span>
          <span className="metric-tile-val">{foodType}</span>
        </div>

        <div className="metric-tile">
          <span className="metric-tile-label">Safe Shelf Life</span>
          <span className="metric-tile-val">{expiryHours ? expiryHours.toFixed(1) : '4.0'} hrs</span>
        </div>

        <div className="metric-tile metric-tile-ngo">
          <span className="metric-tile-label">Designated Partner</span>
          <span className="metric-tile-val highlight">{centre.name}</span>
        </div>

        <div className="metric-tile">
          <span className="metric-tile-label">Route Distance</span>
          <span className="metric-tile-val">{distanceKm ? distanceKm.toFixed(1) : '0.0'} km</span>
        </div>

        <div className="metric-tile">
          <span className="metric-tile-label">Estimated Transit Time</span>
          <span className="metric-tile-val eta-val">{etaMinutes} mins</span>
        </div>

        <div className="metric-tile">
          <span className="metric-tile-label">Shelter Intake Capacity</span>
          <span className="metric-tile-val">{centre.capacity || 100} meals</span>
        </div>
      </div>

      <div className="summary-contact-card">
        <div className="contact-icon">🏢</div>
        <div className="contact-info">
          <strong>{centre.name}</strong>
          <span>{centre.address}</span>
          <span className="contact-phone">📞 {centre.phone}</span>
        </div>
      </div>

      <div className="summary-actions-bar">
        <button
          type="button"
          className="btn-editorial-dispatch"
          onClick={onRequestPickup}
        >
          ⚡ Dispatch Real-Time Pickup Request
        </button>
      </div>

      <div className="summary-guarantee-note">
        <span>🛡️</span>
        <span>
          <strong>Direct NGO Hand-off:</strong> Matches your surplus food to {centre.name} with live GPS and delay alerts via WebSockets.
        </span>
      </div>
    </div>
  );
}
