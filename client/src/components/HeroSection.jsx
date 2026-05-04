import React from 'react';
import '../styles/hero.css';

export default function HeroSection() {
  return (
    <section className="hero-section full-screen-section">
      <div className="hero-inner">
        <div className="hero-copy reveal-on-scroll">
          <h1 className="hero-title">Turn Food Waste into Impact</h1>
          <p className="hero-sub">AI-powered surplus intelligence connecting food to those who need it most</p>
        </div>
      </div>
    </section>
  );
}
