import { useCallback, useEffect, useState } from 'react';

export interface RouteGroup {
  name: string;
  codes: string[];
  isFull: boolean;
  color: string;
}

export interface TimeSettings {
  lateEndHour: number;
  earlyStartHour: number;
  earlyEndHour: number;
  lateStartHour: number;
  restMessage: string;
  earlyMessage: string;
  enableRestWarning: boolean;
  enableEarlyWarning: boolean;
}

const DEFAULT_IGNORED_PATTERNS = [
  'every 2nd day north',
  'everyday',
  'every 2nd south-west',
  'every 2nd day south',
  'South Wales 2nd',
];

export const DEFAULT_ROUTE_GROUPS: RouteGroup[] = [
  { name: '2DT', codes: ['EDINBURGH', 'GLASGOW', 'INVERNESS', 'ABERDEEN', 'EX+TR', 'TQ+PL'], isFull: true, color: 'text-gray-400' },
  { name: 'London', codes: ['WD', 'HA', 'UB', 'TW', 'KT', 'CR', 'BR', 'DA', 'RM', 'IG', 'EN', 'SM', 'W', 'NW', 'N', 'E', 'EC', 'SE', 'WC'], isFull: false, color: 'text-purple-500' },
  { name: 'Wales', codes: ['LL', 'SY', 'SA'], isFull: false, color: 'text-yellow-500' },
  { name: 'North', codes: ['LA', 'CA', 'NE', 'DL', 'DH', 'SR', 'TS', 'HG', 'YO', 'HU', 'BD'], isFull: false, color: 'text-red-500' },
  { name: 'East Midlands', codes: ['NR', 'IP', 'CO'], isFull: false, color: 'text-blue-500' },
  { name: 'South East', codes: ['ME', 'CT', 'TN', 'RH', 'BN', 'GU', 'PO', 'SO'], isFull: false, color: 'text-green-500' },
  { name: 'South West', codes: ['SP', 'BH', 'DT', 'TA', 'EX', 'TQ', 'PL', 'TR'], isFull: false, color: 'text-pink-500' },
  { name: 'West Midlands', codes: ['ST', 'TF', 'WV', 'DY', 'HR', 'WR', 'B', 'WS', 'CV', 'NN'], isFull: false, color: 'text-teal-300' },
];

export const DEFAULT_TIME_SETTINGS: TimeSettings = {
  lateEndHour: 20,
  earlyStartHour: 7,
  earlyEndHour: 17,
  lateStartHour: 9,
  restMessage: 'Driver has had too little rest between shifts.',
  earlyMessage: 'Consider assigning this driver to an earlier start time.',
  enableRestWarning: true,
  enableEarlyWarning: true,
};

export function useScheduleSettings() {
  const [routeGroups, setRouteGroups] = useState<RouteGroup[]>(DEFAULT_ROUTE_GROUPS);
  const [ignoredPatterns, setIgnoredPatterns] = useState<string[]>(DEFAULT_IGNORED_PATTERNS);
  const [timeSettings, setTimeSettings] = useState<TimeSettings>(DEFAULT_TIME_SETTINGS);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const stored = localStorage.getItem('scheduleSettings');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (parsed.routeGroups) setRouteGroups(parsed.routeGroups);
        if (parsed.ignoredPatterns) setIgnoredPatterns(parsed.ignoredPatterns);
        if (parsed.timeSettings) setTimeSettings({ ...DEFAULT_TIME_SETTINGS, ...parsed.timeSettings });
      } catch {
        /* ignore */
      }
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const toSave = { routeGroups, ignoredPatterns, timeSettings };
    try {
      localStorage.setItem('scheduleSettings', JSON.stringify(toSave));
    } catch {
      /* ignore */
    }
  }, [routeGroups, ignoredPatterns, timeSettings]);

  const updateGroup = useCallback((idx: number, group: RouteGroup) => {
    setRouteGroups(prev => prev.map((g, i) => (i === idx ? group : g)));
  }, []);

  const resetSettings = useCallback(() => {
    setRouteGroups(DEFAULT_ROUTE_GROUPS);
    setIgnoredPatterns(DEFAULT_IGNORED_PATTERNS);
    setTimeSettings(DEFAULT_TIME_SETTINGS);
  }, []);

  return {
    routeGroups,
    ignoredPatterns,
    timeSettings,
    setIgnoredPatterns,
    setTimeSettings,
    updateGroup,
    resetSettings,
  };
}

export default useScheduleSettings;
