import { useState, useEffect } from 'react';
import { Palette, Layout as LayoutIcon, Sparkles, RotateCcw, Download, Upload, Eye, EyeOff } from 'lucide-react';
import RangeSlider from './RangeSlider';
import ColorRow from './ColorRow';
import SectionCard from './SectionCard';
import SidebarNav from './SidebarNav';
import { loadVars, applyVar, resetVars, exportVars, VarSection } from '../lib/theme';

const vars: VarSection[] = [
  {
    section: 'Colors',
    icon: Palette,
    items: [
      { key: '--p', label: 'Primary Color', type: 'color', description: 'Main brand color' },
      { key: '--a', label: 'Accent Color', type: 'color', description: 'Secondary highlight color' },
      { key: '--b1', label: 'Background 1', type: 'color', description: 'Main background' },
      { key: '--b2', label: 'Background 2', type: 'color', description: 'Secondary background' },
      { key: '--card-bg', label: 'Card Color', type: 'color', description: 'Card background color' },
      { key: '--section-bg', label: 'Section Color', type: 'color', description: 'Section background' },
      { key: '--text-primary', label: 'Primary Text', type: 'color', description: 'Main text color' },
      { key: '--text-secondary', label: 'Secondary Text', type: 'color', description: 'Muted text color' },
    ]
  },
  {
    section: 'Layout',
    icon: LayoutIcon,
    items: [
      { key: '--rounded-btn', label: 'Button Radius', type: 'range', min: 0, max: 2, step: 0.1, unit: 'rem', description: 'Button corner radius' },
      { key: '--rounded-box', label: 'Element Radius', type: 'range', min: 0, max: 2, step: 0.1, unit: 'rem', description: 'General element radius' },
      { key: '--rounded-badge', label: 'Badge Radius', type: 'range', min: 0, max: 2, step: 0.1, unit: 'rem', description: 'Badge corner radius' },
      { key: '--spacing-base', label: 'Base Spacing', type: 'range', min: 0.5, max: 3, step: 0.25, unit: 'rem', description: 'Base spacing unit' },
    ]
  },
  {
    section: 'Effects',
    icon: Sparkles,
    items: [
      { key: '--shadow-strength', label: 'Shadow Strength', type: 'range', min: 0, max: 1, step: 0.05, description: 'Drop shadow intensity' },
      { key: '--blur-strength', label: 'Blur Strength', type: 'range', min: 0, max: 20, step: 1, unit: 'px', description: 'Backdrop blur effect' },
      { key: '--transition-speed', label: 'Animation Speed', type: 'range', min: 0.1, max: 1, step: 0.05, unit: 's', description: 'Transition duration' }
    ]
  }
];

