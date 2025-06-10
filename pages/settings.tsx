import { useState } from 'react';
import Layout from '../components/Layout';
import AdminPanel from '../components/AdminPanel';
import CustomizePanel from '../components/CustomizePanel';
import UsersPanel from '../components/UsersPanel';

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
  const [tab, setTab] = useState<'admin' | 'customize' | 'users'>('admin');

  return (
    <ActiveLayout title="Settings" fullWidth>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Settings</h1>

        {/* Tab Navigation */}
        <div className="flex border-b border-gray-200 dark:border-gray-700 mb-8">
          <button
            onClick={() => setTab('admin')}
            style={tab === 'admin' ? { background: 'var(--section-bg)' } : undefined}
            className={`
              px-6 py-3 text-sm font-medium rounded-t-lg transition-all duration-200
              ${tab === 'admin'
                ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
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
            style={tab === 'customize' ? { background: 'var(--section-bg)' } : undefined}
            className={`
              px-6 py-3 text-sm font-medium rounded-t-lg transition-all duration-200
              ${tab === 'customize'
                ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
                : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
              }
            `}
            aria-selected={tab === 'customize'}
            role="tab"
          >
            Customize
          </button>
          <button
            onClick={() => setTab('users')}
            style={tab === 'users' ? { background: 'var(--section-bg)' } : undefined}
            className={`
              px-6 py-3 text-sm font-medium rounded-t-lg transition-all duration-200
              ${tab === 'users'
                ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
                : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
              }
            `}
            aria-selected={tab === 'users'}
            role="tab"
          >
            Users
          </button>
        </div>

        {/* Tab Content */}
        <div className="shadow-md rounded-lg p-6" style={{ background: 'var(--section-bg)' }}>
          {tab === 'admin' && <AdminPanel />}
          {tab === 'customize' && <CustomizePanel />}
          {tab === 'users' && <UsersPanel />}
        </div>
      </div>
    </ActiveLayout>
  );
}