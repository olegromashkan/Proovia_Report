import React from 'react';

interface SidebarNavProps {
  sections: { section: string; icon: React.ElementType }[];
  active: string;
  onSelect: (s: string) => void;
}

export default function SidebarNav({ sections, active, onSelect }: SidebarNavProps) {
  return (
    <div className="bg-white rounded-3xl shadow-md p-4 space-y-1">
      {sections.map(({ section, icon: Icon }) => (
        <button
          key={section}
          onClick={() => onSelect(section)}
          className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
            active === section ? 'bg-gray-200 text-gray-900' : 'hover:bg-gray-100 text-gray-600'
          }`}
        >
          <Icon className="w-4 h-4" />
          {section}
        </button>
      ))}
    </div>
  );
}
