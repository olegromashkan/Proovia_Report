// components/VanVisual.tsx
import React from 'react';

interface Statuses {
  tires: string;
  lights: string;
  oil: string;
  damage: string;
}

const getStatusColor = (status: string) => {
  switch (status?.toLowerCase()) {
    case 'ok': return '#22c55e'; // green-500
    case 'warning': return '#f59e0b'; // amber-500
    case 'error': return '#ef4444'; // red-500
    default: return '#9ca3af'; // gray-400
  }
};

const VanVisual = ({ statuses }: { statuses: Statuses }) => {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 110" className="w-full h-full">
      <defs>
        <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="2" dy="4" stdDeviation="3" floodColor="#000000" floodOpacity="0.15" />
        </filter>
      </defs>
      
      {/* --- Body --- */}
      <path
        d="M10 50 L10 80 A10 10 0 0 0 20 90 L40 90 L40 80 L155 80 L155 90 L175 90 A10 10 0 0 0 185 80 L185 60 A15 15 0 0 0 170 45 L110 45 L85 20 L25 20 A15 15 0 0 0 10 35 Z"
        className="fill-base-200"
        filter="url(#shadow)"
      />
      <path 
        d="M10 50 L10 80 A10 10 0 0 0 20 90 L40 90 L40 80 L155 80 L155 90 L175 90 A10 10 0 0 0 185 80 L185 60 A15 15 0 0 0 170 45 L110 45 L85 20 L25 20 A15 15 0 0 0 10 35 Z"
        className="stroke-base-content/10"
        strokeWidth="1"
        fill="none"
      />
      {/* --- Windows --- */}
      <path d="M90 24 L108 41 L80 41 L62 24 Z" className="fill-base-100/80" />
      <path d="M58 24 L76 41 L22 41 L22 35 A13 13 0 0 1 35 22 Z" className="fill-base-100/80" />

      {/* --- Interactive Parts --- */}
      <circle cx="50" cy="90" r="12" className="fill-base-100" stroke={getStatusColor(statuses.tires)} strokeWidth="2" />
      <circle cx="145" cy="90" r="12" className="fill-base-100" stroke={getStatusColor(statuses.tires)} strokeWidth="2" />
      <circle cx="50" cy="90" r="4" className="fill-base-content/80" />
      <circle cx="145" cy="90" r="4" className="fill-base-content/80" />
      <rect x="178" y="48" width="12" height="8" rx="2" fill={getStatusColor(statuses.lights)} />
      <path d="M115 55 L135 55 L135 70 L115 70 Z" fill={getStatusColor(statuses.oil)} />
      <circle cx="125" cy="62" r="2" fill="white" />
      <rect x="10" y="35" width="175" height="45" rx="5" fill="none" stroke={getStatusColor(statuses.damage)} strokeWidth="1.5" strokeDasharray="5 3" />
    </svg>
  );
};

export default VanVisual;