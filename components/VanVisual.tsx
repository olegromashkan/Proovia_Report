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
const getStatusColor = (status: string, fallbackColor = 'currentColor') => {
  switch (status?.toLowerCase()) {
    case 'ok': return 'hsl(var(--su))';      // success
    case 'warning': return 'hsl(var(--wa))'; // warning
    case 'error': return 'hsl(var(--er))';   // error
    default: return fallbackColor;
  }
};

const VanVisual = ({ statuses, details = {} }: { statuses: Statuses; details?: Details }) => {
  const isDamage = statuses.damage?.toLowerCase() !== 'ok';
  const strokeColor = 'hsl(var(--b-content) / 0.2)';

  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 370" className="w-full h-auto text-base-content">
      <defs>
        <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="1" dy="2" stdDeviation="2" floodColor="hsl(var(--bc) / 0.1)" />
        </filter>
      </defs>
      
      {/* --- Top View --- */}
      <g transform="translate(10, 10)">
        <text x="0" y="10" className="text-xs font-sans" fill="currentColor" opacity="0.5">Top View</text>
        <g transform="translate(0, 20)" filter="url(#shadow)">
          <rect x="1" y="1" width="178" height="98" rx="12" className="fill-base-100" stroke={strokeColor} />
          <path d="M100 1 H173 a5 5 0 0 1 5 5 V 44 a5 5 0 0 1 -5 5 H100 Z" className="fill-base-200/70" />
          <g className="tooltip" data-tip={details.oil || 'Oil Status'}>
            <path d="M30 1 H100 V49 H30 a5 5 0 0 1 -5 -5 V 6 a5 5 0 0 1 5-5z" fill={getStatusColor(statuses.oil)} opacity="0.5" />
          </g>
          {isDamage && (
            <g className="tooltip" data-tip={details.damage || 'Damage Status'}>
              <path d="M60 25 L120 75 M120 25 L60 75" stroke={getStatusColor(statuses.damage)} strokeWidth="2.5" strokeLinecap="round" opacity="0.8"/>
            </g>
          )}
          <rect x="1" y="1" width="178" height="88" rx="10" fill="none" className="stroke-base-content/10" strokeWidth="1" />
          <g className="tooltip" data-tip={details.tires || 'Tires Status'}>
            <rect x="20" y="-8" width="40" height="18" rx="5" className="fill-base-300" stroke={getStatusColor(statuses.tires)} strokeWidth="1.5" />
            <rect x="120" y="-8" width="40" height="18" rx="5" className="fill-base-300" stroke={getStatusColor(statuses.tires)} strokeWidth="1.5" />
            <rect x="20" y="80" width="40" height="18" rx="5" className="fill-base-300" stroke={getStatusColor(statuses.tires)} strokeWidth="1.5" />
            <rect x="120" y="80" width="40" height="18" rx="5" className="fill-base-300" stroke={getStatusColor(statuses.tires)} strokeWidth="1.5" />
          </g>
        </g>
      </g>

      {/* --- Side View --- */}
      <g transform="translate(10, 145)">
        <text x="0" y="10" className="text-xs font-sans" fill="currentColor" opacity="0.5">Side View</text>
        <g transform="translate(0, 20)" filter="url(#shadow)">
          <path d="M10 85 V 40 C 10 30, 18 20, 28 20 H 100 L 120 0 H 165 C 175 0, 183 8, 183 18 V 75 L 170 85 Z" className="fill-base-100" stroke={strokeColor} />
          <path d="M10 85 V 40 C 10 30, 18 20, 28 20 H 90 V 85 Z" className="fill-base-200/70" />
          <path d="M95 20 H 115 L 125 45 H 95 Z" className="fill-base-300/50" />
          {isDamage && (
             <g className="tooltip" data-tip={details.damage || 'Damage Status'}>
                <path d="M80 50 C 90 40, 100 60, 110 50" stroke={getStatusColor(statuses.damage)} strokeWidth="2" fill="none" strokeLinecap="round" strokeDasharray="4 4"/>
             </g>
          )}
          <g className="tooltip" data-tip={details.tires || 'Tires Status'}>
            <circle cx="45" cy="85" r="16" className="fill-base-300" stroke={getStatusColor(statuses.tires)} strokeWidth="2" />
            <circle cx="150" cy="85" r="16" className="fill-base-300" stroke={getStatusColor(statuses.tires)} strokeWidth="2" />
          </g>
          <g className="tooltip" data-tip={details.lights || 'Lights Status'}>
            <rect x="180" y="25" width="5" height="10" rx="2" fill={getStatusColor(statuses.lights, 'transparent')} />
            <rect x="175" y="65" width="10" height="5" rx="2" fill={getStatusColor(statuses.lights, 'transparent')} />
          </g>
        </g>
      </g>

      {/* --- Front View --- */}
      <g transform="translate(10, 270)">
        <text x="0" y="10" className="text-xs font-sans" fill="currentColor" opacity="0.5">Front View</text>
        <g transform="translate(25, 20)" filter="url(#shadow)">
            <path d="M5 90 V 20 C5 10 15 0 25 0 H 125 C 135 0 145 10 145 20 V 90 Z" className="fill-base-100" stroke={strokeColor} />
            <path d="M20 0 H 130 L 115 40 H 35 Z" className="fill-base-200/70" />
            <g className="tooltip" data-tip={details.oil || 'Oil Status'}>
                <rect x="40" y="50" width="70" height="25" rx="3" fill={getStatusColor(statuses.oil)} opacity="0.5"/>
            </g>
            <g className="tooltip" data-tip={details.lights || 'Lights Status'}>
                <rect x="15" y="50" width="20" height="8" rx="2" fill={getStatusColor(statuses.lights)} />
                <rect x="115" y="50" width="20" height="8" rx="2" fill={getStatusColor(statuses.lights)} />
            </g>
            {isDamage && (
                <g className="tooltip" data-tip={details.damage || 'Damage Status'}>
                    <circle cx="75" cy="45" r="10" fill="none" stroke={getStatusColor(statuses.damage)} strokeWidth="2" opacity="0.9" />
                </g>
            )}
        </g>
      </g>
    </svg>
  );
};

export default VanVisual;