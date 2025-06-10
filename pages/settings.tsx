import { useState } from 'react';
import Layout from '../components/Layout';
import AdminPanel from '../components/AdminPanel';
import CustomizePanel from '../components/CustomizePanel';

// Fallback Layout component if the import fails
const FallbackLayout = ({ children, title, fullWidth }: { children: React.ReactNode; title?: string; fullWidth?: boolean }) => (
  <div className={fullWidth ? 'w-full' : 'container mx-auto'} style={{ minHeight: '100vh' }}>
    {title && <h1 className="sr-only">{title}</h1>}
    {children}
  </div>
);

// Use FallbackLayout if Layout is not available; replace with actual Layout once verified
const ActiveLayout = typeof Layout === 'undefined' ? FallbackLayout : Layout;

export default function Settings() {
  const [tab, setTab] = useState<'admin' | 'customize'>('admin');

  return (
    <ActiveLayout title="Settings" fullWidth>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Settings</h1>

        {/* Tab Navigation */}
        <div className="flex border-b border-gray-200 dark:border-gray-700 mb-8">
          <button
            onClick={() => setTab('admin')}
            className={`
              px-6 py-3 text-sm font-medium rounded-t-lg transition-all duration-200
              ${tab === 'admin'
                ? 'bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
                : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
              }
            `}
            aria-selected={tab === 'admin'}
            role="tab"
          >
            Admin Panel
          </button>
          <button
            onClick={() => setTab('customize')}
            className={`
              px-6 py-3 text-sm font-medium rounded-t-lg transition-all duration-200
              ${tab === 'customize'
                ? 'bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
                : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
              }
            `}
            aria-selected={tab === 'customize'}
            role="tab"
          >
            Customize
          </button>
        </div>

        {/* Tab Content */}
        <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg p-6">
          {tab === 'admin' ? <AdminPanel /> : <CustomizePanel />}
        </div>
      </div>
    </ActiveLayout>
  );
}