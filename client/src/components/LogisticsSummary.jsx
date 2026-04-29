import React from 'react';
import '../styles/summary.css';

export function LogisticsSummary({
  centre,
  distanceKm,
  etaMinutes,
  foodType,
  expiryHours,
  urgency,
  onDonate,
  onRequestPickup
}) {
  if (!centre) {
    return <div className="logistics-summary empty">Select a donation centre to see logistics...</div>;
  }

  const urgencyColor = {
    HIGH: '#d32f2f',
    MEDIUM: '#f57c00',
    LOW: '#388e3c'
  }[urgency] || '#757575';

  return (
    <div className="logistics-summary">
      <div className="summary-header">
        <h3>📦 Donation Summary</h3>
        <div className="urgency-badge" style={{ backgroundColor: urgencyColor }}>
          {urgency}
        </div>
      </div>

      <div className="summary-grid">
        <div className="summary-item">
          <span className="label">🍛 Food Type</span>
          <span className="value">{foodType}</span>
        </div>
        <div className="summary-item">
          <span className="label">⏱ Expires In</span>
          <span className="value">{expiryHours.toFixed(1)} hours</span>
        </div>
        <div className="summary-item">
          <span className="label">📍 Nearest Centre</span>
          <span className="value">{centre.name}</span>
        </div>
        <div className="summary-item">
          <span className="label">📏 Distance</span>
          <span className="value">{distanceKm.toFixed(1)} km</span>
        </div>
        <div className="summary-item">
          <span className="label">🚚 Pickup ETA</span>
          <span className="value">{etaMinutes} minutes</span>
        </div>
        <div className="summary-item">
          <span className="label">🍽 Capacity</span>
          <span className="value">{centre.capacity} meals</span>
        </div>
      </div>

      <div className="summary-contact">
        <p>
          <strong>{centre.name}</strong>
          <br />
          📍 {centre.address}
          <br />
          📞 {centre.phone}
        </p>
      </div>

      <div className="summary-actions">
        <button className="btn btn-primary" onClick={onDonate}>
          ✨ Confirm Donation
        </button>
        <button className="btn btn-secondary" onClick={onRequestPickup}>
          🚚 Request Pickup
        </button>
      </div>

      <div className="summary-impact">
        <p>
          <strong>Your donation will feed {centre.capacity} people today.</strong>
          <br />
          <span style={{ fontSize: '12px', color: '#555' }}>
            A warm meal reaches someone who needed it.
          </span>
        </p>
      </div>
    </div>
  );
}
