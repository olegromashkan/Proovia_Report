import './globals.css';
import type { ReactNode } from 'react';

export const metadata = {
  title: 'DuckDB Demo',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="p-4">{children}</body>
    </html>
  );
}
