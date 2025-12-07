// src/components/KpiCard.jsx
import React from 'react';
import './KpiCard.css';

function KpiCard({ title, value, subtitle, trendText, trendType = 'neutral' }) {
  let trendClass = 'kpi-trend-neutral';
  if (trendType === 'up') trendClass = 'kpi-trend-up';
  if (trendType === 'down') trendClass = 'kpi-trend-down';

  return (
    <div className="kpi-card">
      <div className="kpi-header">
        <h3 className="kpi-title">{title}</h3>
      </div>

      <div className="kpi-main">
        <span className="kpi-value">
          {value?.toLocaleString?.() ?? value ?? '-'}
        </span>
        {subtitle && <span className="kpi-subtitle">{subtitle}</span>}
      </div>

      {trendText && (
        <div className={`kpi-trend ${trendClass}`}>
          {trendText}
        </div>
      )}
    </div>
  );
}

export default KpiCard;
