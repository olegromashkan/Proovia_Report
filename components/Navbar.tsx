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
  label: string;
}

export default function Navbar({ isSidebarOpen, setIsSidebarOpen }: { isSidebarOpen: boolean; setIsSidebarOpen: (open: boolean) => void }) {
  // State management
  const [searchOpen, setSearchOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [tasksOpen, setTasksOpen] = useState(false);
  const [bottomBarVisible, setBottomBarVisible] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const saved = localStorage.getItem('bottomBarVisible');
    if (saved !== null) setBottomBarVisible(saved === 'true');
  }, []);

  useEffect(() => {
    localStorage.setItem('bottomBarVisible', bottomBarVisible.toString());
  }, [bottomBarVisible]);

  // Handle scroll effect for navbar shadow
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [router.pathname]);

  // Navigation links
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

  const isActiveLink = (href: string) => router.pathname === href;

  return (
    <>
      {/* Desktop Sidebar */}
      <nav
        className={`
          hidden lg:fixed lg:inset-y-0 lg:left-0 lg:w-60 lg:flex lg:flex-col
          justify-between bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm
          border-r border-gray-200/20 dark:border-gray-700/20
          p-4 z-50 transition-all duration-300
          ${scrolled ? 'shadow-lg' : 'shadow-sm'}
          ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        <div className="flex-1 space-y-6 flex flex-col">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <div className="p-1.5 bg-gradient-to-br from-[#b53133]/20 to-[#b53133]/40 rounded-lg group-hover:scale-105 transition-transform duration-200">
              <Image
                src="https://cdn.proovia.uk/pd/images/logo/logo-default.svg"
                alt="Proovia Logo"
                width={120}
                height={32}
                className="h-8 w-auto"
                onError={(e) => (e.currentTarget.src = '/fallback-logo.png')}
              />
            </div>
          </Link>

          {/* Navigation Links */}
          <div className="space-y-1">
          {navLinks.map(({ href, icon, label }) => (
            <Link
              key={href}
              href={href}
              aria-current={isActiveLink(href) ? 'page' : undefined}
              className={`
                flex items-center gap-3 px-4 py-2 rounded-lg text-sm font-medium
                transition-colors duration-200
                ${isActiveLink(href)
                  ? 'text-[#b53133] bg-[#b53133]/10'
                  : 'text-gray-700 dark:text-gray-200 hover:text-[#b53133] hover:bg-[#b53133]/10 dark:hover:bg-[#b53133]/20'}
              `}
            >
              <Icon
                name={icon}
                className={`w-5 h-5 ${isActiveLink(href) ? 'text-[#b53133]' : 'text-gray-500 dark:text-gray-400'}`}
              />
              <span>{label}</span>
              {isActiveLink(href) && (
                <span className="absolute inset-y-0 right-0 w-1 rounded-l bg-[#b53133]" />
              )}
            </Link>
          ))}
        </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-2 pt-4 border-t border-gray-200/20 dark:border-gray-700/20">
          <button
            onClick={() => setSearchOpen(true)}
            className="p-2 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-[#b53133]/10 dark:hover:bg-[#b53133]/20 transition-colors duration-200"
            aria-label="Open search"
          >
            <Icon name="search" className="w-5 h-5" />
          </button>
          <NotificationCenter />
          <button
            onClick={() => setTasksOpen(true)}
            className="p-2 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-[#b53133]/10 dark:hover:bg-[#b53133]/20 transition-colors duration-200"
            aria-label="Open tasks"
          >
            <Icon name="check" className="w-5 h-5" />
          </button>
          <UserMenu />
          <ThemeToggle />
          <button
            onClick={() => setIsSidebarOpen(false)}
            className="p-2 mt-2 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-[#b53133]/10 dark:hover:bg-[#b53133]/20 transition-colors duration-200"
            aria-label="Hide sidebar"
          >
            <Icon name="chevron-left" className="w-5 h-5" />
          </button>
        </div>
      </nav>

      {/* Sidebar Toggle Button (when sidebar is hidden) */}
      <button
        onClick={() => setIsSidebarOpen(true)}
        className={`
          hidden lg:block fixed top-4 left-4 z-50 p-2 rounded-lg
          bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm
          border border-gray-200/20 dark:border-gray-700/20
          text-gray-600 dark:text-gray-300 hover:bg-[#b53133]/10 dark:hover:bg-[#b53133]/20
          transition-all duration-300
          ${isSidebarOpen ? 'opacity-0 pointer-events-none' : 'opacity-100'}
        `}
        aria-label="Show sidebar"
      >
        <Icon name="chevron-right" className="w-5 h-5" />
      </button>

      {/* Mobile Top Bar */}
      <div
        className={`
          lg:hidden sticky top-0 z-40 flex items-center justify-between
          px-4 py-3 bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm
          border-b border-gray-200/20 dark:border-gray-700/20
          ${scrolled ? 'shadow-lg' : 'shadow-sm'}
        `}
      >
        <button
          onClick={() => setMobileMenuOpen(true)}
          className="p-2 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-[#b53133]/10 dark:hover:bg-[#b53133]/20 transition-colors duration-200"
          aria-label="Open menu"
        >
          <Icon name="list" className="w-5 h-5" />
        </button>

        <Link href="/" className="flex items-center gap-2">
          <Image
            src="https://cdn.proovia.uk/pd/images/logo/logo-default.svg"
            alt="Proovia Logo"
            width={100}
            height={28}
            className="h-7 w-auto"
            onError={(e) => (e.currentTarget.src = '/fallback-logo.png')}
          />
        </Link>

        <div />
      </div>

      {/* Mobile Menu Overlay */}
      <div
        className={`
          lg:hidden fixed inset-0 z-40 transition-opacity duration-300
          ${mobileMenuOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}
        `}
      >
        <div
          className="absolute inset-0 bg-black/40"
          onClick={() => setMobileMenuOpen(false)}
        />
        <div
          className={`
            absolute left-0 top-0 bottom-0 w-60 bg-white dark:bg-gray-800
            rounded-r-2xl border-r border-gray-200/20 dark:border-gray-700/20
            shadow-xl p-4 space-y-2 transform transition-transform duration-300
            ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
          `}
        >
          {navLinks.map(({ href, icon, label }) => (
            <Link
              key={href}
              href={href}
              onClick={() => setMobileMenuOpen(false)}
              aria-current={isActiveLink(href) ? 'page' : undefined}
              className={`
                flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium
                transition-colors duration-200
                ${isActiveLink(href)
                  ? 'text-[#b53133] bg-[#b53133]/10'
                  : 'text-gray-700 dark:text-gray-200 hover:text-[#b53133] hover:bg-[#b53133]/10 dark:hover:bg-[#b53133]/20'}
              `}
            >
              <Icon
                name={icon}
                className={`w-5 h-5 ${isActiveLink(href) ? 'text-[#b53133]' : 'text-gray-500 dark:text-gray-400'}`}
              />
              <span>{label}</span>
              {isActiveLink(href) && (
                <span className="ml-auto w-2 h-2 bg-[#b53133] rounded-full" />
              )}
            </Link>
          ))}
        </div>
      </div>

      {/* Mobile Bottom Bar */}
      <div
        className={`
          lg:hidden fixed bottom-0 inset-x-0 z-40 flex items-center justify-around
          px-4 py-2 bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm
          border-t border-gray-200/20 dark:border-gray-700/20
          transition-transform duration-300
          ${bottomBarVisible ? 'translate-y-0' : 'translate-y-full'}
        `}
      >
        <button
          onClick={() => setSearchOpen(true)}
          className="p-2 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-[#b53133]/10 dark:hover:bg-[#b53133]/20 transition-colors duration-200"
          aria-label="Open search"
        >
          <Icon name="search" className="w-6 h-6" />
        </button>
        <NotificationCenter />
        <button
          onClick={() => setTasksOpen(true)}
          className="p-2 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-[#b53133]/10 dark:hover:bg-[#b53133]/20 transition-colors duration-200"
          aria-label="Open tasks"
        >
          <Icon name="check" className="w-6 h-6" />
        </button>
        <UserMenu />
        <button
          onClick={() => setBottomBarVisible(false)}
          className="p-2 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-[#b53133]/10 dark:hover:bg-[#b53133]/20 transition-colors duration-200"
          aria-label="Hide navbar"
        >
          <Icon name="chevron-down" className="w-5 h-5" />
        </button>
      </div>

      {/* Bottom Bar Toggle */}
      <button
        onClick={() => setBottomBarVisible(true)}
        className={`
          lg:hidden fixed bottom-4 right-4 z-40 p-2 rounded-full shadow
          bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm
          border border-gray-200/20 dark:border-gray-700/20
          text-gray-600 dark:text-gray-300 transition-opacity duration-300
          ${bottomBarVisible ? 'opacity-0 pointer-events-none' : 'opacity-100'}
        `}
        aria-label="Show navbar"
      >
        <Icon name="chevron-up" className="w-5 h-5" />
      </button>

      {/* Overlays */}
      <SearchOverlay open={searchOpen} onClose={() => setSearchOpen(false)} />
      <TasksPanel open={tasksOpen} onClose={() => setTasksOpen(false)} />
    </>
  );
}