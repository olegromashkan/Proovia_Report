export interface VarItem {
  key: string;
  type: 'color' | 'range';
  unit?: string;
  min?: number;
  max?: number;
  step?: number;
}

export interface VarSection {
  section: string;
  icon: any;
  items: VarItem[];
}

export function loadVars(defs: VarSection[]): Record<string, string> {
  const style = getComputedStyle(document.documentElement);
  const initial: Record<string, string> = {};
  defs.forEach(section => {
    section.items.forEach(v => {
      const saved = localStorage.getItem('theme_' + v.key);
      const val = saved || style.getPropertyValue(v.key).trim();
      if (val) document.documentElement.style.setProperty(v.key, val);
      initial[v.key] = val;
    });
  });
  return initial;
}

export function applyVar(key: string, value: string) {
  document.documentElement.style.setProperty(key, value);
  localStorage.setItem('theme_' + key, value);
}

export function resetVars(defs: VarSection[]) {
  defs.forEach(section => {
    section.items.forEach(v => {
      localStorage.removeItem('theme_' + v.key);
      document.documentElement.style.removeProperty(v.key);
    });
  });
}

export function exportVars(values: Record<string, string>) {
  return Object.fromEntries(
    Object.entries(values).filter(([_, val]) => val)
  );
}
