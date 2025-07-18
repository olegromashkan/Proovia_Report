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
  <div className={fullWidth ? 'w-full' : 'container mx-auto'} style={{ minHeight: '100vh' }}>
    {title && <h1 className="sr-only">{title}</h1>}
    {children}
  </div>
);

// Use FallbackLayout if Layout is not available
const ActiveLayout = typeof Layout === 'undefined' ? FallbackLayout : Layout;

export default function Settings() {
  const [tab, setTab] = useState(
    'database'
  );

  return (
    <ActiveLayout title="Settings" fullWidth>
      <div className="h-screen w-full flex overflow-hidden">
        {/* Sidebar - Fixed width */}
        <div className="w-42 flex-shrink-0 border-r border-gray-200 dark:border-gray-700" style={{ background: 'var(--section-bg)' }}>
          <div className="px-4 py-6">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Settings</h1>
            <nav className="space-y-1">
              <button
                onClick={() => setTab('database')}
                className={`
                  w-full px-4 py-3 text-sm font-medium transition-all duration-200 text-left rounded-lg
                  ${tab === 'database'
                    ? 'bg-[#b53133] text-white'
                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                  }
                `}
                aria-selected={tab === 'database'}
                role="tab"
              >
                Database
              </button>
              <button
                onClick={() => setTab('customize')}
                className={`
                  w-full px-4 py-3 text-sm font-medium transition-all duration-200 text-left rounded-lg
                  ${tab === 'customize'
                    ? 'bg-[#b53133] text-white'
                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                  }
                `}
                aria-selected={tab === 'customize'}
                role="tab"
              >
                Customize
              </button>
              <button
                onClick={() => setTab('users')}
                className={`
                  w-full px-4 py-3 text-sm font-medium transition-all duration-200 text-left rounded-lg
                  ${tab === 'users'
                    ? 'bg-[#b53133] text-white'
                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                  }
                `}
                aria-selected={tab === 'users'}
                role="tab"
              >
                Users
              </button>
              <button
                onClick={() => setTab('contractors')}
                className={`
                  w-full px-4 py-3 text-sm font-medium transition-all duration-200 text-left rounded-lg
                  ${tab === 'contractors'
                    ? 'bg-[#b53133] text-white'
                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                  }
                `}
                aria-selected={tab === 'contractors'}
                role="tab"
              >
                Contractors
              </button>
              <button
                onClick={() => setTab('upload')}
                className={`
                  w-full px-4 py-3 text-sm font-medium transition-all duration-200 text-left rounded-lg
                  ${tab === 'upload'
                    ? 'bg-[#b53133] text-white'
                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                  }
                `}
                aria-selected={tab === 'upload'}
                role="tab"
              >
                Upload Settings
              </button>
              <button
                onClick={() => setTab('backgrounds')}
                className={`
                  w-full px-4 py-3 text-sm font-medium transition-all duration-200 text-left rounded-lg
                  ${tab === 'backgrounds'
                    ? 'bg-[#b53133] text-white'
                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                  }
                `}
                aria-selected={tab === 'backgrounds'}
                role="tab"
              >
                Backgrounds
              </button>
            </nav>
          </div>
        </div>

        {/* Main Content - Flexible width with scroll */}
        <div className="flex-1 overflow-hidden">
          <div className="h-full overflow-auto px-4 sm:px-6 lg:px-8 py-6" style={{ background: 'var(--section-bg)' }}>
            {tab === 'database' && (
              <div className="h-full">
                <DatabasePanel />
              </div>
            )}
            {tab === 'customize' && (
              <div className="h-full">
                <CustomizePanel />
              </div>
            )}
            {tab === 'users' && (
              <div className="h-full">
                <UsersPanel />
              </div>
            )}
            {tab === 'contractors' && (
              <div className="h-full">
                <ContractorsPanel />
              </div>
            )}
            {tab === 'upload' && (
              <div className="h-full">
                <UploadSettingsPanel />
              </div>
            )}
            {tab === 'backgrounds' && (
              <div className="h-full">
                <BackgroundSettingsPanel />
              </div>
            )}
          </div>
        </div>
      </div>
    </ActiveLayout>
  );
}