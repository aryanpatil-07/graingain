import React, { useEffect, useState } from 'react';
import { animate } from 'animejs';
import '../styles/impact.css';

export default function ImpactSection({ totals }) {
  const [counts, setCounts] = useState({ waste: 0, meals: 0, methane: 0 });

  useEffect(() => {
    // Animate numbers smoothly using Anime.js
    const obj = {
      waste: counts.waste,
      meals: counts.meals,
      methane: counts.methane
    };

    try {
      animate(obj, {
        waste: Math.round(totals.totalWaste || 0),
        meals: Math.round(totals.totalSurplusMeals || 0),
        methane: Math.round(totals.totalMethaneRisk || 0),
        duration: 900,
        ease: 'outCubic',
        round: 1,
        onUpdate: () => {
          setCounts({
            waste: Math.round(obj.waste),
            meals: Math.round(obj.meals),
            methane: Math.round(obj.methane)
          });
        }
      });
    } catch (e) {
      setCounts({
        waste: Math.round(totals.totalWaste || 0),
        meals: Math.round(totals.totalSurplusMeals || 0),
        methane: Math.round(totals.totalMethaneRisk || 0)
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [totals.totalWaste, totals.totalSurplusMeals, totals.totalMethaneRisk]);

  return (
    <section className="section section-impact editorial-card reveal-on-scroll" id="impact">
      <div className="section-header-editorial">
        <div>
          <span className="section-kicker">REAL-TIME IMPACT METRICS</span>
          <h2 className="section-title">Impact Snapshot</h2>
        </div>
        <span className="editorial-chip-badge">Live simulation</span>
      </div>

      <p className="section-subtext">
        Immediate environmental and social benefits estimated across our food rescue network.
      </p>

      <div className="kpi-row">
        <div className="kpi-card stagger-item">
          <div className="kpi-icon-pill">🥗</div>
          <div className="kpi-value">{counts.waste} <span className="kpi-unit">kg</span></div>
          <div className="kpi-label">Estimated Waste Diverted / Day</div>
        </div>

        <div className="kpi-card kpi-card-featured stagger-item">
          <div className="kpi-icon-pill">🍲</div>
          <div className="kpi-value">{counts.meals} <span className="kpi-unit">meals</span></div>
          <div className="kpi-label">Predicted Surplus Meals Rescued</div>
        </div>

        <div className="kpi-card stagger-item">
          <div className="kpi-icon-pill">🌱</div>
          <div className="kpi-value">{counts.methane} <span className="kpi-unit">kg CO₂e</span></div>
          <div className="kpi-label">Methane Emissions Prevented</div>
        </div>
      </div>
    </section>
  );
}
