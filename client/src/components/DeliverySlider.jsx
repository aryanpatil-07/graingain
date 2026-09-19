import React from 'react';
import '../styles/slider.css';

export function DeliverySlider({ value, onChange, min = 0, max = 24, step = 1 }) {
  const percent = ((value - min) / (max - min)) * 100;

  return (
    <div className="editorial-slider-box">
      <div className="slider-header-row">
        <div>
          <h4 className="slider-heading">Pickup Schedule Window</h4>
          <p className="slider-hint">Slide to adjust buffer time before driver dispatch</p>
        </div>
        <div className="slider-value-pill">
          {value} {value === 1 ? 'hour' : 'hours'}
        </div>
      </div>

      <div className="slider-wrapper">
        <input
          id="delivery-slider"
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="slider-input-clean"
          style={{
            background: `linear-gradient(to right, #166534 0%, #166534 ${percent}%, #e2ece5 ${percent}%, #e2ece5 100%)`
          }}
          aria-label="Select delivery timing in hours"
        />
      </div>

      <div className="slider-ticks-clean">
        <span>Immediate (Now)</span>
        <span>+12 Hours</span>
        <span>+24 Hours Max</span>
      </div>
    </div>
  );
}
