import { ReactNode } from 'react';
import Head from 'next/head';
import Navbar from './Navbar';

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
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-white text-gray-800">
        <Navbar />
        <main
          className={
            fullWidth ? 'p-4 space-y-4' : 'max-w-screen-xl mx-auto p-4 space-y-4'
          }
        >
          {children}
        </main>
      </div>
    </>
  );
}
