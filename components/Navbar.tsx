import { useState, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/router';
import ThemeToggle from './ThemeToggle';
import NotificationCenter from './NotificationCenter';
import SearchOverlay from './SearchOverlay';
import TasksPanel from './TasksPanel';
import AiChatPanel from './AiChatPanel';
import Icon from './Icon';
import UserMenu from './UserMenu';
import { Sparkles } from 'lucide-react';

interface NavLink {
  href: string;
  icon: string;
  label: string;
}

interface NavGroup {
  label: string;
  links: NavLink[];
}

export default function Navbar() {
  const router = useRouter();
  const [searchOpen, setSearchOpen] = useState(false);
  const [tasksOpen, setTasksOpen] = useState(false);
  const [aiOpen, setAiOpen] = useState(false);
  const [aiText, setAiText] = useState('');
  const [hoveredGroup, setHoveredGroup] = useState<string | null>(null);

  const navGroups: NavGroup[] = useMemo(() => [
    {
      label: 'General',
      links: [
        { href: '/', icon: 'house', label: 'Home' },
      ],
    },
    {
      label: 'Driver Control',
      links: [
        { href: '/upload', icon: 'upload', label: 'Upload' },
        { href: '/driver-routes', icon: 'signpost', label: 'Driver Routes' },
        { href: '/working-times', icon: 'clock', label: 'Working Times' },

      ],
    },
    {
      label: 'Reports',
      links: [
        { href: '/full-report', icon: 'table-list', label: 'Full Report' },
        { href: '/monthly-report', icon: 'calendar', label: 'Monthly' },
        { href: '/van-state', icon: 'truck', label: 'Van State' },
      ],
    },
    {
      label: 'Social',
      links: [
        { href: '/users', icon: 'people', label: 'Users' },
        { href: '/feed', icon: 'chat', label: 'Feed' },
        { href: '/messages', icon: 'chat-left', label: 'Messages' },

      ],
    },
    {
      label: 'Training',
      links: [
        { href: '/tests/dashboard', icon: 'layout-dashboard', label: 'Test Dashboard' },
        { href: '/training-test', icon: 'clipboard', label: 'Training Test' },
        { href: '/tests', icon: 'list', label: 'Test Results' },
      ],
    },
  ], []);

  const isActive = (href: string) => router.pathname === href;

  return (
    <>
      <nav className="bg-white dark:bg-gray-900 shadow-lg sticky top-0 z-50 transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-8">
              <Link href="/" className="flex items-center">
                <Image
                  src="https://cdn.proovia.uk/pd/images/logo/logo-default.svg"
                  alt="Proovia Logo"
                  width={120}
                  height={32}
                  className="h-8 w-auto transition-transform hover:scale-105"
                  onError={(e) => (e.currentTarget.src = '/fallback-logo.png')}
                  priority
                />
              </Link>
              <div className="flex items-center gap-4">
                {navGroups.map((group) => (
                  <div
                    key={group.label}
                    className="relative group"
                    onMouseEnter={() => setHoveredGroup(group.label)}
                    onMouseLeave={() => setHoveredGroup(null)}
                  >
                    <span className="text-sm font-medium text-gray-600 dark:text-gray-300 cursor-pointer px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                      {group.label}
                    </span>
                    <div
                      className={`absolute left-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-xl transition-all duration-200 transform ${hoveredGroup === group.label
                        ? 'opacity-100 translate-y-0'
                        : 'opacity-0 -translate-y-2 pointer-events-none'
                        }`}
                    >
                      <div className="py-2">
                        {group.links.map(({ href, icon, label }) => (
                          <Link
                            key={href}
                            href={href}
                            className={`flex items-center gap-2 px-4 py-2 text-sm transition-colors ${isActive(href)
                              ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300'
                              : 'text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700'
                              }`}
                          >
                            <Icon name={icon} className="w-4 h-4" />
                            {label}
                          </Link>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSearchOpen(true)}
                className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                aria-label="Open search"
              >
                <Icon name="search" className="w-5 h-5 text-gray-600 dark:text-gray-300" />
              </button>
              <button
                onClick={() => setTasksOpen(true)}
                className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                aria-label="Open tasks"
              >
                <Icon name="check" className="w-5 h-5 text-gray-600 dark:text-gray-300" />
              </button>
              <button
                onClick={() => setAiOpen(true)}
                className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                aria-label="Ask AI"
              >
                <Sparkles className="w-5 h-5 text-gray-600 dark:text-gray-300" />
              </button>
              <NotificationCenter />
                              <ThemeToggle />
              
              <UserMenu showName />
            </div>
          </div>
        </div>
      </nav>
      <SearchOverlay
        open={searchOpen}
        onClose={() => setSearchOpen(false)}
        onAskAi={(q) => {
          setAiText(q);
          setSearchOpen(false);
          setAiOpen(true);
        }}
      />
      <TasksPanel open={tasksOpen} onClose={() => setTasksOpen(false)} />
      <AiChatPanel open={aiOpen} onClose={() => setAiOpen(false)} initialText={aiText} />
    </>
  );
}