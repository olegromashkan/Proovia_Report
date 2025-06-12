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

export default function Navbar() {
  const [searchOpen, setSearchOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [tasksOpen, setTasksOpen] = useState(false);
  const router = useRouter();

  // Handle scroll effect for navbar shadow
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [router.pathname]);

  const navLinks: NavLink[] = [
    { href: '/', icon: 'house', label: 'Home' },
    { href: '/feed', icon: 'chat', label: 'Feed' },
    { href: '/upload', icon: 'upload', label: 'Upload' },
    { href: '/full-report', icon: 'table-list', label: 'Full Report' },
    { href: '/van-state', icon: 'truck', label: 'Van State' },
    { href: '/users', icon: 'people', label: 'Users' },
    { href: '/messages', icon: 'chat-left', label: 'Messages' },
  ];

  const isActiveLink = (href: string) => router.pathname === href;

  return (
    <>
      <nav
        className={`
          bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm
          border-b border-gray-200/20 dark:border-gray-700/20
          px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between
          sticky top-0 z-50 transition-all duration-300
          ${scrolled ? 'shadow-lg' : 'shadow-sm'}
        `}
      >
        {/* Logo Section */}
        <div className="flex items-center">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="relative p-1.5 bg-gradient-to-br from-[#b53133]/20 to-[#b53133]/40 rounded-lg group-hover:scale-105 transition-transform duration-200">
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
        </div>

        {/* Desktop Navigation */}
        <div className="hidden lg:flex items-center space-x-3">
          {navLinks.map(({ href, icon, label }) => (
            <Link
              key={href}
              href={href}
              aria-current={isActiveLink(href) ? 'page' : undefined}
              className={`
                relative flex items-center gap-2 px-4 py-2 rounded-lg
                text-sm font-medium transition-all duration-200
                hover:bg-[#b53133]/10 dark:hover:bg-[#b53133]/20
                ${isActiveLink(href)
                  ? 'text-[#b53133] bg-[#b53133]/10'
                  : 'text-gray-700 dark:text-gray-200 hover:text-[#b53133]'
                }
              `}
            >
              <Icon
                name={icon}
                className={`
                  w-5 h-5
                  ${isActiveLink(href) ? 'text-[#b53133]' : 'text-gray-500 dark:text-gray-400'}
                `}
              />
              <span>{label}</span>
              {isActiveLink(href) && (
                <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-6 h-0.5 bg-[#b53133] rounded-full" />
              )}
            </Link>
          ))}
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-2">
          {/* Search Button */}
          <button
            onClick={() => setSearchOpen(true)}
            className="p-2 text-gray-600 dark:text-gray-300 hover:bg-[#b53133]/10 dark:hover:bg-[#b53133]/20 rounded-lg transition-all duration-200"
            aria-label="Open search"
          >
            <Icon name="search" className="w-5 h-5" />
          </button>

          {/* Notification Center */}
          <NotificationCenter />

          {/* Tasks Button */}
          <button
            onClick={() => setTasksOpen(true)}
            className="p-2 text-gray-600 dark:text-gray-300 hover:bg-[#b53133]/10 dark:hover:bg-[#b53133]/20 rounded-lg transition-all duration-200"
            aria-label="Open tasks"
          >
            <Icon name="check" className="w-5 h-5" />
          </button>

          {/* User Menu */}
          <UserMenu />

          {/* Theme Toggle */}
          <ThemeToggle />

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 text-gray-600 dark:text-gray-300 hover:bg-[#b53133]/10 dark:hover:bg-[#b53133]/20 rounded-lg transition-all duration-200"
            aria-label="Toggle mobile menu"
            aria-expanded={mobileMenuOpen}
          >
            <div className="relative flex flex-col space-y-1.5 w-5 h-5">
              <span
                className={`block h-0.5 w-full bg-current rounded transition-all duration-300 ${
                  mobileMenuOpen ? 'rotate-45 translate-y-2' : ''
                }`}
              />
              <span
                className={`block h-0.5 w-full bg-current rounded transition-all duration-300 ${
                  mobileMenuOpen ? 'opacity-0' : ''
                }`}
              />
              <span
                className={`block h-0.5 w-full bg-current rounded transition-all duration-300 ${
                  mobileMenuOpen ? '-rotate-45 -translate-y-2' : ''
                }`}
              />
            </div>
          </button>
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      <div
        className={`
          lg:hidden fixed inset-0 z-40 transition-all duration-300
          ${mobileMenuOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}
        `}
      >
        <div
          className="absolute inset-0 bg-black/40"
          onClick={() => setMobileMenuOpen(false)}
        />
        <div
          className={`
            absolute top-16 left-4 right-4 bg-white dark:bg-gray-800
            rounded-2xl border border-gray-200/20 dark:border-gray-700/20
            shadow-xl p-4 space-y-2 transform transition-all duration-300
            ${mobileMenuOpen ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}
          `}
        >
          {navLinks.map(({ href, icon, label }) => (
            <Link
              key={href}
              href={href}
              onClick={() => setMobileMenuOpen(false)}
              aria-current={isActiveLink(href) ? 'page' : undefined}
              className={`
                flex items-center gap-3 px-4 py-3 rounded-lg
                text-sm font-medium transition-all duration-200
                ${isActiveLink(href)
                  ? 'text-[#b53133] bg-[#b53133]/10'
                  : 'text-gray-700 dark:text-gray-200 hover:bg-[#b53133]/10 dark:hover:bg-[#b53133]/20 hover:text-[#b53133]'
                }
              `}
            >
              <Icon
                name={icon}
                className={`
                  w-5 h-5
                  ${isActiveLink(href) ? 'text-[#b53133]' : 'text-gray-500 dark:text-gray-400'}
                `}
              />
              <span>{label}</span>
              {isActiveLink(href) && (
                <div className="ml-auto w-2 h-2 bg-[#b53133] rounded-full" />
              )}
            </Link>
          ))}
        </div>
      </div>

      {/* Search Overlay */}
      <SearchOverlay open={searchOpen} onClose={() => setSearchOpen(false)} />

      {/* Tasks Panel */}
      <TasksPanel open={tasksOpen} onClose={() => setTasksOpen(false)} />
    </>
  );
}