import { useState, useRef, useEffect } from 'react';
import Layout from '../components/Layout';

interface ChannelStats {
  open: number;
  closed: number;
  [key: string]: any;
}

interface ApiResponse {
  open: number;
  closed: number;
  avg_response_time?: number;
  channels: Record<string, ChannelStats>;
}

export default function TrengoReport() {
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');
  const [channel, setChannel] = useState('');
  const [stats, setStats] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const chartRef = useRef<HTMLCanvasElement>(null);
  const chartInstance = useRef<any>(null);

  const fetchStats = async () => {
    if (!start || !end) return;
    setLoading(true);
    setError(null);
    setStats(null);
    try {
      const params = new URLSearchParams({ start, end });
      if (channel) params.append('channel', channel);
      const res = await fetch(`/api/trengo-stats?${params.toString()}`);
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || 'Failed to fetch');
      }
      const data = await res.json();
      setStats(data);
    } catch (err: any) {
      setError(err.message || 'Error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const Chart = (window as any).Chart;
    if (!Chart || !chartRef.current || !stats?.channels) return;

    if (chartInstance.current) chartInstance.current.destroy();

    const labels = Object.keys(stats.channels);
    const openData = labels.map(l => stats.channels[l].open);
    const closedData = labels.map(l => stats.channels[l].closed);

    chartInstance.current = new Chart(chartRef.current, {
      type: 'bar',
      data: {
        labels,
        datasets: [
          {
            label: 'Open',
            data: openData,
            backgroundColor: '#60a5fa',
          },
          {
            label: 'Closed',
            data: closedData,
            backgroundColor: '#4ade80',
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
      },
    });
  }, [stats]);

  return (
    <Layout title="Trengo Dashboard">
      <div className="space-y-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6 space-y-4">
          <h1 className="text-xl font-bold">Trengo Statistics</h1>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Start Date</label>
              <input type="date" className="input input-bordered w-full" value={start} onChange={e => setStart(e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">End Date</label>
              <input type="date" className="input input-bordered w-full" value={end} onChange={e => setEnd(e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Channel</label>
              <select className="select select-bordered w-full" value={channel} onChange={e => setChannel(e.target.value)}>
                <option value="">All</option>
                <option value="email">Email</option>
                <option value="chat">Chat</option>
                <option value="whatsapp">WhatsApp</option>
              </select>
            </div>
            <div className="flex items-end">
              <button className="btn btn-primary w-full" disabled={loading || !start || !end} onClick={fetchStats}>Fetch</button>
            </div>
          </div>
          {error && <p className="text-red-600 text-sm">{error}</p>}
        </div>

        {loading && (
          <div className="flex justify-center py-10">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        )}

        {stats && !loading && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="bg-white dark:bg-gray-800 rounded-lg p-4 text-center">
                <p className="text-sm text-gray-500">Open Tickets</p>
                <p className="text-2xl font-bold">{stats.open}</p>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-lg p-4 text-center">
                <p className="text-sm text-gray-500">Closed Tickets</p>
                <p className="text-2xl font-bold">{stats.closed}</p>
              </div>
              {typeof stats.avg_response_time !== 'undefined' && (
                <div className="bg-white dark:bg-gray-800 rounded-lg p-4 text-center">
                  <p className="text-sm text-gray-500">Avg Response (h)</p>
                  <p className="text-2xl font-bold">{stats.avg_response_time}</p>
                </div>
              )}
            </div>

            <div className="overflow-x-auto">
              <table className="table w-full">
                <thead>
                  <tr>
                    <th>Channel</th>
                    <th>Open</th>
                    <th>Closed</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(stats.channels).map(([name, s]) => (
                    <tr key={name} className="hover">
                      <td>{name}</td>
                      <td>{s.open}</td>
                      <td>{s.closed}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="h-72">
              <canvas ref={chartRef} />
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