export default function CustomizePanel() {
  const [values, setValues] = useState<Record<string, string>>({});
  const [previewMode, setPreviewMode] = useState(false);
  const [activeSection, setActiveSection] = useState('Colors');
  const [copied, setCopied] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    setValues(loadVars(vars));
  }, []);

  const update = (key: string, val: string) => {
    const def = vars.flatMap(s => s.items).find(i => i.key === key);
    const finalVal = def?.unit && def.type === 'range' ? val + def.unit : val;
    setValues(v => ({ ...v, [key]: finalVal }));
    applyVar(key, finalVal);
  };

  const reset = () => {
    resetVars(vars);
    location.reload();
  };

  const exportTheme = () => {
    const data = exportVars(values);
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'theme.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const importTheme = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !file.name.endsWith('.json')) return;
    const reader = new FileReader();
    reader.onload = e => {
      try {
        const theme = JSON.parse(e.target?.result as string);
        Object.entries(theme).forEach(([k, v]) => update(k, v as string));
      } catch {
        alert('Invalid theme file');
      }
    };
    reader.readAsText(file);
    event.target.value = '';
  };

  const applyPreset = (preset: typeof presetThemes[0]) => {
    Object.entries(preset.values).forEach(([k, v]) => update(k, v as string));
  };

  const copyValue = async (text: string, key: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(key);
      setTimeout(() => setCopied(''), 2000);
    } catch {
      /* ignore */
    }
  };

  const filtered = vars.map(s => ({
    ...s,
    items: s.items.filter(i => i.label.toLowerCase().includes(searchTerm.toLowerCase()) || i.key.includes(searchTerm))
  })).filter(s => s.items.length);

  const getRange = (key: string) => {
    const val = values[key] || '0';
    return parseFloat(val.replace(/[^\d.-]/g, ''));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f9f9f9] to-[#eeeeee] p-8 font-sans">
      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-[220px_1fr] gap-8">
        {/* Sidebar */}
        <div className="space-y-6">
          <SidebarNav
            sections={vars.map(({ section, icon }) => ({ section, icon }))}
            active={activeSection}
            onSelect={setActiveSection}
          />
          <div className="bg-white rounded-3xl shadow-md p-4 space-y-2">
            {presetThemes.map(p => (
              <button key={p.name} onClick={() => applyPreset(p)} className="w-full text-left px-3 py-2 rounded-lg hover:bg-gray-100 text-sm text-gray-700">
                {p.name}
              </button>
            ))}
          </div>
        </div>

        {/* Main */}
        <div className="space-y-8">
          <div className="bg-white rounded-3xl shadow-md p-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-r from-gray-300 to-gray-200 rounded-lg">
                <Palette className="w-6 h-6 text-gray-700" />
              </div>
              <div>
                <h1 className="text-2xl font-semibold text-gray-800">Theme Editor</h1>
                <p className="text-gray-500 text-sm">Customize your application</p>
              </div>
            </div>
            <button onClick={() => setPreviewMode(!previewMode)} className="px-4 py-2 rounded-lg flex items-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700">
              {previewMode ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              {previewMode ? 'Exit Preview' : 'Preview Mode'}
            </button>
          </div>

          <input
            type="text"
            placeholder="Search properties..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 rounded-full border border-gray-300 pl-10 bg-white"
          />

          <div className="flex flex-wrap gap-2">
            <button onClick={reset} className="px-4 py-2 rounded-full bg-red-400 text-white hover:bg-red-500 flex items-center gap-2">
              <RotateCcw className="w-4 h-4" />
              Reset
            </button>
            <button onClick={exportTheme} className="px-4 py-2 rounded-full bg-blue-400 text-white hover:bg-blue-500 flex items-center gap-2">
              <Download className="w-4 h-4" />
              Export
            </button>
            <label className="px-4 py-2 rounded-full bg-green-400 text-white hover:bg-green-500 flex items-center gap-2 cursor-pointer">
              <Upload className="w-4 h-4" />
              Import
              <input type="file" accept=".json" onChange={importTheme} className="hidden" />
            </label>
          </div>

          {filtered.map(section => (
            <SectionCard key={section.section} title={section.section} Icon={section.icon}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {section.items.map(item => (
                  item.type === 'color' ? (
                    <ColorRow
                      key={item.key}
                      label={item.label}
                      description={item.description!}
                      value={values[item.key] || ''}
                      onChange={v => update(item.key, v)}
                      copied={copied === item.key}
                      onCopy={() => copyValue(values[item.key] || '', item.key)}
                    />
                  ) : (
                    <div key={item.key}>
                      <label className="font-medium text-gray-900 block mb-1">{item.label}</label>
                      <RangeSlider
                        value={getRange(item.key)}
                        min={item.min!}
                        max={item.max!}
                        step={item.step!}
                        onChange={v => update(item.key, v)}
                        displayValue={values[item.key] || ''}
                      />
                    </div>
                  )
                ))}
              </div>
            </SectionCard>
          ))}

          {previewMode && (
            <div className="fixed top-4 left-1/2 -translate-x-1/2 bg-green-500 text-white px-6 py-2 rounded-full shadow-lg">
              <div className="flex items-center gap-2">
                <Eye className="w-4 h-4" /> Preview Mode Active
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const presetThemes = [
  { name: 'Default', values: {} },
  {
    name: 'Dark Mode',
    values: {
      '--b1': '#1f2937',
      '--b2': '#111827',
      '--card-bg': '#374151',
      '--text-primary': '#f9fafb',
      '--text-secondary': '#d1d5db'
    }
  },
  {
    name: 'Ocean',
    values: {
      '--p': '#0ea5e9',
      '--a': '#06b6d4',
      '--b1': '#f0f9ff',
      '--b2': '#e0f2fe',
      '--card-bg': '#ffffff'
    }
  }
];
