import React from 'react';

// Интерфейс для статусов (цвет индикатора)
interface Statuses {
  tires: string;
  lights: string;
  oil: string;
  damage: string;
}

// Интерфейс для детальной информации (текст подсказки)
interface Details {
  tires?: string;
  lights?: string;
  oil?: string;
  damage?: string;
}

// Функция для определения цвета статуса
const getStatusColor = (status: string, fallbackColor = 'hsl(var(--neutral))') => {
  switch (status?.toLowerCase()) {
    case 'ok': return 'hsl(var(--su))';      // success (e.g., green)
    case 'warning': return 'hsl(var(--wa))'; // warning (e.g., yellow)
    case 'error': return 'hsl(var(--er))';   // error (e.g., red)
    default: return fallbackColor;
  }
};

const VanVisual: React.FC<{ statuses: Statuses; details?: Details }> = ({ statuses, details = {} }) => {
  const isDamage = statuses.damage?.toLowerCase() !== 'ok';
  const strokeColor = 'hsl(var(--neutral-content) / 0.3)';

  return (
    // @ts-ignore to suppress potential SVG attribute type errors
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 720 240" className="w-full h-auto text-neutral-content">
      <defs>
        <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="1.5" dy="1.5" stdDeviation="2.5" floodColor="hsl(var(--neutral) / 0.1)" />
        </filter>
        <linearGradient id="bodyGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style={{ stopColor: 'hsl(var(--base-100))', stopOpacity: 1 }} />
          <stop offset="100%" style={{ stopColor: 'hsl(var(--base-200))', stopOpacity: 1 }} />
        </linearGradient>
        <linearGradient id="highlightGradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" style={{ stopColor: 'hsl(var(--base-100))', stopOpacity: 0.8 }} />
          <stop offset="100%" style={{ stopColor: 'hsl(var(--base-300))', stopOpacity: 0.6 }} />
        </linearGradient>
      </defs>

      <style>
        {`
          .interactive:hover {
            transform: scale(1.15);
            transition: transform 0.2s ease-in-out;
          }
          .tooltip:hover {
            cursor: pointer;
          }
        `}
      </style>

      {/* --- Top View --- */}
      <g transform="translate(10, 10)">
        <text x="0" y="12" className="text-sm font-sans" fill="hsl(var(--neutral-content) / 0.7)" opacity="0.6">Top View</text>
        <g transform="translate(0, 24) scale(1.2)" filter="url(#shadow)">
          <rect x="1" y="1" width="178" height="98" rx="14" fill="url(#bodyGradient)" stroke={strokeColor} strokeWidth="1.2" />
          <path d="M100 1 H173 a6 6 0 0 1 6 6 V 44 a6 6 0 0 1 -6 6 H100 Z" fill="url(#highlightGradient)" />
          <g className="tooltip interactive" data-tip={`Oil Status${details.oil ? `: ${details.oil}` : ''}`}>
            <path d="M30 1 H100 V49 H30 a6 6 0 0 1 -6 -6 V 6 a6 6 0 0 1 6-6z" fill={getStatusColor(statuses.oil)} opacity="0.6" />
          </g>
          {isDamage && (
            <g className="tooltip interactive" data-tip={`Damage Status${details.damage ? `: ${details.damage}` : ''}`}>
              <path d="M60 25 L120 75 M120 25 L60 75" stroke={getStatusColor(statuses.damage)} strokeWidth="3" strokeLinecap="round" opacity="0.8" />
            </g>
          )}
          <rect x="1" y="1" width="178" height="88" rx="12" fill="none" stroke="hsl(var(--neutral-content) / 0.1)" strokeWidth="1.2" />
          <g className="tooltip interactive" data-tip={`Tires Status${details.tires ? `: ${details.tires}` : ''}`}>
            <rect x="20" y="-8" width="48" height="22" rx="6" fill="url(#highlightGradient)" stroke={getStatusColor(statuses.tires)} strokeWidth="1.8" />
            <rect x="120" y="-8" width="48" height="22" rx="6" fill="url(#highlightGradient)" stroke={getStatusColor(statuses.tires)} strokeWidth="1.8" />
            <rect x="20" y="80" width="48" height="22" rx="6" fill="url(#highlightGradient)" stroke={getStatusColor(statuses.tires)} strokeWidth="1.8" />
            <rect x="120" y="80" width="48" height="22" rx="6" fill="url(#highlightGradient)" stroke={getStatusColor(statuses.tires)} strokeWidth="1.8" />
          </g>
        </g>
      </g>

      {/* --- Side View --- */}
      <g transform="translate(250, 10)">
        <text x="0" y="12" className="text-sm font-sans" fill="hsl(var(--neutral-content) / 0.7)" opacity="0.6">Side View</text>
        <g transform="translate(0, 24) scale(1.2)" filter="url(#shadow)">
          <path d="M10 85 V 40 C 10 30, 18 20, 28 20 H 100 L 120 0 H 165 C 175 0, 183 8, 183 18 V 75 L 170 85 Z" fill="url(#bodyGradient)" stroke={strokeColor} strokeWidth="1.2" />
          <path d="M10 85 V 40 C 10 30, 18 20, 28 20 H 90 V 85 Z" fill="url(#highlightGradient)" />
          <path d="M95 20 H 115 L 125 45 H 95 Z" fill="hsl(var(--base-300) / 0.5)" />
          {isDamage && (
            <g className="tooltip interactive" data-tip={`Damage Status${details.damage ? `: ${details.damage}` : ''}`}>
              <path d="M80 50 C 90 40, 100 60, 110 50" stroke={getStatusColor(statuses.damage)} strokeWidth="2.4" fill="none" strokeLinecap="round" strokeDasharray="4 4" />
            </g>
          )}
          <g className="tooltip interactive" data-tip={`Tires Status${details.tires ? `: ${details.tires}` : ''}`}>
            <circle cx="45" cy="85" r="19" fill="url(#highlightGradient)" stroke={getStatusColor(statuses.tires)} strokeWidth="2.4" />
            <circle cx="150" cy="85" r="19" fill="url(#highlightGradient)" stroke={getStatusColor(statuses.tires)} strokeWidth="2.4" />
          </g>
          <g className="tooltip interactive" data-tip={`Lights Status${details.lights ? `: ${details.lights}` : ''}`}>
            <rect x="180" y="25" width="6" height="12" rx="2.4" fill={getStatusColor(statuses.lights, 'transparent')} />
            <rect x="175" y="65" width="12" height="6" rx="2.4" fill={getStatusColor(statuses.lights, 'transparent')} />
          </g>
        </g>
      </g>

      {/* --- Front View --- */}
      <g transform="translate(490, 10)">
        <text x="0" y="12" className="text-sm font-sans" fill="hsl(var(--neutral-content) / 0.7)" opacity="0.6">Front View</text>
        <g transform="translate(25, 24) scale(1.2)" filter="url(#shadow)">
          <path d="M5 90 V 20 C 5 10 15 0 25 0 H 125 C 135 0 145 10 145 20 V 90 Z" fill="url(#bodyGradient)" stroke={strokeColor} strokeWidth="1.2" />
          <path d="M20 0 H 130 L 115 40 H 35 Z" fill="url(#highlightGradient)" />
          <g className="tooltip interactive" data-tip={`Oil Status${details.oil ? `: ${details.oil}` : ''}`}>
            <rect x="40" y="50" width="84" height="30" rx="3.6" fill={getStatusColor(statuses.oil)} opacity="0.6" />
          </g>
          <g className="tooltip interactive" data-tip={`Lights Status${details.lights ? `: ${details.lights}` : ''}`}>
            <rect x="15" y="50" width="24" height="9.6" rx="2.4" fill={getStatusColor(statuses.lights)} />
            <rect x="115" y="50" width="24" height="9.6" rx="2.4" fill={getStatusColor(statuses.lights)} />
          </g>
          {isDamage && (
            <g className="tooltip interactive" data-tip={`Damage Status${details.damage ? `: ${details.damage}` : ''}`}>
              <circle cx="75" cy="45" r="12" fill="none" stroke={getStatusColor(statuses.damage)} strokeWidth="2.4" opacity="0.9" />
            </g>
          )}
        </g>
      </g>
    </svg>
  );
};

export default VanVisual;