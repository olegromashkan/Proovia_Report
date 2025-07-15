import { ReactNode } from 'react';
import Head from 'next/head';
import Navbar from './Navbar';
import dynamic from 'next/dynamic';

const ToastNotifications = dynamic(() => import('./ToastNotifications'), { ssr: false });

interface LayoutProps {
  children: ReactNode;
  title?: string;
  fullWidth?: boolean;
  hideNavbar?: boolean;
}

export default function Layout({ children, title, fullWidth, hideNavbar }: LayoutProps) {
  const showNavbar = !hideNavbar;

  return (
    <>
      <Head>
        <title>{title ? `${title} | Proovia Report` : 'Proovia Report'}</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      {/* Use data-theme to apply DaisyUI themes (light/dark/custom) */}
      <div
        data-theme="light" // or "dark", or dynamic via state
        className="min-h-screen flex flex-col bg-base-100 text-base-content"
      >
        {showNavbar && <Navbar />}
        <div className="flex-1 flex flex-col min-h-0">
          <ToastNotifications />
          <main
            className={
              fullWidth
                ? 'flex-1 flex flex-col min-h-0'
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
