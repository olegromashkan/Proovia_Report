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
        <link
          rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css"
          integrity="sha512-1ycn6IcaQQ40/MKB4Imkb9C06J96Z1zbQKq7X+7Fh5Y4ZrG0EHOuN3nE5xpe0b9R0jn+QvrFfS7b1J9c2c+S9g=="
          crossOrigin="anonymous"
          referrerPolicy="no-referrer"
        />
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
