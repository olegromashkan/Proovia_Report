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
  const router = useRouter();

  useEffect(() => {
    fetch(`/api/daily-summary?year=${year}&month=${month}`)
      .then(res => (res.ok ? res.json() : Promise.reject()))
      .then(data => {
        const map: Record<string, DayStats> = {};
        (data.items || []).forEach((d: DayStats) => {
          map[d.date] = d;
        });
        setStats(map);
      })
      .catch(() => setStats({}));
  }, [year, month]);

  const daysInMonth = new Date(year, month, 0).getDate();
  const firstDay = new Date(year, month - 1, 1).getDay(); // 0=Sun

  const weeks: Array<Array<{ num: number; stat?: DayStats }>> = [];
  let current = 1 - firstDay;
  while (current <= daysInMonth) {
    const week: Array<{ num: number; stat?: DayStats }> = [];
    for (let i = 0; i < 7; i++) {
      if (current > 0 && current <= daysInMonth) {
        const iso = `${year}-${String(month).padStart(2, '0')}-${String(current).padStart(2, '0')}`;
        week.push({ num: current, stat: stats[iso] });
      } else {
        week.push({ num: 0 });
      }
      current++;
    }
    weeks.push(week);
  }

  const months = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
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

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <button onClick={() => changeMonth(-1)} className="px-2">
          <Icon name="chevron-left" className="icon" />
        </button>
        <select
          value={month}
          onChange={e => setMonth(Number(e.target.value))}
          className="border p-1 rounded"
        >
          {months.map((m, i) => (
            <option key={i} value={i + 1}>
              {m}
            </option>
          ))}
        </select>
        <input
          type="number"
          value={year}
          onChange={e => setYear(Number(e.target.value))}
          className="border p-1 rounded w-24"
        />
        <button onClick={() => changeMonth(1)} className="px-2">
          <Icon name="chevron-right" className="icon" />
        </button>
      </div>
      <div className="grid grid-cols-7 gap-px text-center">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
          <div key={d} className="font-semibold bg-gray-100">
            {d}
          </div>
        ))}
        {weeks.map((week, i) =>
          week.map((day, j) => (
            <div
              key={`${i}-${j}`}
              onClick={() =>
                day.stat &&
                router.push(`/full-report?start=${day.stat.date}&end=${day.stat.date}`)
              }
              className="bg-white border h-24 p-1 text-xs flex flex-col justify-between cursor-pointer"
            >
              <div className="text-right">{day.num || ''}</div>
              {day.stat && (
                <div className="mt-auto flex justify-center space-x-1">
                  <span className="text-green-600">{day.stat.complete}</span>
                  <span className="text-red-600">{day.stat.failed}</span>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
