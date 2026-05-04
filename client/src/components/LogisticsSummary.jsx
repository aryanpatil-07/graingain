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
    return <div className="logistics-summary empty">Select an NGO to see logistics...</div>;
  }

  const urgencyColor = {
    HIGH: '#d32f2f',
    MEDIUM: '#f57c00',
    LOW: '#388e3c'
  }[urgency] || '#757575';

  return (
    <div className="logistics-summary">
      <div className="summary-header">
        <h3>NGO Surplus Request Summary</h3>
        <div className="urgency-badge" style={{ backgroundColor: urgencyColor }}>
          {urgency}
        </div>
      </div>

      <div className="summary-grid">
        <div className="summary-item">
          <span className="label">Food Type</span>
          <span className="value">{foodType}</span>
        </div>
        <div className="summary-item">
          <span className="label">Expires In</span>
          <span className="value">{expiryHours.toFixed(1)} hours</span>
        </div>
        <div className="summary-item">
          <span className="label">Selected NGO</span>
          <span className="value">{centre.name}</span>
        </div>
        <div className="summary-item">
          <span className="label">Distance</span>
          <span className="value">{distanceKm.toFixed(1)} km</span>
        </div>
        <div className="summary-item">
          <span className="label">Pickup ETA</span>
          <span className="value">{etaMinutes} minutes</span>
        </div>
        <div className="summary-item">
          <span className="label">Capacity</span>
          <span className="value">{centre.capacity} meals</span>
        </div>
      </div>

      <div className="summary-contact">
        <p>
          <strong>{centre.name}</strong>
          <br />
          {centre.address}
          <br />
          {centre.phone}
        </p>
      </div>

      <div className="summary-actions">
        <button className="btn btn-primary" onClick={onRequestPickup}>
          Request Surplus Food
        </button>
      </div>

      <div className="summary-impact">
        <p>
          <strong>This NGO can request surplus food from {centre.capacity} nearby meal-capacity units today.</strong>
          <br />
          <span style={{ fontSize: '12px', color: '#a6b8d8' }}>
            The goal is faster surplus routing from restaurants to NGO partners.
          </span>
        </p>
      </div>
    </div>
  );
}
