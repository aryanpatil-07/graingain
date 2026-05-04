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
    }, 30);

    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  // Translate from left: 0% (off-screen left) to 100% (off-screen right)
  const pct = Math.max(0, Math.min(1, progress));

  return (
    <div className="scroll-truck-container" aria-hidden="true">
      <div
        className="scroll-truck"
        style={{
          left: `${pct * 100}%`,
          transform: `translateX(-50%)`
        }}
      >
        <div className="truck-icon" />
      </div>
      <div className="scroll-progress-indicator">
        {Math.round(pct * 100)}%
      </div>
    </div>
  );
}
