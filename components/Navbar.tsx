import { useState, useEffect, useMemo, useRef } from 'react';
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
  label: string;
}

export default function Navbar() {
  const router = useRouter();
  const [searchOpen, setSearchOpen] = useState(false);
  const [tasksOpen, setTasksOpen] = useState(false);
  const [navOpen, setNavOpen] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [pinned, setPinned] = useState<string[]>([]);
  const [position, setPosition] = useState({ x: 16, y: 16 });
  const navRef = useRef<HTMLDivElement>(null);

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
    const pins = localStorage.getItem('pinnedLinks');
    if (pins) setPinned(JSON.parse(pins));
    const handleResize = () => {
      const size = 48;
      const margin = 16;
      const w = window.innerWidth;
      const h = window.innerHeight;
      let { x, y } = position;
      if (x + size + margin > w) x = w - size - margin;
      if (y + size + margin > h) y = h - size - margin;
      if (x < margin) x = margin;
      if (y < margin) y = margin;
      setPosition({ x, y });
      localStorage.setItem('navBubble', JSON.stringify({ x, y }));
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [position]);

  const handleDragEnd = (_: any, info: any) => {
    const size = 48;
    const margin = 16;
    let x = info.point.x;
    let y = info.point.y;
    const w = window.innerWidth;
    const h = window.innerHeight;
    const dists = [
      { edge: 'left', val: x },
      { edge: 'right', val: w - x - size },
      { edge: 'top', val: y },
      { edge: 'bottom', val: h - y - size },
    ].sort((a, b) => a.val - b.val);
    switch (dists[0].edge) {
      case 'left':
        x = margin;
        y = Math.min(Math.max(y, margin), h - size - margin);
        break;
      case 'right':
        x = w - size - margin;
        y = Math.min(Math.max(y, margin), h - size - margin);
        break;
      case 'top':
        y = margin;
        x = Math.min(Math.max(x, margin), w - size - margin);
        break;
      case 'bottom':
        y = h - size - margin;
        x = Math.min(Math.max(x, margin), w - size - margin);
        break;
    }
    setPosition({ x, y });
    localStorage.setItem('navBubble', JSON.stringify({ x, y }));
  };

  const edge = useMemo(() => {
    if (typeof window === 'undefined') return 'left';
    const size = 48;
    const margin = 16;
    const w = window.innerWidth;
    const h = window.innerHeight;
    if (Math.abs(position.x - margin) < 1) return 'left';
    if (Math.abs(position.x - (w - size - margin)) < 1) return 'right';
    if (Math.abs(position.y - margin) < 1) return 'top';
    if (Math.abs(position.y - (h - size - margin)) < 1) return 'bottom';
    return 'left';
  }, [position]);

  const togglePin = (href: string) => {
    setPinned(prev => {
      const next = prev.includes(href)
        ? prev.filter(p => p !== href)
        : [...prev, href];
      localStorage.setItem('pinnedLinks', JSON.stringify(next));
      return next;
    });
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
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
          className="relative"
        >
          <div
            className="w-12 h-12 rounded-full bg-white dark:bg-gray-800 shadow-md flex items-center justify-center"
            onClick={() => setNavOpen(o => !o)}
          >
            <Icon name="list" className="w-6 h-6 text-gray-600 dark:text-gray-300" />
          </div>
          <AnimatePresence>
            {hovered && !navOpen && pinned.length > 0 && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.15 }}
                className={`absolute ${
                  edge === 'left'
                    ? 'left-14 top-1/2 -translate-y-1/2 flex flex-col'
                    : edge === 'right'
                    ? 'right-14 top-1/2 -translate-y-1/2 flex flex-col'
                    : edge === 'top'
                    ? 'top-14 left-1/2 -translate-x-1/2 flex flex-row'
                    : 'bottom-14 left-1/2 -translate-x-1/2 flex flex-row'
                } gap-3`}
              >
                {pinned
                  .map(h => navLinks.find(l => l.href === h))
                  .filter((l): l is NavLink => !!l)
                  .map(({ href, icon, label }) => (
                    <Link key={href} href={href} className="w-10 h-10 rounded-full bg-white dark:bg-gray-800 shadow flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-700" aria-label={label}>
                      <Icon name={icon} className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                    </Link>
                  ))}
              </motion.div>
            )}
          </AnimatePresence>
          <AnimatePresence>
            {navOpen && (
              <motion.aside
                ref={navRef}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.15 }}
                className={`absolute ${
                  edge === 'left'
                    ? 'left-14 top-1/2 -translate-y-1/2'
                    : edge === 'right'
                    ? 'right-14 top-1/2 -translate-y-1/2'
                    : edge === 'top'
                    ? 'top-14 left-1/2 -translate-x-1/2'
                    : 'bottom-14 left-1/2 -translate-x-1/2'
                } w-64 max-h-[calc(100vh-4rem)] overflow-y-auto bg-white dark:bg-gray-800 p-4 flex flex-col rounded-2xl shadow-2xl`}
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
                    {navLinks.map(({ href, icon, label }) => {
                      const isPinned = pinned.includes(href);
                      return (
                        <Link
                          key={href}
                          href={href}
                          aria-current={isActive(href) ? 'page' : undefined}
                          className={`group flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 ${
                            isActive(href)
                              ? 'bg-[#b53133] text-white shadow-md'
                              : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white'
                          }`}
                        >
                          <Icon name={icon} className="w-5 h-5" />
                          <span className="flex-1">{label}</span>
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              togglePin(href);
                            }}
                            className="ml-auto p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 opacity-0 group-hover:opacity-100 transition-opacity"
                            aria-label={isPinned ? 'Unpin' : 'Pin'}
                          >
                            <Icon name={isPinned ? 'star-fill' : 'star'} className="w-4 h-4" />
                          </button>
                        </Link>
                      );
                    })}
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
