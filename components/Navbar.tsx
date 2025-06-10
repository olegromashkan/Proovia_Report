import Link from 'next/link';
import Image from 'next/image';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import ThemeToggle from './ThemeToggle';
import NotificationCenter from './NotificationCenter';
import SearchOverlay from './SearchOverlay';
import Icon from './Icon';

export default function Navbar() {
  const [searchOpen, setSearchOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const router = useRouter();

  // Handle scroll effect
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

  const navLinks = [
    { href: '/', icon: 'house', label: 'Home' },
    { href: '/upload', icon: 'upload', label: 'Upload' },
    { href: '/admin', icon: 'user-cog', label: 'Admin' },
    { href: '/full-report', icon: 'table-list', label: 'Full Report' },
    { href: '/van-state', icon: 'truck', label: 'Van State' },
  ];

  const isActiveLink = (href) => {
    return router.pathname === href;
  };

  return (
    <>
      <nav className={`
        backdrop-blur-xl bg-white/80 dark:bg-gray-900/80 
        border-b border-gray-200/50 dark:border-gray-700/50
        px-4 lg:px-6 py-3 flex items-center justify-between 
        sticky top-0 z-50 transition-all duration-300
        ${scrolled ? 'shadow-lg shadow-black/5' : 'shadow-sm'}
      `}>
        {/* Logo Section */}
        <div className="flex items-center">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="relative overflow-hidden rounded-xl p-1 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 group-hover:scale-105 transition-transform duration-200">
              <Image 
                src="https://cdn.proovia.uk/pd/images/logo/logo-default.svg" 
                alt="Proovia" 
                width={120} 
                height={32}
                className="h-8 w-auto"
              />
            </div>
          </Link>
        </div>

        {/* Desktop Navigation */}
        <div className="hidden lg:flex items-center space-x-1">
          {navLinks.map(({ href, icon, label }) => (
            <Link
              key={href}
              href={href}
              className={`
                relative flex items-center gap-2 px-4 py-2.5 rounded-xl
                font-medium text-sm transition-all duration-200
                hover:bg-gray-100/80 dark:hover:bg-gray-800/80
                group overflow-hidden
                ${isActiveLink(href) 
                  ? 'text-blue-600 dark:text-blue-400 bg-blue-50/80 dark:bg-blue-900/20' 
                  : 'text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
                }
              `}
            >
              {isActiveLink(href) && (
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-indigo-500/10 rounded-xl" />
              )}
              <Icon 
                name={icon} 
                className={`
                  w-4 h-4 transition-transform duration-200 group-hover:scale-110
                  ${isActiveLink(href) ? 'text-blue-600 dark:text-blue-400' : ''}
                `} 
              />
              <span className="relative z-10">{label}</span>
              {isActiveLink(href) && (
                <div className="absolute -bottom-0.5 left-1/2 transform -translate-x-1/2 w-1/2 h-0.5 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full" />
              )}
            </Link>
          ))}
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-2">
          {/* Search Button */}
          <button
            onClick={() => setSearchOpen(true)}
            className="btn btn-ghost btn-square btn-sm"
            aria-label="Search"
          >
            <Icon name="search" className="w-5 h-5" />
          </button>

          {/* Notification Center */}
          <div className="relative">
            <NotificationCenter />
          </div>

          {/* Theme Toggle */}
          <div className="relative">
            <ThemeToggle />
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="btn btn-ghost btn-square btn-sm lg:hidden"
            aria-label="Toggle menu"
          >
            <div className="relative z-10 flex flex-col space-y-1">
              <span className={`block h-0.5 w-5 bg-current transition-all duration-200 ${mobileMenuOpen ? 'rotate-45 translate-y-1.5' : ''}`} />
              <span className={`block h-0.5 w-5 bg-current transition-all duration-200 ${mobileMenuOpen ? 'opacity-0' : ''}`} />
              <span className={`block h-0.5 w-5 bg-current transition-all duration-200 ${mobileMenuOpen ? '-rotate-45 -translate-y-1.5' : ''}`} />
            </div>
          </button>
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      <div className={`
        lg:hidden fixed inset-0 z-40 transition-all duration-300
        ${mobileMenuOpen ? 'opacity-100 visible' : 'opacity-0 invisible'}
      `}>
        <div 
          className="absolute inset-0 bg-black/20 backdrop-blur-sm"
          onClick={() => setMobileMenuOpen(false)}
        />
        <div className={`
          absolute top-16 left-4 right-4 bg-white/95 dark:bg-gray-900/95 
          backdrop-blur-xl rounded-2xl border border-gray-200/50 dark:border-gray-700/50
          shadow-xl shadow-black/10 p-4 space-y-2 transform transition-all duration-300
          ${mobileMenuOpen ? 'translate-y-0 scale-100' : '-translate-y-4 scale-95'}
        `}>
          {navLinks.map(({ href, icon, label }) => (
            <Link
              key={href}
              href={href}
              onClick={() => setMobileMenuOpen(false)}
              className={`
                flex items-center gap-3 px-4 py-3 rounded-xl
                font-medium transition-all duration-200 relative overflow-hidden
                ${isActiveLink(href) 
                  ? 'text-blue-600 dark:text-blue-400 bg-blue-50/80 dark:bg-blue-900/20' 
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100/80 dark:hover:bg-gray-800/80'
                }
              `}
            >
              {isActiveLink(href) && (
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-indigo-500/10 rounded-xl" />
              )}
              <Icon 
                name={icon} 
                className={`
                  w-5 h-5 relative z-10
                  ${isActiveLink(href) ? 'text-blue-600 dark:text-blue-400' : ''}
                `} 
              />
              <span className="relative z-10">{label}</span>
              {isActiveLink(href) && (
                <div className="ml-auto w-2 h-2 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full relative z-10" />
              )}
            </Link>
          ))}
        </div>
      </div>

      {/* Search Overlay */}
      <SearchOverlay open={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  );
}