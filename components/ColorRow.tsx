import React from 'react';
import { Copy, Check } from 'lucide-react';

interface ColorRowProps {
  label: string;
  description: string;
  value: string;
  onChange: (val: string) => void;
  copied: boolean;
  onCopy: () => void;
}

export default function ColorRow({ label, description, value, onChange, copied, onCopy }: ColorRowProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <label className="font-medium text-gray-900 block">{label}</label>
          <p className="text-sm text-gray-500">{description}</p>
        </div>
        <button onClick={onCopy} className="p-1 hover:bg-gray-100 rounded" title="Copy value">
          {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4 text-gray-400" />}
        </button>
      </div>
      <div className="flex items-center gap-3">
        <input
          type="color"
          value={value || '#000000'}
          onChange={e => onChange(e.target.value)}
          className="w-12 h-12 border border-gray-300 rounded-lg cursor-pointer"
        />
        <input
          type="text"
          value={value || ''}
          onChange={e => onChange(e.target.value)}
          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg font-mono text-sm"
          placeholder="#000000"
        />
      </div>
    </div>
  );
}
