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
import { motion, AnimatePresence } from 'framer-motion';

interface NavLink {
  href: string;
  icon: string;
  label:string;
}

export default function Navbar() {
  const router = useRouter();
  const [searchOpen, setSearchOpen] = useState(false);
  const [tasksOpen, setTasksOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [position, setPosition] = useState({ x: 20, y: 20 });

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

  useEffect(() => {
    const saved = localStorage.getItem('navBubble');
    if (saved) setPosition(JSON.parse(saved));
  }, []);


  const handleDragEnd = (_: any, info: any) => {
    const x = info.point.x;
    const y = info.point.y;
    setPosition({ x, y });
    localStorage.setItem('navBubble', JSON.stringify({ x, y }));
  };

  return (
    <>
      <motion.div
        drag
        dragMomentum={false}
        onDragEnd={handleDragEnd}
        animate={position}
        className="fixed z-50"
      >
        <div
          onMouseEnter={() => setMenuOpen(true)}
          onMouseLeave={() => setMenuOpen(false)}
          className="relative"
        >
          <div className="w-12 h-12 rounded-full bg-white dark:bg-gray-800 shadow-md flex items-center justify-center">
            <Icon name="list" className="w-6 h-6 text-gray-600 dark:text-gray-300" />
          </div>
          <AnimatePresence>
            {menuOpen && (
              <motion.aside
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.15 }}
                className="absolute left-14 top-1/2 -translate-y-1/2 w-64 bg-white dark:bg-gray-800 p-4 flex flex-col rounded-2xl shadow-2xl"
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
                        <Icon name={icon} className="w-5 h-5" />
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
              </motion.aside>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      <SearchOverlay open={searchOpen} onClose={() => setSearchOpen(false)} />
      <TasksPanel open={tasksOpen} onClose={() => setTasksOpen(false)} />
    </>
  );
}

