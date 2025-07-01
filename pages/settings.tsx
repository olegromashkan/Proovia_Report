import { useState } from 'react';
import Layout from '../components/Layout';
import DatabasePanel from '../components/DatabasePanel';
import CustomizePanel from '../components/CustomizePanel';
import UsersPanel from '../components/UsersPanel';
import UploadSettingsPanel from '../components/UploadSettingsPanel';
import BackgroundSettingsPanel from '../components/BackgroundSettingsPanel';
import ContractorsPanel from '../components/ContractorsPanel';

// Fallback Layout component if the import fails
const FallbackLayout = ({ children, title, fullWidth }: { children: React.ReactNode; title?: string; fullWidth?: boolean; hideNavbar?: boolean }) => (
  <div className={fullWidth ? 'w-full' : 'container mx-auto'} style={{ minHeight: '100vh' }}>
    {title && <h1 className="sr-only">{title}</h1>}
    {children}
  </div>
);

// Use FallbackLayout if Layout is not available; replace with actual Layout once verified
const ActiveLayout = typeof Layout === 'undefined' ? FallbackLayout : Layout;

export default function Settings() {
  const [tab, setTab] = useState<
    'database' |
    'customize' |
    'users' |
    'upload' |
    'backgrounds' |
    'contractors'
  >('database');

  return (
    <ActiveLayout title="Settings" fullWidth>
      <div className="h-screen w-full flex flex-col overflow-hidden">
        {/* Header - Fixed height */}
        <div className="flex-shrink-0 px-4 sm:px-6 lg:px-8 py-6 border-b border-gray-200 dark:border-gray-700" style={{ background: 'var(--section-bg)' }}>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Settings</h1>
        </div>

        {/* Tab Navigation - Fixed height */}
        <div className="flex-shrink-0 px-4 sm:px-6 lg:px-8 border-b border-gray-200 dark:border-gray-700" style={{ background: 'var(--section-bg)' }}>
          <div className="flex">
            <button
              onClick={() => setTab('database')}
              className={`
                px-6 py-4 text-sm font-medium transition-all duration-200 relative
                ${tab === 'database'
                  ? 'text-[#b53133]'
                  : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
                }
              `}
              aria-selected={tab === 'database'}
              role="tab"
            >
              Database
              {tab === 'database' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#b53133]"></div>
              )}
            </button>
            <button
              onClick={() => setTab('customize')}
              className={`
                px-6 py-4 text-sm font-medium transition-all duration-200 relative
                ${tab === 'customize'
                  ? 'text-[#b53133]'
                  : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
                }
              `}
              aria-selected={tab === 'customize'}
              role="tab"
            >
              Customize
              {tab === 'customize' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#b53133]"></div>
              )}
            </button>
            <button
              onClick={() => setTab('users')}
              className={`
                px-6 py-4 text-sm font-medium transition-all duration-200 relative
                ${tab === 'users'
                  ? 'text-[#b53133]'
                  : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
                }
              `}
              aria-selected={tab === 'users'}
              role="tab"
            >
              Users
              {tab === 'users' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#b53133]"></div>
              )}
            </button>
            <button
              onClick={() => setTab('contractors')}
              className={`
                px-6 py-4 text-sm font-medium transition-all duration-200 relative
                ${tab === 'contractors'
                  ? 'text-[#b53133]'
                  : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
                }
              `}
              aria-selected={tab === 'contractors'}
              role="tab"
            >
              Contractors
              {tab === 'contractors' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#b53133]"></div>
              )}
            </button>
            <button
              onClick={() => setTab('upload')}
              className={`
                px-6 py-4 text-sm font-medium transition-all duration-200 relative
                ${tab === 'upload'
                  ? 'text-[#b53133]'
                  : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
                }
              `}
              aria-selected={tab === 'upload'}
              role="tab"
            >
              Upload Settings
              {tab === 'upload' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#b53133]"></div>
              )}
            </button>
            <button
              onClick={() => setTab('backgrounds')}
              className={`
                px-6 py-4 text-sm font-medium transition-all duration-200 relative
                ${tab === 'backgrounds'
                  ? 'text-[#b53133]'
                  : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
                }
              `}
              aria-selected={tab === 'backgrounds'}
              role="tab"
            >
              Backgrounds
              {tab === 'backgrounds' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#b53133]"></div>
              )}
            </button>
          </div>
        </div>

        {/* Tab Content - Flexible height with scroll */}
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