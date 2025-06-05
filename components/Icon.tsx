import React from 'react';

interface IconProps {
  name: string;
  className?: string;
}

const iconMap: Record<string, string> = {
  house: 'house',
  upload: 'upload',
  'user-cog': 'person-gear',
  'table-list': 'table',
  search: 'search',
  bell: 'bell',
  xmark: 'x-lg',
  trash: 'trash',
  'chevron-left': 'chevron-left',
  'chevron-right': 'chevron-right',
  'chevron-down': 'chevron-down',
  check: 'check',
  clock: 'clock',
  pen: 'pencil',
  copy: 'clipboard',
  ban: 'ban',
  save: 'save',
  'file-arrow-up': 'file-earmark-arrow-up',
  'rotate-left': 'arrow-counterclockwise',
  'up-right-from-square': 'box-arrow-up-right',
  refresh: 'arrow-clockwise',
  calendar: 'calendar',
  database: 'hdd-stack',
};

export default function Icon({ name, className }: IconProps) {
  const icon = iconMap[name] || name;
  return (
    <i
      className={`bi bi-${icon} ${className || ''}`.trim()}
      aria-hidden="true"
    ></i>
  );
}
