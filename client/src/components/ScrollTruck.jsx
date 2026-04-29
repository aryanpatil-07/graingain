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
    }, 50); // Throttle to 50ms intervals

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const translateX = progress * (window.innerWidth - 60); // 60px for truck width

  return (
    <div className="scroll-truck-container" aria-hidden="true">
      <div
        className="scroll-truck"
        style={{
          transform: `translateX(${translateX}px)`,
          transition: 'transform 0.1s linear'
        }}
      >
        🚚
      </div>
      <div className="scroll-progress-indicator">
        {Math.round(progress * 100)}%
      </div>
    </div>
  );
}
