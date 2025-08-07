import React from 'react';
import Modal from '../Modal';
import { RouteGroup, TimeSettings } from '../../hooks/useScheduleSettings';

interface Props {
  isOpen: boolean;
  routeGroups: RouteGroup[];
  ignoredPatterns: string[];
  timeSettings: TimeSettings;
  onClose: () => void;
  onUpdateGroup: (idx: number, group: RouteGroup) => void;
  onIgnoredPatternsChange: (patterns: string[]) => void;
  onReset: () => void;
}

const SettingsModal: React.FC<Props> = ({
  isOpen,
  routeGroups,
  ignoredPatterns,
  timeSettings,
  onClose,
  onUpdateGroup,
  onIgnoredPatternsChange,
  onReset,
}) => {
  if (!isOpen) return null;
  return (
    <Modal open={isOpen} onClose={onClose} className="max-w-2xl">
      <h2 className="text-lg font-semibold mb-4">Settings</h2>
      <div className="space-y-4 max-h-[70vh] overflow-y-auto">
        <div>
          <h3 className="font-medium mb-2">Route Groups</h3>
          {routeGroups.map((g, i) => (
            <div key={g.name} className="flex items-center mb-2 space-x-2">
              <input
                className="input input-bordered input-sm flex-1"
                value={g.name}
                onChange={e => onUpdateGroup(i, { ...g, name: e.target.value })}
              />
              <input
                className="input input-bordered input-sm flex-1"
                value={g.codes.join(', ')}
                onChange={e => onUpdateGroup(i, { ...g, codes: e.target.value.split(',').map(s => s.trim()) })}
              />
            </div>
          ))}
        </div>
        <div>
          <h3 className="font-medium mb-2">Ignored Patterns</h3>
          <textarea
            className="textarea textarea-bordered w-full"
            value={ignoredPatterns.join('\n')}
            onChange={e => {
              const lines = e.target.value
                .split('\n')
                .map(l => l.trim())
                .filter(Boolean);
              onIgnoredPatternsChange(lines);
            }}
          />
        </div>
        <div>
          <h3 className="font-medium mb-2">Time Settings</h3>
          <pre className="bg-base-200 p-2 rounded text-sm overflow-x-auto">{JSON.stringify(timeSettings, null, 2)}</pre>
        </div>
        <div className="text-right">
          <button className="btn btn-outline btn-sm mr-2" onClick={onReset}>Reset to defaults</button>
          <button className="btn btn-primary btn-sm" onClick={onClose}>Close</button>
        </div>
      </div>
    </Modal>
  );
};

export default SettingsModal;
