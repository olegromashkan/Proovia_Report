import { useState, useEffect } from 'react';
import { Palette, Layout, Sparkles, RotateCcw, Save, Download, Upload, Eye, EyeOff, Copy, Check } from 'lucide-react';

const vars = [
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
    ],
  },
  {
    section: 'Layout',
    icon: Layout,
    items: [
      { key: '--rounded-btn', label: 'Button Radius', type: 'range', min: 0, max: 2, step: 0.1, unit: 'rem', description: 'Button corner radius' },
      { key: '--rounded-box', label: 'Element Radius', type: 'range', min: 0, max: 2, step: 0.1, unit: 'rem', description: 'General element radius' },
      { key: '--rounded-badge', label: 'Badge Radius', type: 'range', min: 0, max: 2, step: 0.1, unit: 'rem', description: 'Badge corner radius' },
      { key: '--spacing-base', label: 'Base Spacing', type: 'range', min: 0.5, max: 3, step: 0.25, unit: 'rem', description: 'Base spacing unit' },
    ],
  },
  {
    section: 'Effects',
    icon: Sparkles,
    items: [
      { key: '--shadow-strength', label: 'Shadow Strength', type: 'range', min: 0, max: 1, step: 0.05, description: 'Drop shadow intensity' },
      { key: '--blur-strength', label: 'Blur Strength', type: 'range', min: 0, max: 20, step: 1, unit: 'px', description: 'Backdrop blur effect' },
      { key: '--transition-speed', label: 'Animation Speed', type: 'range', min: 0.1, max: 1, step: 0.05, unit: 's', description: 'Transition duration' },
    ],
  },
] as const;

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
  },
  { 
    name: 'Forest', 
    values: { 
      '--p': '#059669', 
      '--a': '#10b981', 
      '--b1': '#f0fdf4', 
      '--b2': '#dcfce7',
      '--card-bg': '#ffffff'
    } 
  },
  { 
    name: 'Sunset', 
    values: { 
      '--p': '#dc2626', 
      '--a': '#f59e0b', 
      '--b1': '#fef2f2', 
      '--b2': '#fee2e2',
      '--card-bg': '#ffffff'
    } 
  },
];

