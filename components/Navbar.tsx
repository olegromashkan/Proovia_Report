import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/router';
import ThemeToggle from './ThemeToggle';
import NotificationCenter from './NotificationCenter';
import SearchOverlay from './SearchOverlay';
import Icon from './Icon';
import UserMenu from './UserMenu';
import TasksPanel from './TasksPanel';

interface NavLink {
  href: string;
  icon: string;
  label: string;
}

export default function Navbar({ isSidebarOpen, setIsSidebarOpen }: { isSidebarOpen: boolean; setIsSidebarOpen: (open: boolean) => void }) {
  const router = useRouter();
  const [searchOpen, setSearchOpen] = useState(false);
  const [tasksOpen, setTasksOpen] = useState(false);

  const navLinks: NavLink[] = [
    { href: '/', icon: 'house', label: 'Home' },
    { href: '/feed', icon: 'chat', label: 'Feed' },
    { href: '/upload', icon: 'upload', label: 'Upload' },
    { href: '/driver-routes', icon: 'signpost', label: 'Driver Routes' },
    { href: '/full-report', icon: 'table-list', label: 'Full Report' },
    { href: '/van-state', icon: 'truck', label: 'Van State' },
    { href: '/users', icon: 'people', label: 'Users' },
    { href: '/messages', icon: 'chat-left', label: 'Messages' },
  ];

  const isActive = (href: string) => router.pathname === href;

  return (
    <>
      <aside
        className={`fixed inset-y-0 left-0 w-60 bg-white dark:bg-gray-800 p-4 flex flex-col justify-between shadow-lg transition-transform z-40 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}
      >
        <div className="flex-1 flex flex-col space-y-6">
          <Link href="/" className="flex items-center gap-2">
            <Image
              src="https://cdn.proovia.uk/pd/images/logo/logo-default.svg"
              alt="Proovia Logo"
              width={120}
              height={32}
              className="h-8 w-auto"
              onError={(e) => (e.currentTarget.src = '/fallback-logo.png')}
            />
          </Link>
          <nav className="space-y-1">
            {navLinks.map(({ href, icon, label }) => (
              <Link
                key={href}
                href={href}
                aria-current={isActive(href) ? 'page' : undefined}
                className={`flex items-center gap-3 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${isActive(href) ? 'bg-[#b53133]/10 text-[#b53133]' : 'text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
              >
                <Icon
                  name={icon}
                  className={`w-5 h-5 ${isActive(href) ? 'text-[#b53133]' : 'text-gray-500 dark:text-gray-400'}`}
                />
                <span>{label}</span>
              </Link>
            ))}
          </nav>
        </div>
        <div className="flex flex-col gap-2 pt-4 border-t border-gray-200/20 dark:border-gray-700/20">
          <button
            onClick={() => setSearchOpen(true)}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            aria-label="Open search"
          >
            <Icon name="search" className="w-5 h-5 text-gray-600 dark:text-gray-300" />
          </button>
          <NotificationCenter />
          <button
            onClick={() => setTasksOpen(true)}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            aria-label="Open tasks"
          >
            <Icon name="check" className="w-5 h-5 text-gray-600 dark:text-gray-300" />
          </button>
          <UserMenu />
          <ThemeToggle />
          <button
            onClick={() => setIsSidebarOpen(false)}
            className="p-2 mt-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors md:hidden"
            aria-label="Hide sidebar"
          >
            <Icon name="xmark" className="w-5 h-5 text-gray-600 dark:text-gray-300" />
          </button>
        </div>
      </aside>

      {isSidebarOpen && (
        <div className="fixed inset-0 bg-black/40 z-30 md:hidden" onClick={() => setIsSidebarOpen(false)} />
      )}

      <button
        onClick={() => setIsSidebarOpen(true)}
        className={`fixed top-4 left-4 z-40 p-2 bg-white dark:bg-gray-800 rounded-lg shadow md:hidden transition-all ${isSidebarOpen ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
        aria-label="Show sidebar"
      >
        <Icon name="list" className="w-5 h-5 text-gray-600 dark:text-gray-300" />
      </button>

      <SearchOverlay open={searchOpen} onClose={() => setSearchOpen(false)} />
      <TasksPanel open={tasksOpen} onClose={() => setTasksOpen(false)} />
    </>
  );
}
