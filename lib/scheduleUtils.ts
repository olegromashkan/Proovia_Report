import { Trip } from '../hooks/useScheduleData';
import { RouteGroup } from '../hooks/useScheduleSettings';

export interface SortConfig {
  key: string;
  dir: 'asc' | 'desc';
}

export function getRouteColorClass(routeGroups: RouteGroup[], calendarName?: string) {
  if (!calendarName) return '';
  const code = calendarName.split(/\s+/)[0].toUpperCase();
  const group = routeGroups.find(g => g.codes.includes(code));
  return group ? group.color : '';
}

export function getVH(v: number) {
  if (typeof window === 'undefined') return 0;
  return (window.innerHeight * v) / 100;
}

export function parseTime(time?: string): number {
  if (!time) return NaN;
  const [h, m] = time.split(':').map(Number);
  if (Number.isNaN(h) || Number.isNaN(m)) return NaN;
  return h * 60 + m;
}

export function formatDuration(mins: number): string {
  const sign = mins < 0 ? '-' : '';
  const abs = Math.abs(mins);
  const h = Math.floor(abs / 60);
  const m = abs % 60;
  return `${sign}${h}h ${m.toString().padStart(2, '0')}m`;
}

export function computeStats(trips: Trip[]) {
  const total = trips.length;
  const assigned = trips.filter(t => t.isAssigned).length;
  return { total, assigned };
}

export function getNextSort(current: SortConfig | null, key: string): SortConfig {
  const dir = current?.key === key && current.dir === 'asc' ? 'desc' : 'asc';
  return { key, dir };
}

export function sortTrips(trips: Trip[], key: string, dir: 'asc' | 'desc'): Trip[] {
  return [...trips].sort((a: any, b: any) => {
    const av = (a[key] ?? '') as string;
    const bv = (b[key] ?? '') as string;
    return av.localeCompare(bv) * (dir === 'asc' ? 1 : -1);
  });
}
