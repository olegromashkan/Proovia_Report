import { useState } from 'react';
import Layout from '../components/Layout';
import AdminPanel from '../components/AdminPanel';
import CustomizePanel from '../components/CustomizePanel';

export default function Settings() {
  const [tab, setTab] = useState<'admin' | 'customize'>('admin');

  return (
    <Layout title="Settings" fullWidth>
      <div className="tabs mb-4">
        <button
          className={`tab tab-bordered ${tab === 'admin' ? 'tab-active' : ''}`}
          onClick={() => setTab('admin')}
        >
          Admin Panel
        </button>
        <button
          className={`tab tab-bordered ${tab === 'customize' ? 'tab-active' : ''}`}
          onClick={() => setTab('customize')}
        >
          Customize
        </button>
      </div>
      {tab === 'admin' ? <AdminPanel /> : <CustomizePanel />}
    </Layout>
  );
}
