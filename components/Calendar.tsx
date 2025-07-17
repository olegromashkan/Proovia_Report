import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { useRouter } from 'next/router';

// ----------------------------------------------------------------------
// DATA TYPES
// ----------------------------------------------------------------------
interface DayStats {
  date: string;
  total: number;
  complete: number;
  failed: number;
}

interface DayCellData {
  num: number;
  stat?: DayStats;
  isToday?: boolean;
  isOtherMonth?: boolean;
}

// ----------------------------------------------------------------------
// CONSTANTS (for cleaner code)
// ----------------------------------------------------------------------
const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June', 'July',
  'August', 'September', 'October', 'November', 'December'
];
const DAY_NAMES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

// ----------------------------------------------------------------------
// MAIN CALENDAR COMPONENT
// ----------------------------------------------------------------------
export default function Calendar() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1); // Months 1-12
  const [stats, setStats] = useState<Record<string, DayStats>>({});
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // --- Data Fetching ---
  useEffect(() => {
    setLoading(true);
    fetch(`/api/daily-summary?year=${year}&month=${month}`)
      .then(res => (res.ok ? res.json() : Promise.reject(res)))
      .then(data => {
        const map: Record<string, DayStats> = {};
        (data.items || []).forEach((d: DayStats) => {
          map[d.date] = d;
        });
        setStats(map);
      })
      .catch(() => setStats({}))
      .finally(() => setTimeout(() => setLoading(false), 300)); // Artificial delay to show the skeleton
  }, [year, month]);

  // --- Computation optimization with useMemo ---
  // This complex logic will only run when year, month, or stats change.
  const weeks = useMemo<DayCellData[][]>(() => {
    const daysInMonth = new Date(year, month, 0).getDate();
    const firstDayOfWeek = (new Date(year, month - 1, 1).getDay() + 6) % 7;
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

    const newWeeks: DayCellData[][] = [];
    let currentDayCounter = 1 - firstDayOfWeek;
    const totalCells = Math.ceil((daysInMonth + firstDayOfWeek) / 7) * 7;

    while (currentDayCounter <= totalCells) {
      const week: DayCellData[] = [];
      for (let i = 0; i < 7; i++) {
        const actualDate = new Date(year, month - 1, currentDayCounter);
        const isoDate = `${actualDate.getFullYear()}-${String(actualDate.getMonth() + 1).padStart(2, '0')}-${String(actualDate.getDate()).padStart(2, '0')}`;
        
        if (actualDate.getMonth() + 1 === month) {
          week.push({
            num: currentDayCounter,
            stat: stats[isoDate],
            isToday: isoDate === todayStr,
          });
        } else {
          week.push({
            num: actualDate.getDate(),
            isOtherMonth: true,
          });
        }
        currentDayCounter++;
      }
      newWeeks.push(week);
      if (currentDayCounter > daysInMonth && (currentDayCounter - 1) % 7 !== 0) {
        if (newWeeks.length * 7 >= daysInMonth + firstDayOfWeek) break;
      }
    }
    return newWeeks;
  }, [year, month, stats]);

  // --- Handler optimization with useCallback ---
  // These functions won't be recreated on every render.
  const changeMonth = useCallback((delta: number) => {
    setMonth(currentMonth => {
      let newMonth = currentMonth + delta;
      let newYear = year;
      if (newMonth < 1) {
        newMonth = 12;
        newYear -= 1;
      } else if (newMonth > 12) {
        newMonth = 1;
        newYear += 1;
      }
      setYear(newYear);
      return newMonth;
    });
  }, [year]);

  const goToToday = useCallback(() => {
    const today = new Date();
    setYear(today.getFullYear());
    setMonth(today.getMonth() + 1);
  }, []);

  // --- Helper component for skeleton loading ---
  const SkeletonGrid = () => (
    <div className="grid grid-cols-7 gap-1 sm:gap-2">
      {DAY_NAMES.map(d => (
        <div key={d} className="text-xs sm:text-sm font-bold text-base-content/50 pb-2 text-center">{d}</div>
      ))}
      {Array.from({ length: 35 }).map((_, index) => (
        <div key={index} className="aspect-square w-full rounded-lg bg-base-content/5 animate-pulse"></div>
      ))}
    </div>
  );
  
  // --- MAIN MARKUP ---
  return (
    <div className="card card-glass shadow-xl backdrop-blur-lg">
      <div className="card-body">
        {/* === HEADER AND NAVIGATION === */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-4">
          <h2 className="card-title text-2xl">Activity Overview</h2>
          <div className="flex items-center gap-2">
            <button onClick={() => changeMonth(-1)} className="btn btn-sm btn-circle btn-ghost" aria-label="Previous month">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
            </button>
            <span className="text-lg font-semibold w-40 text-center">{MONTH_NAMES[month - 1]} {year}</span>
            <button onClick={() => changeMonth(1)} className="btn btn-sm btn-circle btn-ghost" aria-label="Next month">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
            </button>
            <div className="divider divider-horizontal mx-1"></div>
            <button onClick={goToToday} className="btn btn-sm btn-ghost" aria-label="Go to today">
              Today
            </button>
          </div>
        </div>

        {/* === CALENDAR GRID OR SKELETON === */}
        {loading ? <SkeletonGrid /> : (
          <div className="grid grid-cols-7 gap-1 sm:gap-2">
            {DAY_NAMES.map(d => (
              <div key={d} className="text-xs sm:text-sm font-bold text-base-content/50 pb-2 text-center">{d}</div>
            ))}
            {weeks.flat().map((day, index) => {
              const isClickable = day.stat && !day.isOtherMonth;
              const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day.num).padStart(2, '0')}`;
              const successRate = day.stat && day.stat.total > 0
                ? Math.round((day.stat.complete / day.stat.total) * 100)
                : 0;
              const getProgressColor = () => {
                if (!isClickable) return 'text-base-content/20';
                if (successRate >= 90) return 'text-success';
                if (successRate >= 60) return 'text-warning';
                return 'text-error';
              };
              const tooltipText = day.stat
                ? `Success: ${successRate}% (${day.stat.complete} of ${day.stat.total})`
                : null;
              
              return (
                <div
                  key={index}
                  className={`tooltip tooltip-primary w-full h-full ${tooltipText ? '' : 'tooltip-disabled'}`}
                  data-tip={tooltipText}
                >
                  <button
                    onClick={() => isClickable && router.push(`/full-report?start=${dateStr}&end=${dateStr}`)}
                    disabled={!isClickable}
                    aria-label={isClickable ? `Report for ${MONTH_NAMES[month - 1]} ${day.num}` : 'No data'}
                    className={`
                      group aspect-square w-full rounded-lg flex flex-col p-1.5 justify-between text-center
                      transition-all duration-300 ease-out
                      border border-transparent
                      ${day.isOtherMonth ? 'opacity-30' : 'bg-base-100/40 hover:border-primary/50'}
                      ${isClickable ? 'cursor-pointer' : 'cursor-default'}
                      ${day.isToday && !day.isOtherMonth ? 'ring-2 ring-primary ring-offset-base-100 ring-offset-2' : ''}
                    `}
                  >
                    <div className={`text-left text-sm font-bold transition-colors ${day.isToday ? 'text-primary' : 'text-base-content/80 group-hover:text-primary'}`}>
                      {day.num}
                    </div>

                    {day.stat && !day.isOtherMonth ? (
                      <div className="flex flex-col items-center justify-center -mt-2 transition-transform duration-300 group-hover:scale-105">
                        <div
                          className={`radial-progress ${getProgressColor()}`}
                          style={{ '--value': successRate, '--size': '3.2rem', '--thickness': '3px' } as React.CSSProperties}
                        >
                          <span className="text-xs font-bold text-base-content/90">{successRate}%</span>
                        </div>
                        <div className="text-xs mt-1 font-semibold">
                          <span className="text-error/80">{day.stat.failed}</span>
                          <span className="text-base-content/40 mx-0.5">/</span>
                          <span className="text-base-content/80">{day.stat.total}</span>
                        </div>
                      </div>
                    ) : (
                      <div /> 
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}