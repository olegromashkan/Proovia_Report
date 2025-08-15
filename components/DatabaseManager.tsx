import React, { useEffect, useState } from 'react';
import DatabasePanel from './DatabasePanel';

export default function DatabaseManager() {
  const [status, setStatus] = useState<'connected' | 'disconnected'>('disconnected');
  const [config, setConfig] = useState({ host: '', port: '', user: '', password: '', database: '' });
  const [query, setQuery] = useState('');
  const [queryResult, setQueryResult] = useState<any>(null);
  const [tableName, setTableName] = useState('');
  const [tableCols, setTableCols] = useState('');
  const [tableMsg, setTableMsg] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/db-test')
      .then(res => setStatus(res.ok ? 'connected' : 'disconnected'))
      .catch(() => setStatus('disconnected'));
  }, []);

  const handleConnect = async () => {
    try {
      const res = await fetch('/api/db-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      });
      setStatus(res.ok ? 'connected' : 'disconnected');
    } catch {
      setStatus('disconnected');
    }
  };

  const runQuery = async () => {
    try {
      const res = await fetch('/api/sql', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query }),
      });
      const data = await res.json();
      setQueryResult(data);
    } catch (err: any) {
      setQueryResult({ error: err.message });
    }
  };

  const createTable = async () => {
    try {
      const res = await fetch('/api/sql', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: `CREATE TABLE ${tableName} (${tableCols})` }),
      });
      const data = await res.json();
      setTableMsg(data.error ? data.error : 'Table created');
    } catch (err: any) {
      setTableMsg(err.message);
    }
  };

  return (
    <div className="space-y-8">
      <section className="p-4 bg-white dark:bg-gray-800 rounded shadow">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Connection</h2>
          <span className={`flex items-center gap-2 ${status === 'connected' ? 'text-green-600' : 'text-red-600'}`}>
            <span className={`w-3 h-3 rounded-full ${status === 'connected' ? 'bg-green-500' : 'bg-red-500'}`}></span>
            {status}
          </span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-4">
          <input className="input input-bordered" placeholder="Host" value={config.host} onChange={e => setConfig({ ...config, host: e.target.value })} />
          <input className="input input-bordered" placeholder="Port" value={config.port} onChange={e => setConfig({ ...config, port: e.target.value })} />
          <input className="input input-bordered" placeholder="User" value={config.user} onChange={e => setConfig({ ...config, user: e.target.value })} />
          <input className="input input-bordered" type="password" placeholder="Password" value={config.password} onChange={e => setConfig({ ...config, password: e.target.value })} />
          <input className="input input-bordered md:col-span-2" placeholder="Database" value={config.database} onChange={e => setConfig({ ...config, database: e.target.value })} />
        </div>
        <button className="btn btn-primary mt-4" onClick={handleConnect}>Connect</button>
      </section>

      <section className="p-4 bg-white dark:bg-gray-800 rounded shadow">
        <h2 className="text-lg font-semibold mb-2">SQL Query</h2>
        <textarea className="textarea textarea-bordered w-full" rows={4} placeholder="SELECT * FROM table" value={query} onChange={e => setQuery(e.target.value)} />
        <button className="btn btn-secondary mt-2" onClick={runQuery}>Run</button>
        {queryResult && (
          <pre className="mt-2 p-2 bg-gray-100 dark:bg-gray-900 text-xs overflow-auto max-h-64">{JSON.stringify(queryResult, null, 2)}</pre>
        )}
      </section>

      <section className="p-4 bg-white dark:bg-gray-800 rounded shadow">
        <h2 className="text-lg font-semibold mb-2">Create Table</h2>
        <div className="flex flex-col md:flex-row gap-2">
          <input className="input input-bordered flex-1" placeholder="Table name" value={tableName} onChange={e => setTableName(e.target.value)} />
          <input className="input input-bordered flex-1" placeholder="Columns (e.g. id SERIAL PRIMARY KEY)" value={tableCols} onChange={e => setTableCols(e.target.value)} />
        </div>
        <button className="btn btn-accent mt-2" onClick={createTable}>Create</button>
        {tableMsg && <p className="mt-2 text-sm">{tableMsg}</p>}
      </section>

      <section>
        <h2 className="text-lg font-semibold mb-2">Existing Tables</h2>
        <DatabasePanel />
      </section>
    </div>
  );
}

