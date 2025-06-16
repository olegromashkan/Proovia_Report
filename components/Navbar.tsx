import { useState, useEffect } from 'react';
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
  label:string;
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

  // Close sidebar on route change on mobile
  useEffect(() => {
    const handleRouteChange = () => {
      if (window.innerWidth < 768) {
        setIsSidebarOpen(false);
      }
    };

    router.events.on('routeChangeComplete', handleRouteChange);
    return () => {
      router.events.off('routeChangeComplete', handleRouteChange);
    };
  }, [router.events, setIsSidebarOpen]);


  return (
    <>
      {/* Overlay for mobile */}
      <div
        className={`fixed inset-0 bg-black/50 z-30 md:hidden transition-opacity ${isSidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={() => setIsSidebarOpen(false)}
        aria-hidden="true"
      />

      {/* Sidebar */}
      <aside
        className={`fixed top-4 bottom-4 left-4 w-64 bg-white dark:bg-gray-800 p-4 flex flex-col rounded-2xl shadow-2xl transition-transform duration-300 ease-in-out z-40 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-[calc(100%+2rem)] md:translate-x-0'}`}
      >
        <div className="flex-1 flex flex-col space-y-6">
          <Link href="/" className="flex items-center gap-3 px-2">
            <Image
              src="https://cdn.proovia.uk/pd/images/logo/logo-default.svg"
              alt="Proovia Logo"
              width={120}
              height={32}
              className="h-8 w-auto"
              onError={(e) => (e.currentTarget.src = '/fallback-logo.png')}
            />
          </Link>

          <nav className="flex-1 space-y-2 px-2">
            {navLinks.map(({ href, icon, label }) => (
              <Link
                key={href}
                href={href}
                aria-current={isActive(href) ? 'page' : undefined}
                className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 ${
                  isActive(href)
                    ? 'bg-[#b53133] text-white shadow-md'
                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                <Icon
                  name={icon}
                  className="w-5 h-5"
                />
                <span>{label}</span>
              </Link>
            ))}
          </nav>
        </div>

        <div className="flex items-center justify-around p-2 border-t border-gray-200/20 dark:border-gray-700/20">
            <ThemeToggle />
            <NotificationCenter />
            <button
              onClick={() => setSearchOpen(true)}
              className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              aria-label="Open search"
            >
              <Icon name="search" className="w-5 h-5 text-gray-600 dark:text-gray-300" />
            </button>
             <button
              onClick={() => setTasksOpen(true)}
              className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              aria-label="Open tasks"
            >
              <Icon name="check" className="w-5 h-5 text-gray-600 dark:text-gray-300" />
            </button>
            <UserMenu />
        </div>
      </aside>

      {/* Hamburger Menu Button */}
      <button
        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        className={`fixed top-6 left-6 z-50 p-2 bg-white dark:bg-gray-800 rounded-full shadow-md md:hidden transition-all duration-300 ease-in-out ${isSidebarOpen ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
        aria-label="Toggle sidebar"
      >
        <Icon name={isSidebarOpen ? 'xmark' : 'list'} className="w-5 h-5 text-gray-600 dark:text-gray-300" />
      </button>

      <SearchOverlay open={searchOpen} onClose={() => setSearchOpen(false)} />
      <TasksPanel open={tasksOpen} onClose={() => setTasksOpen(false)} />
    </>
  );
}