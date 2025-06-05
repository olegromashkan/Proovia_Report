import Link from 'next/link';
import Image from 'next/image';
import { useState } from 'react';
import NotificationCenter from './NotificationCenter';
import SearchOverlay from './SearchOverlay';

export default function Navbar() {
  const [searchOpen, setSearchOpen] = useState(false);
  return (
    <nav className="backdrop-blur bg-white/70 border-b shadow-sm px-4 py-2 flex items-center justify-between sticky top-0 z-10">
      <div className="flex items-center gap-4">
        <Link href="/" className="flex items-center gap-2">
          <Image src="https://cdn.proovia.uk/pd/images/logo/logo-default.svg" alt="Proovia" width={120} height={40} />
        </Link>
        <Link href="/" className="hover:text-indigo-600 transition-colors">
          Home
        </Link>
        <Link href="/upload" className="hover:text-indigo-600 transition-colors">
          Upload
        </Link>
        <Link href="/admin" className="hover:text-indigo-600 transition-colors">
          Admin
        </Link>
        <Link href="/full-report" className="hover:text-indigo-600 transition-colors">
          Full Report
        </Link>
      </div>
      <div className="flex items-center gap-2">
        <button onClick={() => setSearchOpen(true)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">🔍</button>
        <NotificationCenter />
      </div>
      <SearchOverlay open={searchOpen} onClose={() => setSearchOpen(false)} />
    </nav>
  );
}
