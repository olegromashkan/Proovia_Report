import { useEffect, useState } from 'react';
import Link from 'next/link';
import Layout from '../components/Layout';

interface TestInfo {
  id: number;
  name: string;
  email: string;
  created_at: string;
  test_id: number | null;
}

export default function TestsPage() {
  const [tests, setTests] = useState<TestInfo[]>([]);

  useEffect(() => {
    fetch('/api/tests')
      .then(res => (res.ok ? res.json() : Promise.reject()))
      .then(data => setTests(data.tests || []))
      .catch(() => setTests([]));
  }, []);

  return (
    <Layout title="Tests">
      <table className="table-auto w-full">
        <thead>
          <tr>
            <th className="text-left">Name</th>
            <th className="text-left">Email</th>
            <th className="text-left">Date</th>
            <th className="text-left">Template</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {tests.map(t => (
            <tr key={t.id} className="border-t">
              <td>{t.name}</td>
              <td>{t.email}</td>
              <td>{new Date(t.created_at).toLocaleString()}</td>
              <td>{t.test_id ?? '-'}</td>
              <td>
                <Link href={`/tests/${t.id}`}>Open</Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </Layout>
  );
}
