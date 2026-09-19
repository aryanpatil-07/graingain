import React, { useState, useEffect } from 'react';
import throttle from 'lodash.throttle';
import '../styles/truck.css';

export function ScrollTruck() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const handleScroll = throttle(() => {
      const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
      const scrolled = window.scrollY;
      const newProgress = scrollHeight > 0 ? Math.min(1, scrolled / scrollHeight) : 0;
      setProgress(newProgress);
    }, 25);

    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const pct = Math.max(0, Math.min(1, progress));

  return (
    <div className="scroll-truck-container" aria-hidden="true">
      <div className="scroll-truck-track">
        <div
          className="scroll-truck-scooter"
          style={{
            left: `${pct * 100}%`,
            transform: `translateX(-50%)`
          }}
        >
          <div className="scooter-visual">
            <span className="scooter-emoji">🛵</span>
          </div>
        </div>
      </div>
      <div className="scroll-progress-badge">
        <span className="progress-dot"></span>
        {Math.round(pct * 100)}%
      </div>
    </div>
  );
}
