import { ReactNode } from 'react';
import Head from 'next/head';
import Navbar from './Navbar';

interface LayoutProps {
  children: ReactNode;
  title?: string;
}

export default function Layout({ children, title }: LayoutProps) {
  return (
    <>
      <Head>
        <title>{title ? `${title} | Proovia Report` : 'Proovia Report'}</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <div className="page">
        <Navbar />
        <main className="container space-y-4">{children}</main>
      </div>
    </>
  );
}
