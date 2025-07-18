import React from 'react';

interface RangeSliderProps {
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (val: string) => void;
  displayValue: string;
}

export default function RangeSlider({ value, min, max, step, onChange, displayValue }: RangeSliderProps) {
  return (
    <div className="space-y-2">
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={e => onChange(e.target.value)}
        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
      />
      <div className="flex justify-between text-sm text-gray-500">
        <span>{min}</span>
        <span className="font-mono font-medium text-gray-700">{displayValue}</span>
        <span>{max}</span>
      </div>
    </div>
  );
}
