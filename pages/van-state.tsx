import { useEffect, useMemo, useState } from 'react';
import Layout from '../components/Layout';
import VanCheck from '../components/VanCheck';
import Modal from '../components/Modal';

interface VanCheckData {
  van_id: string;
  driver_id?: string;
  date: string;
  [key: string]: any;
}

export default function VanState() {
  const [checks, setChecks] = useState<VanCheckData[]>([]);
  const [selected, setSelected] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/van-checks')
      .then(res => (res.ok ? res.json() : Promise.reject()))
      .then(data => setChecks(data.items || []))
      .catch(() => {});
  }, []);

  const latest = useMemo(() => {
    const map: Record<string, VanCheckData> = {};
    checks.forEach(c => {
      if (!c.van_id) return;
      const existing = map[c.van_id];
      const d = new Date(c.date);
      if (!existing || d > new Date(existing.date)) {
        map[c.van_id] = c;
      }
    });
    return Object.values(map).sort((a, b) => a.van_id.localeCompare(b.van_id));
  }, [checks]);

  const history = useMemo(() => {
    const map: Record<string, VanCheckData[]> = {};
    checks.forEach(c => {
      if (!c.van_id) return;
      if (!map[c.van_id]) map[c.van_id] = [];
      map[c.van_id].push(c);
    });
    Object.values(map).forEach(arr =>
      arr.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    );
    return map;
  }, [checks]);

  return (
    <Layout title="Van State">
      <h1 className="text-2xl font-bold mb-4">Van State</h1>
      <div className="space-y-2">
        {latest.map(vc => (
          <div key={vc.van_id} onClick={() => setSelected(vc.van_id)} className="cursor-pointer">
            <VanCheck data={vc} />
          </div>
        ))}
      </div>
      <Modal open={!!selected} onClose={() => setSelected(null)} className="max-w-3xl">
        <h2 className="text-xl font-bold mb-4">History for {selected}</h2>
        <div className="space-y-2 max-h-[70vh] overflow-y-auto">
          {selected &&
            (history[selected] || []).map((vc, idx) => (
              <VanCheck key={idx} data={vc} />
            ))}
        </div>
      </Modal>
    </Layout>
  );
}
