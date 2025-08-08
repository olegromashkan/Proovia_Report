import { Trip, RouteGroup } from '../types/schedule';
import { parseTimeToMinutes } from './timeUtils';

export const getTextAfterSpace = (text?: string) => {
  if (!text) return '';
  const index = text.indexOf(' ');
  return index !== -1 ? text.substring(index + 1) : text;
};

export const parseTime = (time?: string): number => {
  if (!time) return NaN;
  const minutes = parseTimeToMinutes(getTextAfterSpace(time));
  return minutes === null ? NaN : minutes;
};

export const getActualEnd = (endTime?: string, punctuality?: string) => {
  if (!endTime) return '';
  const endDate = new Date(endTime);
  if (isNaN(endDate.getTime())) return '';
  const mins = parseInt(punctuality || '0', 10);
  const actual = new Date(endDate.getTime() + (isNaN(mins) ? 0 : mins) * 60000);
  return actual.toTimeString().slice(0, 5);
};

export const getCalendar = (text?: string) => {
  if (!text) return '';
  const colonIndex = text.indexOf(':');
  if (colonIndex === -1) return '';
  const parenIndex = text.indexOf('(', colonIndex);
  if (parenIndex === -1) return text.substring(colonIndex + 1).trim();
  return text.substring(colonIndex + 1, parenIndex).trim();
};

export const getRoute = (text?: string) => {
  return getCalendar(text);
};

export const getTasks = (text?: string) => {
  if (!text) return '';
  const openParen = text.indexOf('(');
  if (openParen === -1) return '';
  const closeParen = text.indexOf(')', openParen);
  if (closeParen === -1) return text.substring(openParen + 1).trim();
  return text.substring(openParen + 1, closeParen).trim();
};

export const getVH = (text?: string) => {
  if (!text) return '';
  const routeUpper = getRoute(text)?.toUpperCase().replace(/[\s+]+/g, '+') || '';
  const twoDTKeywords = new Set(['EDINBURGH', 'GLASGOW', 'ABERDEEN', 'EX+TR', 'INVERNESS', 'TQ+PL']);
  if (Array.from(twoDTKeywords).some(kw => routeUpper.includes(kw))) {
    return '2DT';
  }
  const firstDash = text.indexOf('-');
  if (firstDash === -1) return '';
  const secondDash = text.indexOf('-', firstDash + 1);
  if (secondDash === -1) return text.substring(firstDash + 1).trim();
  return text.substring(firstDash + 1, secondDash).trim();
};

const specialCodes = new Set(['LA', 'EX', 'CA', 'TQ', 'NE', 'ME', 'CT', 'SA', 'NR']);
export const hasSpecialCode = (calendarName?: string) => {
  const calendar = getCalendar(calendarName);
  if (!calendar) return false;
  if (calendar.includes('EX+TR')) return false;
  const parts = calendar.split(/[\s+]+/).map(p => p.trim()).filter(Boolean);
  return parts.some(part => specialCodes.has(part));
};

export const formatDuration = (minutes: number): string => {
  if (isNaN(minutes) || minutes < 0) return '--:--';
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
};

export const getDuration = (it: Trip, isLeft: boolean) => {
  if (isLeft) {
    const start = parseTime(it.Start_Time);
    const actualEnd = parseTime(getActualEnd(it.End_Time, it.Punctuality));
    return isNaN(start) || isNaN(actualEnd) ? NaN : actualEnd - start;
  } else {
    const start = parseTime(it.Start_Time);
    const end = parseTime(it.End_Time);
    return isNaN(start) || isNaN(end) ? NaN : end - start;
  }
};

export const getCategory = (route: string, routeGroups: RouteGroup[]): string => {
  let upper = route.toUpperCase().replace(/[\s+]+/g, '+');
  for (const cat of routeGroups) {
    if (cat.isFull) {
      if (cat.codes.includes(upper)) return cat.name;
    } else {
      const parts = upper.split('+').map(p => p.trim()).filter(p => p !== '');
      if (parts.some(p => cat.codes.includes(p))) return cat.name;
    }
  }
  return 'Other';
};

export const computeStats = (items: Trip[], routeGroups: RouteGroup[]) => {
  const counts: Record<string, number> = {};
  let total = 0;
  items.forEach(it => {
    const route = getRoute(it.Calendar_Name);
    const cat = getCategory(route, routeGroups);
    counts[cat] = (counts[cat] || 0) + 1;
    total++;
  });
  return { counts, total };
};

export const getRouteColorClass = (calendarName: string | undefined, routeGroups: RouteGroup[]): string => {
  const route = getRoute(calendarName);
  if (!route) return 'text-white';
  let upper = route.toUpperCase().replace(/[\s+]+/g, '+');
  for (const group of routeGroups) {
    if (group.isFull) {
      if (group.codes.includes(upper)) return group.color;
    } else {
      const parts = upper.split('+').map(p => p.trim()).filter(p => p !== '');
      if (parts.some(p => group.codes.includes(p))) return group.color;
    }
  }
  return 'text-white';
};

export const getAmountColor = (
  val: string | undefined,
  range: { min: number; max: number; lower: number; upper: number }
) => {
  const num = parseFloat(val || '');
  if (isNaN(num)) return 'text-gray-500';
  if (num < range.lower || num > range.upper) return 'text-gray-800';
  const ratio = range.max === range.min ? 0 : (num - range.min) / (range.max - range.min);
  const hue = 0 + ratio * 120;
  return `hsl(${hue}, 70%, 50%)`;
};

export const getTimeColor = (val: number, range: { min: number; max: number }) => {
  if (isNaN(val)) return '';
  const ratio = range.max === range.min ? 0 : (val - range.min) / (range.max - range.min);
  if (ratio < 0.25) {
    const lightness = 90 - ratio * 4 * 20;
    return `hsl(120, 60%, ${lightness}%)`;
  } else if (ratio < 0.5) {
    const hue = 120 - (ratio - 0.25) * 4 * 60;
    return `hsl(${hue}, 60%, 70%)`;
  } else if (ratio < 0.75) {
    const hue = 60 - (ratio - 0.5) * 4 * 30;
    return `hsl(${hue}, 60%, 70%)`;
  } else {
    const hue = 30 - (ratio - 0.75) * 4 * 30;
    const lightness = 70 - (ratio - 0.75) * 4 * 20;
    return `hsl(${hue}, 60%, ${lightness}%)`;
  }
};

