import { ReactNode } from 'react';
import Head from 'next/head';
import Navbar from './Navbar';
import ToastNotifications from './ToastNotifications';

interface LayoutProps {
  children: ReactNode;
  title?: string;
  fullWidth?: boolean;
}

export default function Layout({ children, title, fullWidth }: LayoutProps) {
  return (
    <>
      <Head>
        <title>{title ? `${title} | Proovia Report` : 'Proovia Report'}</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 text-base-content">
        <Navbar />
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
    </>
  );
}
