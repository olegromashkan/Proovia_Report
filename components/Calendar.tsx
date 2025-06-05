import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Icon from './Icon';

interface DayStats {
  date: string;
  total: number;
  complete: number;
  failed: number;
}

export default function Calendar() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1); // 1-12
  const [stats, setStats] = useState<Record<string, DayStats>>({});
  const [loading, setLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [view, setView] = useState<'month' | 'week'>('month');
  const router = useRouter();

  useEffect(() => {
    setLoading(true);
    fetch(`/api/daily-summary?year=${year}&month=${month}`)
      .then(res => (res.ok ? res.json() : Promise.reject()))
      .then(data => {
        const map: Record<string, DayStats> = {};
        (data.items || []).forEach((d: DayStats) => {
          map[d.date] = d;
        });
        setStats(map);
      })
      .catch(() => setStats({}))
      .finally(() => setLoading(false));
  }, [year, month]);

  const daysInMonth = new Date(year, month, 0).getDate();
  const firstDay = new Date(year, month - 1, 1).getDay(); // 0=Sun
  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

  // Generate calendar weeks
  const weeks: Array<Array<{ num: number; stat?: DayStats; isToday?: boolean; isOtherMonth?: boolean }>> = [];
  let current = 1 - firstDay;
  
  while (current <= daysInMonth) {
    const week: Array<{ num: number; stat?: DayStats; isToday?: boolean; isOtherMonth?: boolean }> = [];
    for (let i = 0; i < 7; i++) {
      if (current > 0 && current <= daysInMonth) {
        const iso = `${year}-${String(month).padStart(2, '0')}-${String(current).padStart(2, '0')}`;
        week.push({ 
          num: current, 
          stat: stats[iso],
          isToday: iso === todayStr
        });
      } else {
        // Add previous/next month dates for better visual
        const actualDate = new Date(year, month - 1, current);
        week.push({ 
          num: actualDate.getDate(),
          isOtherMonth: true
        });
      }
      current++;
    }
    weeks.push(week);
  }

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];

  const changeMonth = (delta: number) => {
    let m = month + delta;
    let y = year;
    if (m < 1) {
      m = 12;
      y -= 1;
    } else if (m > 12) {
      m = 1;
      y += 1;
    }
    setYear(y);
    setMonth(m);
  };

  const goToToday = () => {
    const today = new Date();
    setYear(today.getFullYear());
    setMonth(today.getMonth() + 1);
  };

  const getDayIntensity = (stat?: DayStats) => {
    if (!stat || stat.total === 0) return 0;
    const successRate = stat.complete / stat.total;
    if (successRate >= 0.9) return 4; // Excellent
    if (successRate >= 0.7) return 3; // Good
    if (successRate >= 0.5) return 2; // Average
    return 1; // Poor
  };

  const getIntensityClass = (intensity: number) => {
    switch (intensity) {
      case 4: return 'bg-success/80 text-success-content';
      case 3: return 'bg-success/60 text-success-content';
      case 2: return 'bg-warning/60 text-warning-content';
      case 1: return 'bg-error/60 text-error-content';
      default: return 'bg-base-200 hover:bg-base-300';
    }
  };

  const totalStats = Object.values(stats).reduce(
    (acc, stat) => ({
      total: acc.total + stat.total,
      complete: acc.complete + stat.complete,
      failed: acc.failed + stat.failed,
    }),
    { total: 0, complete: 0, failed: 0 }
  );

  return (
    <div className="card bg-base-100 shadow-xl">
      <div className="card-body">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-4">
            <h2 className="card-title text-2xl">
              <Icon name="clock" className="text-primary" />
              Calendar Overview
            </h2>
            <div className="badge badge-primary badge-lg">
              {months[month - 1]} {year}
            </div>
          </div>

          {/* View Toggle */}
          <div className="join">
            <button 
              className={`join-item btn btn-sm ${view === 'month' ? 'btn-primary' : 'btn-outline'}`}
              onClick={() => setView('month')}
            >
              Month
            </button>
            <button 
              className={`join-item btn btn-sm ${view === 'week' ? 'btn-primary' : 'btn-outline'}`}
              onClick={() => setView('week')}
            >
              Week
            </button>
          </div>
        </div>

        {/* Navigation Controls */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-2">
            <button 
              onClick={() => changeMonth(-1)} 
              className="btn btn-circle btn-outline btn-sm hover:btn-primary"
            >
              <Icon name="chevron-left" />
            </button>
            
            <div className="dropdown">
              <div tabIndex={0} role="button" className="btn btn-outline">
                {months[month - 1]}
                <Icon name="chevron-down" />
              </div>
              <ul tabIndex={0} className="dropdown-content z-[1] menu p-2 shadow bg-base-100 rounded-box w-52 max-h-64 overflow-y-auto">
                {months.map((m, i) => (
                  <li key={i}>
                    <a 
                      className={month === i + 1 ? 'active' : ''}
                      onClick={() => setMonth(i + 1)}
                    >
                      {m}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            <input
              type="number"
              value={year}
              onChange={e => setYear(Number(e.target.value))}
              className="input input-bordered input-sm w-20"
              min="2020"
              max="2030"
            />
            
            <button 
              onClick={() => changeMonth(1)} 
              className="btn btn-circle btn-outline btn-sm hover:btn-primary"
            >
              <Icon name="chevron-right" />
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button 
              onClick={goToToday} 
              className="btn btn-sm btn-primary gap-2"
            >
              <Icon name="clock" />
              Today
            </button>
          </div>
        </div>

        {/* Month Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="stat bg-primary/10 rounded-lg">
            <div className="stat-figure text-primary">
              <Icon name="table-list" className="text-2xl" />
            </div>
            <div className="stat-title">Total Tasks</div>
            <div className="stat-value text-primary">{totalStats.total}</div>
          </div>
          
          <div className="stat bg-success/10 rounded-lg">
            <div className="stat-figure text-success">
              <Icon name="check" className="text-2xl" />
            </div>
            <div className="stat-title">Completed</div>
            <div className="stat-value text-success">{totalStats.complete}</div>
            <div className="stat-desc">
              {totalStats.total > 0 ? Math.round((totalStats.complete / totalStats.total) * 100) : 0}% success rate
            </div>
          </div>
          
          <div className="stat bg-error/10 rounded-lg">
            <div className="stat-figure text-error">
              <Icon name="ban" className="text-2xl" />
            </div>
            <div className="stat-title">Failed</div>
            <div className="stat-value text-error">{totalStats.failed}</div>
          </div>
        </div>

        {/* Loading Skeleton */}
        {loading && (
          <div className="animate-pulse">
            <div className="grid grid-cols-7 gap-2 mb-4">
              {Array.from({ length: 7 }).map((_, i) => (
                <div key={i} className="h-8 bg-base-300 rounded"></div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-2">
              {Array.from({ length: 35 }).map((_, i) => (
                <div key={i} className="h-24 bg-base-300 rounded"></div>
              ))}
            </div>
          </div>
        )}

        {/* Calendar Grid */}
        {!loading && (
          <div className="grid grid-cols-7 gap-1 text-center">
            {/* Day Headers */}
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
              <div key={d} className="font-semibold p-3 bg-base-200 rounded-t-lg text-base-content/70">
                <span className="hidden sm:inline">{d}</span>
                <span className="sm:hidden">{d.charAt(0)}</span>
              </div>
            ))}
            
            {/* Calendar Days */}
            {weeks.map((week, i) =>
              week.map((day, j) => {
                const intensity = getDayIntensity(day.stat);
                const isClickable = day.stat && !day.isOtherMonth;
                
                return (
                  <div
                    key={`${i}-${j}`}
                    onClick={() => {
                      if (isClickable) {
                        const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day.num).padStart(2, '0')}`;
                        setSelectedDate(dateStr);
                        router.push(`/full-report?start=${dateStr}&end=${dateStr}`);
                      }
                    }}
                    className={`
                      min-h-[6rem] p-2 border border-base-300 flex flex-col justify-between transition-all duration-200
                      ${day.isOtherMonth ? 'opacity-30' : ''}
                      ${day.isToday ? 'ring-2 ring-primary ring-offset-2' : ''}
                      ${isClickable ? 'cursor-pointer hover:scale-105 hover:shadow-lg' : ''}
                      ${getIntensityClass(intensity)}
                    `}
                  >
                    {/* Day Number */}
                    <div className="flex justify-between items-start">
                      <span className={`text-sm font-medium ${day.isToday ? 'font-bold' : ''}`}>
                        {day.num || ''}
                      </span>
                      {day.isToday && (
                        <div className="w-2 h-2 bg-primary rounded-full"></div>
                      )}
                    </div>

                    {/* Stats */}
                    {day.stat && !day.isOtherMonth && (
                      <div className="mt-auto space-y-1">
                        <div className="text-xs opacity-90">
                          Total: {day.stat.total}
                        </div>
                        <div className="flex justify-center gap-2 text-xs">
                          <div className="flex items-center gap-1">
                            <div className="w-2 h-2 bg-success rounded-full"></div>
                            <span>{day.stat.complete}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <div className="w-2 h-2 bg-error rounded-full"></div>
                            <span>{day.stat.failed}</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* Legend */}
        <div className="mt-6 p-4 bg-base-200/50 rounded-lg">
          <h3 className="font-semibold mb-3 flex items-center gap-2">
            <Icon name="table-list" />
            Performance Legend
          </h3>
          <div className="flex flex-wrap gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-success/80 rounded"></div>
              <span>Excellent (90%+)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-success/60 rounded"></div>
              <span>Good (70-89%)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-warning/60 rounded"></div>
              <span>Average (50-69%)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-error/60 rounded"></div>
              <span>Poor (&lt;50%)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-base-200 rounded border-2 border-primary"></div>
              <span>Today</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}