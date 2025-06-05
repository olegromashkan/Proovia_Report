import React from 'react';

interface IconProps {
  name: string;
  className?: string;
}

const icons: Record<string, string> = {
  house: '🏠',
  upload: '⬆️',
  'user-cog': '👤',
  'table-list': '📊',
  search: '🔍',
  bell: '🔔',
  xmark: '❌',
  trash: '🗑️',
  'chevron-left': '◀️',
  'chevron-right': '▶️',
  'chevron-down': '🔽',
  check: '✅',
  clock: '⏰',
  pen: '✏️',
  copy: '📋',
  ban: '🚫',
  save: '💾',
  'file-arrow-up': '📤',
  'rotate-left': '↩️',
  'up-right-from-square': '↗️',
  refresh: '🔄',
  calendar: '📅',
  database: '🗄️',
};

export default function Icon({ name, className }: IconProps) {
  return <span className={className}>{icons[name] || '❓'}</span>;
}
