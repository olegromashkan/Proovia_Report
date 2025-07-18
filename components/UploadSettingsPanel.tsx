import { useEffect, useState } from 'react';

const TABLES = [
  'copy_of_tomorrow_trips',
  'event_stream',
  'drivers_report',
  'schedule_trips',
  'csv_trips',
  'van_checks',
] as const;

export default function UploadSettingsPanel() {
  const [limit, setLimit] = useState(500);
  const [types, setTypes] = useState<string[]>(['json', 'csv']);

  useEffect(() => {
    const l = parseInt(localStorage.getItem('uploadLimit') || '500', 10);
    const t = JSON.parse(localStorage.getItem('uploadTypes') || '["json","csv"]');
    setLimit(l);
    setTypes(Array.isArray(t) ? t : ['json', 'csv']);
  }, []);

  useEffect(() => {
    localStorage.setItem('uploadLimit', String(limit));
  }, [limit]);

  useEffect(() => {
    localStorage.setItem('uploadTypes', JSON.stringify(types));
  }, [types]);

  const toggle = (t: string) => {
    setTypes((cur) =>
      cur.includes(t) ? cur.filter((x) => x !== t) : [...cur, t]
    );
  };

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold">Upload Settings</h2>
      <div>
        <label className="block text-sm font-medium mb-1">Max File Size (MB)</label>
        <input
          type="number"
          min={1}
          value={limit}
          onChange={(e) => setLimit(parseInt(e.target.value, 10))}
          className="input input-bordered w-32"
        />
      </div>
      <div>
        <p className="text-sm font-medium mb-1">Allowed File Types</p>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            className="checkbox"
            checked={types.includes('json')}
            onChange={() => toggle('json')}
          />
          <span>.json</span>
        </label>
        <label className="flex items-center gap-2 mt-1">
          <input
            type="checkbox"
            className="checkbox"
            checked={types.includes('csv')}
            onChange={() => toggle('csv')}
          />
          <span>.csv</span>
        </label>
      </div>
      <div>
        <h3 className="font-medium mb-1">Database Tables</h3>
        <ul className="list-disc list-inside text-sm">
          {TABLES.map((t) => (
            <li key={t}>{t}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}
