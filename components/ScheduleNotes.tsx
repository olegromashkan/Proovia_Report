import Icon from './Icon';
import React from 'react';

interface Panel {
  name: string;
  color: string;
  icon: string;
}

interface Props {
  panels: Panel[];
  notes: Record<string, string>;
  onChange: (panel: string, value: string) => void;
  onClear: (panel: string) => void;
}

export default function ScheduleNotes({ panels, notes, onChange, onClear }: Props) {
  return (
    <>
      <div className="text-sm font-semibold text-base-content mb-1">Notes</div>
      <div className="flex flex-col gap-1">
        {panels.map((panel) => (
          <div
            key={panel.name}
            className={`card ${panel.color} shadow rounded-md overflow-hidden`}
          >
            <div className="p-1">
              <div className="flex items-center justify-between mb-0.5">
                <h3 className="text-xs font-medium flex items-center gap-1">
                  <Icon name={panel.icon} className="w-3 h-3" />
                  {panel.name}
                </h3>
                <button
                  onClick={() => onClear(panel.name)}
                  className="btn btn-ghost btn-xs p-0 min-h-0 h-3 w-3 opacity-60 hover:opacity-100"
                  title="Clear note"
                >
                  ✕
                </button>
              </div>
              <textarea
                className="textarea w-full text-xs bg-white dark:bg-base-100 border border-gray-300 dark:border-gray-600 p-1 rounded resize-none h-24 overflow-y-auto focus:outline-none focus:border-blue-500"
                placeholder={`Notes for ${panel.name}...`}
                value={notes[panel.name] || ''}
                onChange={(e) => onChange(panel.name, e.target.value)}
              />
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
