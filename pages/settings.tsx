import { useState } from 'react';
import Layout from '../components/Layout';
import DatabasePanel from '../components/DatabasePanel';
import CustomizePanel from '../components/CustomizePanel';
import UsersPanel from '../components/UsersPanel';
import UploadSettingsPanel from '../components/UploadSettingsPanel';
import BackgroundSettingsPanel from '../components/BackgroundSettingsPanel';
import ContractorsPanel from '../components/ContractorsPanel';

// Fallback Layout component if the import fails
const FallbackLayout = ({ children, title, fullWidth }) => (
  <div className={fullWidth ? 'w-full' : 'container mx-auto'} style={{ minHeight: 'calc(100vh - 64px)' }}>
    {title && <h1 className="sr-only">{title}</h1>}
    {children}
  </div>
);

// Use FallbackLayout if Layout is not available
const ActiveLayout = typeof Layout === 'undefined' ? FallbackLayout : Layout;

export default function Settings() {
  const [tab, setTab] = useState('database');

  return (
    <ActiveLayout title="Settings" fullWidth>
      <div className="flex flex-col md:flex-row w-full overflow-hidden" style={{ height: 'calc(100vh - 70px)' }}>
        {/* Sidebar - Responsive: full width on mobile, fixed on desktop */}
        <div className="w-full md:w-56 flex-shrink-0 border-b md:border-b-0 md:border-r border-gray-200 dark:border-gray-700 shadow-md md:shadow-none" style={{ background: 'var(--section-bg)' }}>
          <div className="px-4 py-4 md:py-6">
            <h1 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white mb-4 md:mb-6 hidden md:block">Settings</h1>
            <nav className="flex md:flex-col overflow-x-auto md:overflow-x-visible space-x-2 md:space-x-0 md:space-y-1 scrollbar-hide">
              <button
                onClick={() => setTab('database')}
                className={`
                  flex items-center px-3 py-2 text-sm font-medium transition-all duration-200 rounded-lg whitespace-nowrap
                  ${tab === 'database'
                    ? 'bg-[#b53133] text-white shadow-sm'
                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                  }
                `}
                aria-selected={tab === 'database'}
                role="tab"
              >
                <i className="bi bi-database-fill mr-2" />
                <span className="hidden md:inline">Database</span>
                <span className="md:hidden">DB</span>
              </button>
              <button
                onClick={() => setTab('customize')}
                className={`
                  flex items-center px-3 py-2 text-sm font-medium transition-all duration-200 rounded-lg whitespace-nowrap
                  ${tab === 'customize'
                    ? 'bg-[#b53133] text-white shadow-sm'
                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                  }
                `}
                aria-selected={tab === 'customize'}
                role="tab"
              >
                <i className="bi bi-pencil-square mr-2" />
                <span className="hidden md:inline">Customize</span>
                <span className="md:hidden">Cust</span>
              </button>
              <button
                onClick={() => setTab('users')}
                className={`
                  flex items-center px-3 py-2 text-sm font-medium transition-all duration-200 rounded-lg whitespace-nowrap
                  ${tab === 'users'
                    ? 'bg-[#b53133] text-white shadow-sm'
                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                  }
                `}
                aria-selected={tab === 'users'}
                role="tab"
              >
                <i className="bi bi-people-fill mr-2" />
                <span className="hidden md:inline">Users</span>
                <span className="md:hidden">Users</span>
              </button>
              <button
                onClick={() => setTab('contractors')}
                className={`
                  flex items-center px-3 py-2 text-sm font-medium transition-all duration-200 rounded-lg whitespace-nowrap
                  ${tab === 'contractors'
                    ? 'bg-[#b53133] text-white shadow-sm'
                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                  }
                `}
                aria-selected={tab === 'contractors'}
                role="tab"
              >
                <i className="bi bi-briefcase-fill mr-2" />
                <span className="hidden md:inline">Contractors</span>
                <span className="md:hidden">Contr</span>
              </button>
              <button
                onClick={() => setTab('upload')}
                className={`
                  flex items-center px-3 py-2 text-sm font-medium transition-all duration-200 rounded-lg whitespace-nowrap
                  ${tab === 'upload'
                    ? 'bg-[#b53133] text-white shadow-sm'
                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                  }
                `}
                aria-selected={tab === 'upload'}
                role="tab"
              >
                <i className="bi bi-upload mr-2" />
                <span className="hidden md:inline">Upload Settings</span>
                <span className="md:hidden">Upload</span>
              </button>
              <button
                onClick={() => setTab('backgrounds')}
                className={`
                  flex items-center px-3 py-2 text-sm font-medium transition-all duration-200 rounded-lg whitespace-nowrap
                  ${tab === 'backgrounds'
                    ? 'bg-[#b53133] text-white shadow-sm'
                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                  }
                `}
                aria-selected={tab === 'backgrounds'}
                role="tab"
              >
                <i className="bi bi-image-fill mr-2" />
                <span className="hidden md:inline">Backgrounds</span>
                <span className="md:hidden">BGs</span>
              </button>
            </nav>
          </div>
        </div>

        {/* Main Content - Flexible with internal scroll if needed */}
        <div className="flex-1 min-h-0">
          <div className="h-full overflow-auto px-4 py-4 md:px-6 md:py-6 lg:px-8 lg:py-6" style={{ background: 'var(--section-bg)' }}>
            {tab === 'database' && <DatabasePanel />}
            {tab === 'customize' && <CustomizePanel />}
            {tab === 'users' && <UsersPanel />}
            {tab === 'contractors' && <ContractorsPanel />}
            {tab === 'upload' && <UploadSettingsPanel />}
            {tab === 'backgrounds' && <BackgroundSettingsPanel />}
          </div>
        </div>
      </div>
    </ActiveLayout>
  );
}