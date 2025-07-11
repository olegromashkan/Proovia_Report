import { useEffect, useState } from 'react';
import Link from 'next/link';
import Layout from '../../components/Layout';

interface TemplateInfo {
  id: number;
  name: string;
  created_at: string;
}

interface TestInfo {
  id: number;
  name: string;
  email: string;
  created_at: string;
  test_id: number | null;
}

export default function TestDashboard() {
  const [templates, setTemplates] = useState<TemplateInfo[]>([]);
  const [tests, setTests] = useState<TestInfo[]>([]);

  useEffect(() => {
    fetch('/api/test-templates')
      .then(res => (res.ok ? res.json() : Promise.reject()))
      .then(d => setTemplates(d.templates || []));
    fetch('/api/tests')
      .then(res => (res.ok ? res.json() : Promise.reject()))
      .then(d => setTests(d.tests || []));
  }, []);

  return (
    <Layout title="Test Dashboard">
      <div className="mb-8">
        <h2 className="text-lg font-semibold mb-2">Templates</h2>
        <Link href="/tests/templates/new" className="btn btn-primary mb-2">
          New Template
        </Link>
        <ul className="space-y-1">
          {templates.map(t => (
            <li key={t.id} className="flex justify-between border p-2 rounded">
              <span>{t.name}</span>
              <Link href={`/tests/templates/${t.id}`}>Edit</Link>
            </li>
          ))}
        </ul>
      </div>

      <div>
        <h2 className="text-lg font-semibold mb-2">Completed Tests</h2>
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
      </div>
    </Layout>
  );
}
