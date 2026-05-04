import React, { useEffect, useState } from 'react';
import '../styles/impact.css';

export default function ImpactSection({ totals }) {
  const [counts, setCounts] = useState({ waste: 0, meals: 0, methane: 0 });

  useEffect(() => {
    let raf;
    const duration = 900;
    const start = performance.now();
    const from = { waste: counts.waste, meals: counts.meals, methane: counts.methane };
    const to = {
      waste: Math.round(totals.totalWaste),
      meals: Math.round(totals.totalSurplusMeals),
      methane: Math.round(totals.totalMethaneRisk)
    };

    const tick = (now) => {
      const t = Math.min(1, (now - start) / duration);
      setCounts({
        waste: Math.round(from.waste + (to.waste - from.waste) * t),
        meals: Math.round(from.meals + (to.meals - from.meals) * t),
        methane: Math.round(from.methane + (to.methane - from.methane) * t)
      });
      if (t < 1) raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [totals.totalWaste, totals.totalSurplusMeals, totals.totalMethaneRisk]);

  return (
    <section className="section section-impact full-screen-section reveal-on-scroll">
      <div className="section-heading-row">
        <h2>Impact Snapshot</h2>
        <span className="data-chip">Live simulation</span>
      </div>

      <p className="section-subtext">Immediate environmental and social benefits estimated across the network.</p>

      <div className="kpi-row">
        <div className="kpi-card">
          <div className="kpi-value">{counts.waste} kg</div>
          <div className="kpi-label">Estimated waste / day</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-value">{counts.meals}</div>
          <div className="kpi-label">Predicted surplus meals</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-value">{counts.methane} kg CO₂e</div>
          <div className="kpi-label">Methane risk</div>
        </div>
      </div>
    </section>
  );
}
