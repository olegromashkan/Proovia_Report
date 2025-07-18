import React from 'react';

// Интерфейсы
interface TireStatuses {
  front_left?: string;
  front_right?: string;
  rear_left?: string;
  rear_right?: string;
}

interface Statuses {
  tires: string | TireStatuses;
  lights: string;
  oil: string;
  damage: string;
}

interface Details {
  tires?: string | TireStatuses;
  lights?: string;
  oil?: string;
  damage?: string;
}

// Функция для определения цвета статуса
const getStatusColor = (status: string, fallbackColor = 'hsl(var(--neutral))') => {
  switch (status?.toLowerCase()) {
    case 'ok': return 'hsl(var(--su))'; // Зеленый
    case 'warning': return 'hsl(var(--wa))'; // Желтый
    case 'error': return 'hsl(var(--er))'; // Красный
    default: return fallbackColor;
  }
};

const VanVisual: React.FC<{ statuses: Statuses; details?: Details }> = ({ statuses, details = {} }) => {
  const isDamage = statuses.damage?.toLowerCase() !== 'ok';
  const strokeColor = 'hsl(var(--neutral-content) / 0.3)';

  const tireStatus = (pos: keyof TireStatuses) =>
    typeof statuses.tires === 'object' ? statuses.tires[pos] || '' : statuses.tires;
  const tireDetail = (pos: keyof TireStatuses) =>
    typeof details.tires === 'object' ? details.tires[pos] : details.tires;

  const tiresTip =
    typeof details.tires === 'object'
      ? `FL: ${details.tires.front_left ?? '-'}, FR: ${details.tires.front_right ?? '-'}, RL: ${details.tires.rear_left ?? '-'}, RR: ${details.tires.rear_right ?? '-'}`
      : details.tires;

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 600 200"
      className="w-full h-auto text-neutral-content max-w-md mx-auto"
    >
      <defs>
        <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="1" dy="1" stdDeviation="2" floodColor="hsl(var(--neutral) / 0.15)" />
        </filter>
        <linearGradient id="bodyGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style={{ stopColor: 'hsl(var(--base-100))', stopOpacity: 1 }} />
          <stop offset="100%" style={{ stopColor: 'hsl(var(--base-200))', stopOpacity: 1 }} />
        </linearGradient>
        <linearGradient id="highlightGradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" style={{ stopColor: 'hsl(var(--base-100))', stopOpacity: 0.9 }} />
          <stop offset="100%" style={{ stopColor: 'hsl(var(--base-300))', stopOpacity: 0.7 }} />
        </linearGradient>
      </defs>

      <style>
        {`
          .interactive:hover {
            transform: scale(1.1);
            transition: transform 0.2s ease-in-out, opacity 0.2s ease-in-out;
          }
          .tooltip:hover {
            cursor: pointer;
            opacity: 0.9;
          }
          .tooltip::after {
            font-family: 'Inter', sans-serif;
            font-size: 12px;
            padding: 4px 8px;
            border-radius: 4px;
            background: hsl(var(--neutral) / 0.9);
            color: hsl(var(--neutral-content));
          }
        `}
      </style>

      {/* --- Top View --- */}
      <g transform="translate(10, 10)">
        <text x="0" y="10" className="text-xs font-sans" fill="hsl(var(--neutral-content) / 0.7)" opacity="0.8">
          Top View
        </text>
        <g transform="translate(0, 20) scale(1.1)" filter="url(#shadow)">
          <rect x="0" y="0" width="160" height="80" rx="10" fill="urlвідомости(#bodyGradient)" stroke={strokeColor} strokeWidth="1" />
          <path d="M90 0 H150 a5 5 0 0 1 5 5 V 35 a5 5 0 0 1 -5 5 H90 Z" fill="url(#highlightGradient)" />
          <g className="tooltip interactive" data-tip={`Oil: ${details.oil || 'N/A'}`}>
            <path d="M20 0 H90 V40 H20 a5 5 0 0 1 -5 -5 V 5 a5 5 0 0 1 5-5z" fill={getStatusColor(statuses.oil)} opacity="0.7" />
          </g>
          {isDamage && (
            <g className="tooltip interactive" data-tip={`Damage: ${details.damage || 'N/A'}`}>
              <path d="M50 20 L110 60 M110 20 L50 60" stroke={getStatusColor(statuses.damage)} strokeWidth="2.5" strokeLinecap="round" opacity="0.9" />
            </g>
          )}
          <g className="tooltip interactive" data-tip={tiresTip || 'Tires: N/A'}>
            <rect x="15" y="-6" width="40" height="18" rx="5" fill="url(#highlightGradient)" stroke={getStatusColor(tireStatus('front_left'))} strokeWidth="1.5" />
            <rect x="110" y="-6" width="40" height="18" rx="5" fill="url(#highlightGradient)" stroke={getStatusColor(tireStatus('front_right'))} strokeWidth="1.5" />
            <rect x="15" y="68" width="40" height="18" rx="5" fill="url(#highlightGradient)" stroke={getStatusColor(tireStatus('rear_left'))} strokeWidth="1.5" />
            <rect x="110" y="68" width="40" height="18" rx="5" fill="url(#highlightGradient)" stroke={getStatusColor(tireStatus('rear_right'))} strokeWidth="1.5" />
          </g>
        </g>
      </g>

      {/* --- Side View --- */}
      <g transform="translate(200, 10)">
        <text x="0" y="10" className="text-xs font-sans" fill="hsl(var(--neutral-content) / 0.7)" opacity="0.8">
          Side View
        </text>
        <g transform="translate(0, 20) scale(1.1)" filter="url(#shadow)">
          <path d="M5 75 V 35 C 5 27, 12 20, 20 20 H 90 L 105 5 H 145 C 153 5, 160 12, 160 20 V 70 L 150 75 Z" fill="url(#bodyGradient)" stroke={strokeColor} strokeWidth="1" />
          <path d="M5 75 V 35 C 5 27, 12 20, 20 20 H 80 V 75 Z" fill="url(#highlightGradient)" />
          <path d="M85 20 H 100 L 110 40 H 85 Z" fill="hsl(var(--base-300) / 0.5)" />
          {isDamage && (
            <g className="tooltip interactive" data-tip={`Damage: ${details.damage || 'N/A'}`}>
              <path d="M70 45 C 80 35, 90 55, 100 45" stroke={getStatusColor(statuses.damage)} strokeWidth="2" fill="none" strokeLinecap="round" strokeDasharray="3 3" />
            </g>
          )}
          <g className="tooltip interactive" data-tip={tiresTip || 'Tires: N/A'}>
            <circle cx="40" cy="75" r="15" fill="url(#highlightGradient)" stroke={getStatusColor(tireStatus('front_left'))} strokeWidth="2" />
            <circle cx="130" cy="75" r="15" fill="url(#highlightGradient)" stroke={getStatusColor(tireStatus('rear_left'))} strokeWidth="2" />
          </g>
          <g className="tooltip interactive" data-tip={`Lights: ${details.lights || 'N/A'}`}>
            <rect x="155" y="20" width="5" height="10" rx="2" fill={getStatusColor(statuses.lights, 'transparent')} />
            <rect x="150" y="60" width="10" height="5" rx="2" fill={getStatusColor(statuses.lights, 'transparent')} />
          </g>
        </g>
      </g>

      {/* --- Front View --- */}
      <g transform="translate(390, 10)">
        <text x="0" y="10" className="text-xs font-sans" fill="hsl(var(--neutral-content) / 0.7)" opacity="0.8">
          Front View
        </text>
        <g transform="translate(20, 20) scale(1.1)" filter="url(#shadow)">
          <path d="M5 80 V 15 C 5 7 12 0 20 0 H 110 C 118 0 125 7 125 15 V 80 Z" fill="url(#bodyGradient)" stroke={strokeColor} strokeWidth="1" />
          <path d="M15 0 H 115 L 100 35 H 30 Z" fill="url(#highlightGradient)" />
          <g className="tooltip interactive" data-tip={`Oil: ${details.oil || 'N/A'}`}>
            <rect x="35" y="45" width="70" height="25" rx="3" fill={getStatusColor(statuses.oil)} opacity="0.7" />
          </g>
          <g className="tooltip interactive" data-tip={`Lights: ${details.lights || 'N/A'}`}>
            <rect x="10" y="45" width="20" height="8" rx="2" fill={getStatusColor(statuses.lights)} />
            <rect x="100" y="45" width="20" height="8" rx="2" fill={getStatusColor(statuses.lights)} />
          </g>
          {isDamage && (
            <g className="tooltip interactive" data-tip={`Damage: ${details.damage || 'N/A'}`}>
              <circle cx="65" cy="40" r="10" fill="none" stroke={getStatusColor(statuses.damage)} strokeWidth="2" opacity="0.9" />
            </g>
          )}
        </g>
      </g>
    </svg>
  );
};

export default VanVisual;