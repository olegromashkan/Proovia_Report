import { ReactNode, useState, useEffect } from 'react';
import Head from 'next/head';
import Navbar from './Navbar';
import ToastNotifications from './ToastNotifications';

interface LayoutProps {
  children: ReactNode;
  title?: string;
  fullWidth?: boolean;
}

export default function Layout({ children, title, fullWidth }: LayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  useEffect(() => {
    const saved = localStorage.getItem('sidebarOpen');
    if (saved !== null) setIsSidebarOpen(saved === 'true');
  }, []);

  useEffect(() => {
    localStorage.setItem('sidebarOpen', isSidebarOpen.toString());
  }, [isSidebarOpen]);

  return (
    <>
      <Head>
        <title>{title ? `${title} | Proovia Report` : 'Proovia Report'}</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <div className="min-h-screen flex bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 text-base-content">
        <Navbar isSidebarOpen={isSidebarOpen} setIsSidebarOpen={setIsSidebarOpen} />
        <div
          className={`
            flex-1 transition-all duration-300
            ${isSidebarOpen ? 'lg:ml-60' : 'lg:ml-0'}
          `}
        >
          <ToastNotifications />
          <main
            className={
              fullWidth
                ? 'p-6 space-y-6'
                : 'max-w-6xl mx-auto p-6 space-y-6'
            }
          >
            {children}
          </main>
        </div>
      </div>
    </>
  );
}