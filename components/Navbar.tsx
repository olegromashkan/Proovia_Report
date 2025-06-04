import Link from 'next/link';

export default function Navbar() {
  return (
    <nav className="bg-gray-800 p-4 text-white">
      <ul className="flex gap-4 list-none m-0 p-0">
        <li>
          <Link href="/" className="hover:underline">
            Home
          </Link>
        </li>
        <li>
          <Link href="/upload" className="hover:underline">
            Upload
          </Link>
        </li>
        <li>
          <Link href="/admin" className="hover:underline">
            Admin
          </Link>
        </li>
        <li>
          <Link href="/full-report" className="hover:underline">
            Full Report
          </Link>
        </li>
      </ul>
    </nav>
  );
}
