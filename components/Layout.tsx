import { ReactNode } from 'react';
import Head from 'next/head';
import Navbar from './Navbar';
import ToastNotifications from './ToastNotifications';

interface LayoutProps {
  children: ReactNode;
  title?: string;
  fullWidth?: boolean;
  hideNavbar?: boolean;
}
export default function Layout({ children, title, fullWidth, hideNavbar }: LayoutProps) {
  const showNavbar = !(hideNavbar === true || hideNavbar === 'true');
  return (
    <>
      <Head>
        <title>{title ? `${title} | Proovia Report` : 'Proovia Report'}</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <div className="min-h-screen flex flex-col bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 text-base-content">
        {showNavbar && <Navbar />}
        <div className="flex-1 flex flex-col min-h-0">
          <ToastNotifications />
          <main
            className={
              fullWidth
                ? 'flex-1 flex flex-col min-h-0 px-4 sm:px-6 py-4 space-y-4'
                : 'flex-1 flex flex-col min-h-0 max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6'
            }
          >
            {children}
          </main>

        </div>
      </div>
    </>
  );
}
