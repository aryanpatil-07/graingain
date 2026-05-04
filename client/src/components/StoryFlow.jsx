import React from 'react';
import '../styles/storyflow.css';

const steps = [
  { title: 'Describe', desc: 'Tell us about the surplus — quantity, type, and time.' },
  { title: 'Analyze', desc: 'AI estimates safety, shelf life and urgency.' },
  { title: 'Connect', desc: 'Match surplus to nearby NGO partners.' },
  { title: 'Deliver', desc: 'Schedule pickup and ensure safe routing.' }
];

export default function StoryFlow() {
  return (
    <section className="section section-flow full-screen-section reveal-on-scroll">
      <div className="section-heading-row">
        <h2>From Waste to Value</h2>
      </div>

      <div className="flow-row">
        {steps.map((s, i) => (
          <div className="flow-step" key={s.title} style={{ '--i': i }}>
            <div className="step-index">{`0${i + 1}`}</div>
            <h3 className="step-title">{s.title}</h3>
            <p className="step-desc">{s.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
