import React from 'react';

interface Props {
  start: number; // hours in decimal (0-24)
  end: number;   // hours in decimal (0-24)
}

function angleFromHours(h: number) {
  return (h / 24) * 360;
}

export default function AnalogClock({ start, end }: Props) {
  const startAngle = angleFromHours(start);
  const endAngle = angleFromHours(end);

  // normalize sweep to always be positive
  let sweep = endAngle - startAngle;
  if (sweep <= 0) sweep += 360;

  // svg geometry values
  const size = 80; // matches w-20/h-20
  const radius = size / 2 - 4;
  const center = size / 2;

  const startRad = (startAngle - 90) * (Math.PI / 180);
  const endRad = (endAngle - 90) * (Math.PI / 180);

  const sx = center + radius * Math.cos(startRad);
  const sy = center + radius * Math.sin(startRad);
  const ex = center + radius * Math.cos(endRad);
  const ey = center + radius * Math.sin(endRad);

  const largeArc = sweep > 180 ? 1 : 0;
  const pathD = `M ${center} ${center} L ${sx} ${sy} A ${radius} ${radius} 0 ${largeArc} 1 ${ex} ${ey} Z`;

  return (
    <div className="relative w-20 h-20">
      <svg
        viewBox={`0 0 ${size} ${size}`}
        className="w-full h-full rounded-full border border-gray-400 dark:border-gray-600 bg-white dark:bg-gray-800"
      >
        <path d={pathD} fill="rgba(16, 185, 129, 0.4)" />
        <line x1={center} y1={center} x2={sx} y2={sy} stroke="#10B981" strokeWidth="1" />
        <line x1={center} y1={center} x2={ex} y2={ey} stroke="#EF4444" strokeWidth="1" />
        <circle cx={center} cy={center} r={1} fill="#4B5563" />
      </svg>
    </div>
  );
}