export default function CustomizePanel() {
  const [values, setValues] = useState<Record<string, string>>({});
  const [previewMode, setPreviewMode] = useState(false);
  const [activeSection, setActiveSection] = useState('Colors');
  const [copied, setCopied] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const style = getComputedStyle(document.documentElement);
    const initial: Record<string, string> = {};
    vars.forEach(section => {
      section.items.forEach(v => {
        const saved = localStorage.getItem('theme_' + v.key);
        const val = saved || style.getPropertyValue(v.key).trim();
        initial[v.key] = val;
        if (val) {
          document.documentElement.style.setProperty(v.key, val);
        }
      });
    });
    setValues(initial);
  }, []);

  const update = (key: string, val: string) => {
    const item = vars.flatMap(s => s.items).find(i => i.key === key);
    const finalVal = item?.unit && item.type === 'range' ? val + item.unit : val;
    
    setValues(v => ({ ...v, [key]: finalVal }));
    document.documentElement.style.setProperty(key, finalVal);
    localStorage.setItem('theme_' + key, finalVal);
  };

  const reset = () => {
    vars.forEach(section => {
      section.items.forEach(v => {
        localStorage.removeItem('theme_' + v.key);
        document.documentElement.style.removeProperty(v.key);
      });
    });
    location.reload();
  };

  const applyPreset = (preset: typeof presetThemes[0]) => {
    Object.entries(preset.values).forEach(([key, val]) => {
      update(key, val);
    });
  };

  const exportTheme = () => {
    const theme = Object.fromEntries(
      Object.entries(values).filter(([_, val]) => val)
    );
    const blob = new Blob([JSON.stringify(theme, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'theme.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const importTheme = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const theme = JSON.parse(e.target?.result as string);
        Object.entries(theme).forEach(([key, val]) => {
          update(key, val as string);
        });
      } catch (error) {
        alert('Invalid theme file');
      }
    };
    reader.readAsText(file);
    event.target.value = '';
  };

  const copyToClipboard = async (text: string, key: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(key);
      setTimeout(() => setCopied(''), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const filteredVars = vars.map(section => ({
    ...section,
    items: section.items.filter(item => 
      item.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.key.toLowerCase().includes(searchTerm.toLowerCase())
    )
  })).filter(section => section.items.length > 0);

  const getRangeValue = (key: string) => {
    const val = values[key] || '0';
    return parseFloat(val.replace(/[^\d.-]/g, ''));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg">
                <Palette className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Theme Editor</h1>
                <p className="text-gray-600">Customize your application's appearance</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPreviewMode(!previewMode)}
                className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-colors ${
                  previewMode 
                    ? 'bg-green-100 text-green-700 hover:bg-green-200' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {previewMode ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                {previewMode ? 'Exit Preview' : 'Preview Mode'}
              </button>
            </div>
          </div>

          {/* Search */}
          <div className="relative mb-4">
            <input
              type="text"
              placeholder="Search properties..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
              <Palette className="w-4 h-4 text-gray-400" />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={reset}
              className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors flex items-center gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              Reset
            </button>
            <button
              onClick={exportTheme}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Export
            </button>
            <label className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors flex items-center gap-2 cursor-pointer">
              <Upload className="w-4 h-4" />
              Import
              <input type="file" accept=".json" onChange={importTheme} className="hidden" />
            </label>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            {/* Section Navigation */}
            <div className="bg-white rounded-2xl shadow-lg p-4 mb-6">
              <h3 className="font-semibold text-gray-900 mb-3">Sections</h3>
              <div className="space-y-1">
                {vars.map(section => {
                  const IconComponent = section.icon;
                  return (
                    <button
                      key={section.section}
                      onClick={() => setActiveSection(section.section)}
                      className={`w-full text-left px-3 py-2 rounded-lg transition-colors flex items-center gap-2 ${
                        activeSection === section.section
                          ? 'bg-blue-100 text-blue-700'
                          : 'hover:bg-gray-100 text-gray-700'
                      }`}
                    >
                      <IconComponent className="w-4 h-4" />
                      {section.section}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Presets */}
            <div className="bg-white rounded-2xl shadow-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-3">Presets</h3>
              <div className="space-y-2">
                {presetThemes.map(preset => (
                  <button
                    key={preset.name}
                    onClick={() => applyPreset(preset)}
                    className="w-full text-left px-3 py-2 rounded-lg hover:bg-gray-100 text-gray-700 transition-colors text-sm"
                  >
                    {preset.name}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            <div className="space-y-6">
              {filteredVars.map(section => (
                <div
                  key={section.section}
                  className={`bg-white rounded-2xl shadow-lg p-6 transition-all duration-300 ${
                    activeSection !== section.section && searchTerm === '' ? 'opacity-50 scale-95' : ''
                  }`}
                >
                  <div className="flex items-center gap-3 mb-6">
                    <section.icon className="w-5 h-5 text-blue-600" />
                    <h2 className="text-xl font-semibold text-gray-900">{section.section}</h2>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {section.items.map(item => (
                      <div key={item.key} className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <label className="font-medium text-gray-900 block">{item.label}</label>
                            <p className="text-sm text-gray-500">{item.description}</p>
                          </div>
                          <button
                            onClick={() => copyToClipboard(values[item.key] || '', item.key)}
                            className="p-1 hover:bg-gray-100 rounded transition-colors"
                            title="Copy value"
                          >
                            {copied === item.key ? (
                              <Check className="w-4 h-4 text-green-500" />
                            ) : (
                              <Copy className="w-4 h-4 text-gray-400" />
                            )}
                          </button>
                        </div>
                        
                        {item.type === 'color' ? (
                          <div className="flex items-center gap-3">
                            <input
                              type="color"
                              value={values[item.key] || '#000000'}
                              onChange={e => update(item.key, e.target.value)}
                              className="w-12 h-12 border-2 border-gray-300 rounded-lg cursor-pointer"
                            />
                            <input
                              type="text"
                              value={values[item.key] || ''}
                              onChange={e => update(item.key, e.target.value)}
                              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
                              placeholder="#000000"
                            />
                          </div>
                        ) : (
                          <div className="space-y-2">
                            <input
                              type="range"
                              min={item.min}
                              max={item.max}
                              step={item.step}
                              value={getRangeValue(item.key)}
                              onChange={e => update(item.key, e.target.value)}
                              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                            />
                            <div className="flex justify-between text-sm text-gray-500">
                              <span>{item.min}</span>
                              <span className="font-mono font-medium text-blue-600">
                                {values[item.key] || '0' + (item.unit || '')}
                              </span>
                              <span>{item.max}</span>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Preview Banner */}
        {previewMode && (
          <div className="fixed top-4 left-1/2 transform -translate-x-1/2 bg-green-500 text-white px-6 py-2 rounded-full shadow-lg z-50">
            <div className="flex items-center gap-2">
              <Eye className="w-4 h-4" />
              Preview Mode Active
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        .slider::-webkit-slider-thumb {
          appearance: none;
          height: 20px;
          width: 20px;
          border-radius: 50%;
          background: #3b82f6;
          cursor: pointer;
          box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        }
        .slider::-moz-range-thumb {
          height: 20px;
          width: 20px;
          border-radius: 50%;
          background: #3b82f6;
          cursor: pointer;
          border: none;
          box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        }
      `}</style>
    </div>
  );
}