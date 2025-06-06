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
  const [loading, setLoading] = useState(true);
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
  const firstDay = (new Date(year, month - 1, 1).getDay() + 6) % 7; // Понедельник = 0
  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

  const weeks: Array<Array<{ num: number; stat?: DayStats; isToday?: boolean; isOtherMonth?: boolean }>> = [];
  let current = 1 - firstDay;
  
  while (current <= daysInMonth) {
    const week: Array<{ num: number; stat?: DayStats; isToday?: boolean; isOtherMonth?: boolean }> = [];
    for (let i = 0; i < 7; i++) {
      const actualDate = new Date(year, month - 1, current);
      if (actualDate.getMonth() + 1 === month) {
        const iso = `${year}-${String(month).padStart(2, '0')}-${String(current).padStart(2, '0')}`;
        week.push({ 
          num: current, 
          stat: stats[iso],
          isToday: iso === todayStr
        });
      } else {
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
    if (m < 1) { m = 12; y -= 1; } 
    else if (m > 12) { m = 1; y += 1; }
    setYear(y);
    setMonth(m);
  };

  const goToToday = () => {
    const today = new Date();
    setYear(today.getFullYear());
    setMonth(today.getMonth() + 1);
  };

  const getIntensityClass = (stat?: DayStats) => {
    if (!stat || stat.total === 0) return 'bg-base-200/40';
    const successRate = stat.complete / stat.total;
    if (successRate >= 0.9) return 'bg-success/20';
    if (successRate >= 0.7) return 'bg-success/10';
    if (successRate >= 0.5) return 'bg-warning/10';
    return 'bg-error/10';
  };

  return (
    <div className="card bg-base-100 shadow-xl border border-base-content/10">
      <div className="card-body p-4">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mb-4">
          <h2 className="card-title text-xl font-bold">
            Calendar Overview
          </h2>
          <div className="flex items-center gap-1">
            <button onClick={() => changeMonth(-1)} className="btn btn-ghost btn-sm btn-circle">
              <Icon name="chevron-left" />
            </button>
            <span className="font-semibold text-md w-32 text-center">{months[month - 1]} {year}</span>
            <button onClick={() => changeMonth(1)} className="btn btn-ghost btn-sm btn-circle">
              <Icon name="chevron-right" />
            </button>
             <button onClick={goToToday} className="btn btn-ghost btn-sm ml-2">Today</button>
          </div>
        </div>

        {/* Calendar Grid */}
        <div className={`transition-opacity duration-200 ${loading ? 'opacity-20' : 'opacity-100'}`}>
          <div className="grid grid-cols-7 gap-1 text-center">
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(d => (
              <div key={d} className="font-normal text-xs text-base-content/60 pb-2">
                {d}
              </div>
            ))}
            
            {weeks.map((week, i) =>
              week.map((day, j) => {
                const isClickable = day.stat && !day.isOtherMonth;
                const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day.num).padStart(2, '0')}`;
                
                return (
                  <div
                    key={`${i}-${j}`}
                    onClick={() => isClickable && router.push(`/full-report?start=${dateStr}&end=${dateStr}`)}
                    className={`
                      p-2 border border-transparent flex flex-col justify-between h-20
                      transition-all duration-200 rounded-lg
                      ${day.isOtherMonth ? 'opacity-40' : ''}
                      ${isClickable ? 'cursor-pointer hover:border-primary/50' : 'cursor-default'}
                      ${day.isToday && !day.isOtherMonth ? 'border-primary' : ''}
                      ${getIntensityClass(day.stat)}
                    `}
                  >
                    <div className="text-left">
                      <span className={`font-medium text-xs ${day.isToday ? 'text-primary' : 'text-base-content/70'}`}>
                        {day.num}
                      </span>
                    </div>

                    {day.stat && !day.isOtherMonth && (
                      <div className="flex items-center justify-end gap-x-2 text-xs flex-wrap">
                        <div className="flex items-center gap-1" title="Total">
                          <Icon name="table-list" className="text-info/80" /> 
                          <span className="font-semibold">{day.stat.total}</span>
                        </div>
                        <div className="flex items-center gap-1" title="Completed">
                          <Icon name="check" className="text-success/80" /> 
                          <span className="font-semibold text-success">{day.stat.complete}</span>
                        </div>
                        <div className="flex items-center gap-1" title="Failed">
                          <Icon name="ban" className="text-error/80" /> 
                          <span className="font-semibold text-error">{day.stat.failed}</span>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}