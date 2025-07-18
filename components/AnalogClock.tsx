import React from 'react';

interface Props {
  start: number; // hours in decimal (0-24)
  end: number;   // hours in decimal (0-24)
}

function angleFromHours(h: number) {
  // Convert to 12-hour format and adjust so 12 o'clock is at top (0 degrees)
  const hours12 = h % 12;
  return (hours12 / 12) * 360;
}

export default function AnalogClock({ start, end }: Props) {
  const startAngle = angleFromHours(start);
  const endAngle = angleFromHours(end);
  
  // normalize sweep to always be positive
  let sweep = endAngle - startAngle;
  if (sweep <= 0) sweep += 360;
  
  // svg geometry values
  const size = 60;
  const radius = size / 2 - 4;
  const center = size / 2;
  
  // Calculate positions for start and end lines
  const startRad = (startAngle - 90) * (Math.PI / 180);
  const endRad = (endAngle - 90) * (Math.PI / 180);
  const sx = center + radius * Math.cos(startRad);
  const sy = center + radius * Math.sin(startRad);
  const ex = center + radius * Math.cos(endRad);
  const ey = center + radius * Math.sin(endRad);
  
  const largeArc = sweep > 180 ? 1 : 0;
  const pathD = `M ${center} ${center} L ${sx} ${sy} A ${radius} ${radius} 0 ${largeArc} 1 ${ex} ${ey} Z`;
  
  // Generate hour marks
  const hourMarks = [];
  
  for (let i = 1; i <= 12; i++) {
    const angle = (i / 12) * 360 - 90; // -90 to start from top
    const radian = angle * (Math.PI / 180);
    
    // Hour mark lines
    const outerRadius = radius;
    const innerRadius = radius - 4;
    const x1 = center + outerRadius * Math.cos(radian);
    const y1 = center + outerRadius * Math.sin(radian);
    const x2 = center + innerRadius * Math.cos(radian);
    const y2 = center + innerRadius * Math.sin(radian);
    
    hourMarks.push(
      <line
        key={`mark-${i}`}
        x1={x1}
        y1={y1}
        x2={x2}
        y2={y2}
        stroke="#374151"
        strokeWidth="1.5"
        className="dark:stroke-gray-300"
      />
    );
  }
  

  
  return (
    <div className="relative w-15 h-15">
      <svg
        viewBox={`0 0 ${size} ${size}`}
        className="w-full h-full rounded-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800"
      >
        {/* Hour marks */}
        {hourMarks}
        
        {/* Time range arc */}
        <path 
          d={pathD} 
          fill="rgba(16, 185, 129, 0.3)" 
          stroke="rgba(16, 185, 129, 0.6)"
          strokeWidth="1"
        />
        
        {/* Start time line (green) */}
        <line 
          x1={center} 
          y1={center} 
          x2={sx} 
          y2={sy} 
          stroke="#10B981" 
          strokeWidth="2"
          strokeLinecap="round"
        />
        
        {/* End time line (red) */}
        <line 
          x1={center} 
          y1={center} 
          x2={ex} 
          y2={ey} 
          stroke="#EF4444" 
          strokeWidth="2"
          strokeLinecap="round"
        />
        
        {/* Center dot */}
        <circle 
          cx={center} 
          cy={center} 
          r={2} 
          fill="#374151" 
          className="dark:fill-gray-300"
        />
      </svg>
    </div>
  );
}