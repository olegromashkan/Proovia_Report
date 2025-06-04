import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import Card from '../components/Card';
import Modal from '../components/Modal';

type Summary = { total: number; complete: number; failed: number; avgPunctuality: number };

export default function Home() {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [open, setOpen] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/summary')
      .then(res => (res.ok ? res.json() : Promise.reject()))
      .then(setSummary)
      .catch(() => {});
  }, []);

  const cards = [
    { id: 'total', title: 'Total Trips', value: summary?.total ?? 0 },
    { id: 'complete', title: 'Completed', value: summary?.complete ?? 0 },
    { id: 'failed', title: 'Failed', value: summary?.failed ?? 0 },
    { id: 'avg', title: 'Avg Punctuality (m)', value: summary?.avgPunctuality ?? 0 },
  ];

  return (
    <Layout title="Home">
      <h1 className="text-2xl font-bold mb-2">Proovia Reporting Dashboard</h1>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {cards.map(c => (
          <Card key={c.id} title={c.title} value={c.value} onClick={() => setOpen(c.id)} />
        ))}
      </div>

      <Modal open={!!open} onClose={() => setOpen(null)}>
        <h2 className="text-xl font-bold mb-2">{cards.find(c => c.id === open)?.title}</h2>
        <div className="h-40 flex items-center justify-center text-gray-500">Graph Placeholder</div>
      </Modal>
    </Layout>
  );
}
