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
  eye: 'eye',
  save: 'save',
  'file-arrow-up': 'file-earmark-arrow-up',
  'rotate-left': 'arrow-counterclockwise',
  'up-right-from-square': 'box-arrow-up-right',
  download: 'download',
  plus: 'plus',
  refresh: 'arrow-clockwise',
  people: 'people',
  chat: 'chat-dots',
  signpost: 'signpost',
  'hand-thumbs-up': 'hand-thumbs-up',
  'hand-thumbs-up-fill': 'hand-thumbs-up-fill',
  'chat-left': 'chat-left-text',
  calendar: 'calendar',
  database: 'hdd-stack',
  truck: 'truck',
  'light-bulb': 'lightbulb',
  beaker: 'beaker',
  droplet: 'droplet',
  'shield-exclamation': 'shield-exclamation',
  thermometer: 'thermometer',
  'fuel-pump': 'fuel-pump',
  snowflake: 'snow',
  'check-circle': 'check-circle',
  'exclamation-triangle': 'exclamation-triangle',
  'x-circle': 'x-circle',
  'question-mark-circle': 'question-circle',
  star: 'star',
  'star-fill': 'star-fill',
  reply: 'arrow-90deg-left',
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
