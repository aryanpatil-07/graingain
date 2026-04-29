import React from 'react';
import '../styles/slider.css';

export function DeliverySlider({ value, onChange, min = 0, max = 24, step = 1 }) {
  return (
    <div className="delivery-slider-container">
      <label htmlFor="delivery-slider" className="slider-label">
        ⏱ Delivery Timing
      </label>
      <div className="slider-wrapper">
        <input
          id="delivery-slider"
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="slider-input"
          aria-label="Select delivery timing in hours"
        />
        <div className="slider-value">
          {value} {value === 1 ? 'hour' : 'hours'}
        </div>
      </div>
      <div className="slider-ticks">
        <span>Now</span>
        <span>12h</span>
        <span>24h</span>
      </div>
    </div>
  );
}
