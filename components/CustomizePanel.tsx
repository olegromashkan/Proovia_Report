import { useState, useEffect } from 'react';

const vars = [
  { key: '--p', label: 'Primary Color', type: 'color' },
  { key: '--a', label: 'Accent Color', type: 'color' },
  { key: '--b1', label: 'Background 1', type: 'color' },
  { key: '--b2', label: 'Background 2', type: 'color' },
  { key: '--rounded-btn', label: 'Button Radius', type: 'range', min: 0, max: 2, step: 0.1 },
  { key: '--rounded-box', label: 'Element Radius', type: 'range', min: 0, max: 2, step: 0.1 },
  { key: '--rounded-badge', label: 'Badge Radius', type: 'range', min: 0, max: 2, step: 0.1 },
  { key: '--shadow-strength', label: 'Shadow Strength', type: 'range', min: 0, max: 1, step: 0.05 },
];

export default function CustomizePanel() {
  const [values, setValues] = useState<Record<string, string>>({});

  useEffect(() => {
    const style = getComputedStyle(document.documentElement);
    const initial: Record<string, string> = {};
    vars.forEach(v => {
      const saved = localStorage.getItem('style' + v.key);
      const val = saved || style.getPropertyValue(v.key).trim();
      initial[v.key] = val;
      document.documentElement.style.setProperty(v.key, val);
    });
    setValues(initial);
  }, []);

  const update = (key: string, val: string) => {
    setValues(v => ({ ...v, [key]: val }));
    document.documentElement.style.setProperty(key, val);
    localStorage.setItem('style' + key, val);
  };

  const reset = () => {
    vars.forEach(v => {
      localStorage.removeItem('style' + v.key);
    });
    location.reload();
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Theme Editor</h1>
      <div className="space-y-6">
        {vars.map(v => (
          <div key={v.key} className="space-y-2">
            <label className="font-medium block">{v.label}</label>
            {v.type === 'color' ? (
              <input
                type="color"
                value={values[v.key] || ''}
                onChange={e => update(v.key, e.target.value)}
                className="w-32 h-10 p-0 border rounded-system"/>
            ) : (
              <input
                type="range"
                min={v.min}
                max={v.max}
                step={v.step}
                value={parseFloat(values[v.key])}
                onChange={e => update(v.key, e.target.value + (v.key.startsWith('--rounded') ? 'rem' : ''))}
                className="w-full"
              />
            )}
            <div className="text-sm text-gray-500">{values[v.key]}</div>
          </div>
        ))}
        <button onClick={reset} className="btn btn-primary mt-4">Reset Defaults</button>
      </div>
    </div>
  );
}
