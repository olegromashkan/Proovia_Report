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
  return (
    <div className="relative w-20 h-20 rounded-full border border-gray-400 dark:border-gray-600">
      <div
        className="absolute left-1/2 top-1/2 w-px h-8 bg-green-500 origin-bottom"
        style={{ transform: `translate(-50%, -100%) rotate(${startAngle}deg)` }}
      />
      <div
        className="absolute left-1/2 top-1/2 w-px h-8 bg-red-500 origin-bottom"
        style={{ transform: `translate(-50%, -100%) rotate(${endAngle}deg)` }}
      />
      <div className="absolute left-1/2 top-1/2 w-1 h-1 bg-gray-600 rounded-full -translate-x-1/2 -translate-y-1/2" />
    </div>
  );
}
