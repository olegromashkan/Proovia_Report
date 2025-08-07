import React from 'react';
import Icon from '../Icon';

interface NotesSidebarProps {
  notes: Record<string, string>;
  onNoteChange: (panel: string, value: string) => void;
}

const PANELS = [
  { name: 'Newbie', color: 'bg-green-50 dark:bg-green-900/30 border-green-200 dark:border-green-700 text-green-700 dark:text-green-300', icon: 'person' },
  { name: 'Mechanic', color: 'bg-blue-50 dark:bg-gray-900/30 border-blue-200 dark:border-blue-700 text-blue-700 dark:text-blue-300', icon: 'wrench' },
  { name: 'Loading 2DT', color: 'bg-orange-50 dark:bg-orange-900/30 border-orange-200 dark:border-orange-700 text-orange-700 dark:text-orange-300', icon: 'truck' },
  { name: 'Trainers', color: 'bg-pink-50 dark:bg-pink-900/30 border-pink-200 dark:border-pink-700 text-pink-700 dark:text-pink-300', icon: 'journal-check' },
  { name: 'Agreements', color: 'bg-yellow-50 dark:bg-green-900/30 border-yellow-200 dark:border-yellow-700 text-yellow-700 dark:text-yellow-300', icon: 'check2-all' },
  { name: 'Return 2DT', color: 'bg-red-50 dark:bg-red-900/30 border-red-200 dark:border-red-700 text-red-700 dark:text-red-300', icon: 'arrow-return-right' },
  { name: 'OFF/STB', color: 'bg-purple-50 dark:bg-purple-900/30 border-purple-200 dark:border-purple-700 text-purple-700 dark:text-purple-300', icon: 'cup-hot' },
  { name: 'Available Drivers', color: 'bg-gray-50 dark:bg-gray-900/30 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300', icon: 'rocket-takeoff' },
];

const NotesSidebar: React.FC<NotesSidebarProps> = ({ notes, onNoteChange }) => {
  return (
    <aside className="w-64 p-2 border-l overflow-y-auto space-y-4">
      {PANELS.map(panel => (
        <div key={panel.name} className={`p-2 border rounded ${panel.color}`}>
          <div className="flex items-center mb-1 font-semibold">
            <Icon name={panel.icon} className="mr-2" /> {panel.name}
          </div>
          <textarea
            className="w-full h-24 p-1 border rounded"
            value={notes[panel.name] || ''}
            onChange={e => onNoteChange(panel.name, e.target.value)}
          />
        </div>
      ))}
    </aside>
  );
};

export default NotesSidebar;
