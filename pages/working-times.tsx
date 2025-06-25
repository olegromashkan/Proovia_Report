import { useEffect, useState } from 'react';
import Layout from '../components/Layout';

interface ApiData {
  dates: string[];
  data: { driver: string; times: Record<string, string> }[];
}

export default function WorkingTimes() {
  const [info, setInfo] = useState<ApiData | null>(null);

  useEffect(() => {
    fetch('/api/working-times')
      .then(res => (res.ok ? res.json() : Promise.reject()))
      .then(setInfo)
      .catch(() => setInfo(null));
  }, []);

  return (
    <Layout title="Working Times">
      <h1 className="text-2xl font-bold mb-4">Working Times</h1>
      <div className="overflow-auto">
        {info ? (
          <table className="table-auto border-collapse text-sm">
            <thead>
              <tr>
                <th className="border px-2 py-1 text-left">Driver</th>
                {info.dates.map(d => (
                  <th key={d} className="border px-2 py-1 text-center">
                    {d}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {info.data.map(row => (
                <tr key={row.driver}>
                  <td className="border px-2 py-1 whitespace-nowrap">{row.driver}</td>
                  {info.dates.map(date => (
                    <td key={date} className="border px-2 py-1 text-center">
                      {row.times[date] || '0'}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p>Loading...</p>
        )}
      </div>
    </Layout>
  );
}
