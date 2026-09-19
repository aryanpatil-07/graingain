import React from 'react';
import '../styles/storyflow.css';

const steps = [
  {
    num: '01',
    title: 'Describe Surplus',
    desc: 'Input food surplus details — quantity, prepared time, and diet classification.'
  },
  {
    num: '02',
    title: 'AI Analysis',
    desc: 'Instant algorithm evaluation of shelf life, food safety margins, and dispatch urgency.'
  },
  {
    num: '03',
    title: 'Match Nearby NGO',
    desc: 'Direct spatial matching to nearby verified shelters, NGOs, and food banks.'
  },
  {
    num: '04',
    title: 'Real-Time Dispatch',
    desc: 'Live 2-way WebSockets status tracking from pickup to delivery confirmation.'
  }
];

export default function StoryFlow() {
  return (
    <section className="section section-flow editorial-card reveal-on-scroll" id="about">
      <div className="section-header-editorial">
        <div>
          <span className="section-kicker">HOW GRAINGAIN OPERATES</span>
          <h2 className="section-title">From Excess to Nourishment</h2>
        </div>
        <span className="editorial-chip-badge">4 Simple Steps</span>
      </div>

      <p className="section-subtext">
        Our automated pipeline connects surplus food to the right recipients within minutes.
      </p>

      <div className="flow-grid">
        {steps.map((s, i) => (
          <div className="flow-card stagger-item" key={s.title}>
            <div className="flow-step-num">{s.num}</div>
            <h3 className="flow-card-title">{s.title}</h3>
            <p className="flow-card-desc">{s.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
