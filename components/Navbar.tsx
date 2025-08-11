'use client';

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

  const navGroups: NavGroup[] = useMemo(() => [
    {
      label: 'General',
      links: [
        { href: '/', icon: 'house', label: 'Home' },
        { href: '/pdf-editor', icon: 'pen', label: 'PDF Editor' },
      ],
    },
    {
      label: 'Driver Control',
      links: [
        { href: '/upload', icon: 'upload', label: 'Upload' },
        { href: '/driver-routes', icon: 'signpost', label: 'Driver Routes' },
        { href: '/working-times', icon: 'clock', label: 'Working Times' },
        { href: '/schedule-tool', icon: 'database', label: 'Schedule Tool' },

      ],
    },
    {
      label: 'Reports',
      links: [
        { href: '/full-report', icon: 'table-list', label: 'Full Report' },
        { href: '/monthly-report', icon: 'calendar', label: 'Monthly' },
        { href: '/daily-driver-stats', icon: 'table-list', label: 'Daily Stats' },
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
      <div className="navbar bg-base-100 shadow-sm sticky top-0 z-50">
        <div className="navbar-start">
          <div className="dropdown">
            <button tabIndex={0} className="btn btn-ghost lg:hidden">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none"
                viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                  d="M4 6h16M4 12h8m-8 6h16" />
              </svg>
            </button>
            <ul tabIndex={0} className="menu menu-sm dropdown-content mt-3 z-[1] p-2 shadow bg-base-100 rounded-box w-64">
              {navGroups.map(group => (
                <li key={group.label}>
                  <details>
                    <summary>{group.label}</summary>
                    <ul>
                      {group.links.map(({ href, icon, label }) => (
                        <li key={href}>
                          <Link href={href} className={isActive(href) ? 'active text-primary font-semibold' : ''}>
                            <Icon name={icon} className="w-4 h-4 mr-2" />
                            {label}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </details>
                </li>
              ))}
            </ul>
          </div>
          <Link href="/" className="btn btn-ghost text-xl">
            <Image
              src="https://cdn.proovia.uk/pd/images/logo/logo-default.svg"
              alt="Proovia Logo"
              width={120}
              height={32}
              className="h-8 w-auto"
              onError={(e) => (e.currentTarget.src = '/fallback-logo.png')}
              priority
            />
          </Link>
        </div>

        <div className="navbar-center hidden lg:flex">
          <ul className="menu menu-horizontal px-1">
            {navGroups.map(group => (
              <li key={group.label}>
                <details>
                  <summary>{group.label}</summary>
                  <ul className="p-2">
                    {group.links.map(({ href, icon, label }) => (
                      <li key={href}>
                        <Link href={href} className={isActive(href) ? 'active text-primary font-semibold' : ''}>
                          <Icon name={icon} className="w-4 h-4 mr-2" />
                          {label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </details>
              </li>
            ))}
          </ul>
        </div>

        <div className="navbar-end gap-2">
          <button onClick={() => setSearchOpen(true)} className="btn btn-ghost btn-circle">
            <Icon name="search" className="w-5 h-5" />
          </button>
          <button onClick={() => setTasksOpen(true)} className="btn btn-ghost btn-circle">
            <Icon name="check" className="w-5 h-5" />
          </button>
          <button onClick={() => setAiOpen(true)} className="btn btn-ghost btn-circle">
            <Sparkles className="w-5 h-5" />
          </button>
          <NotificationCenter />
          <ThemeToggle />
          <UserMenu showName />
        </div>
      </div>

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
