import React, { useEffect, useRef } from 'react';
import {
  animateHeroEntrance,
  animateBadgeRotation,
  animateFloatingElements
} from '../services/animations';
import heroCourierImg from '../assets/hero_courier.jpg';
import flyingCourierImg from '../assets/flying_courier.jpg';
import pizzaPlateImg from '../assets/pizza_plate.jpg';
import userAvatarsImg from '../assets/user_avatars.jpg';
import '../styles/hero.css';

export default function HeroSection({ onSearchClick, onFindRestaurantClick }) {
  const heroRef = useRef(null);

  useEffect(() => {
    // Initialize hero entrance animation with anime.js
    animateHeroEntrance();
    // Continuous rotation for circular badge
    animateBadgeRotation('.hero-badge-svg-text');
    // Micro-floating for flying courier
    animateFloatingElements();
  }, []);

  const handleScrollDown = (e) => {
    e.preventDefault();
    const target = document.getElementById('step-1-section') || document.querySelector('.section-input');
    if (target) {
      target.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section className="hero-editorial-section" ref={heroRef} id="home">
      {/* Central Light Sage Runner / Stripe */}
      <div className="hero-center-stripe" aria-hidden="true">
        <div className="hero-center-rings">
          <span className="ring ring-1"></span>
          <span className="ring ring-2"></span>
          <span className="ring ring-3"></span>
        </div>
      </div>

      <div className="hero-grid-container">
        {/* Left Column */}
        <div className="hero-col hero-col-left">
          {/* Circular Emblem Badge with Rotating Text */}
          <div className="hero-badge-wrap">
            <div className="hero-badge-circle">
              <img
                src={pizzaPlateImg}
                alt="Fresh artisan meal"
                className="hero-badge-img"
              />
              <svg className="hero-badge-svg-text" viewBox="0 0 100 100">
                <path
                  id="circlePath"
                  d="M 50, 50 m -37, 0 a 37,37 0 1,1 74,0 a 37,37 0 1,1 -74,0"
                  fill="none"
                />
                <text>
                  <textPath href="#circlePath" startOffset="0%">
                    FOOD RESCUE SERVICE • GRAINGAIN • QUICK DISPATCH •
                  </textPath>
                </text>
              </svg>
            </div>
          </div>

          {/* Scroll Down Indicator */}
          <a href="#step-1-section" onClick={handleScrollDown} className="hero-scroll-down-link">
            <span className="scroll-text">Scroll Down</span>
            <span className="scroll-arrow">↓</span>
          </a>

          {/* Punchy Text Copy */}
          <div className="hero-copy-block">
            <p className="hero-lead-text">
              When you have food surplus to share,
              <br />
              We are here for you.
            </p>
            <p className="hero-priority-text">
              Quick Service is our priority.
            </p>
            <button
              type="button"
              className="hero-link-btn"
              onClick={onFindRestaurantClick || handleScrollDown}
            >
              Find Restaurant / NGO Partners
            </button>
          </div>

          {/* Customer Reviews & Social Proof Stack */}
          <div className="hero-social-proof">
            <div className="hero-avatar-stack">
              <img
                src={userAvatarsImg}
                alt="Happy donors and recipients"
                className="hero-avatar-cluster"
              />
            </div>
            <div className="hero-review-meta">
              <strong className="review-count">12k+</strong>
              <span className="review-label">Customer Review</span>
            </div>
          </div>
        </div>

        {/* Center Column: Big Title, Search Pill, and Hero Courier Scooter */}
        <div className="hero-col hero-col-center">
          <div className="hero-title-group">
            <h1 className="hero-headline">
              Fastest Delivery
              <span className="hero-headline-sub">Easy Pickup</span>
            </h1>

            {/* Dark Search / Dispatch Pill */}
            <div className="hero-search-pill-wrapper">
              <button
                type="button"
                className="hero-search-pill"
                onClick={onSearchClick || handleScrollDown}
                aria-label="Find restaurant or food surplus"
              >
                <span className="pill-search-icon">🔍</span>
                <span className="pill-divider">|</span>
                <span className="pill-text">Find Restaurant / Food Surplus</span>
              </button>
            </div>
          </div>

          {/* Center Scooter Courier Image */}
          <div className="hero-courier-visual-wrap">
            <img
              src={heroCourierImg}
              alt="Fast delivery courier riding scooter with fresh meals"
              className="hero-scooter-courier"
            />
          </div>
        </div>

        {/* Right Column: Flying Courier, Ribbon Banner, and Editorial Stats */}
        <div className="hero-col hero-col-right">
          {/* Flying superhero courier illustration */}
          <div className="hero-flying-wrap">
            <img
              src={flyingCourierImg}
              alt="Fast courier in action"
              className="hero-flying-courier"
            />
          </div>

          {/* Curved Ribbon Banner */}
          <div className="hero-curved-ribbon">
            <svg viewBox="0 0 320 60" className="ribbon-svg" preserveAspectRatio="none">
              <path
                d="M 10,40 Q 80,10 160,25 Q 240,40 310,15 L 305,50 Q 240,65 160,50 Q 80,35 15,55 Z"
                fill="#18181B"
              />
            </svg>
            <span className="ribbon-text">Food Ordering & Rescue in your city</span>
          </div>

          {/* Editorial Big Stat Numbers */}
          <div className="hero-stat-stack">
            <div className="hero-stat-item">
              <h2 className="stat-number">2500+</h2>
              <p className="stat-label">Successful Delivery</p>
            </div>

            <div className="hero-stat-item">
              <h2 className="stat-number">1800+</h2>
              <p className="stat-label">Happy Customer</p>
            </div>

            <div className="hero-stat-item">
              <h2 className="stat-number">1200+</h2>
              <p className="stat-label">Client's Review</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
