import Link from 'next/link';

export default function Navbar() {
  return (
    <nav className="bg-gray-800 p-4">
      <ul className="flex space-x-4 text-white">
        <li>
          <Link href="/">
            <span className="hover:underline">Home</span>
          </Link>
        </li>
        <li>
          <Link href="/upload">
            <span className="hover:underline">Upload</span>
          </Link>
        </li>
        <li>
          <Link href="/admin">
            <span className="hover:underline">Admin</span>
          </Link>
        </li>
        <li>
          <Link href="/full-report">
            <span className="hover:underline">Full Report</span>
          </Link>
        </li>
      </ul>
    </nav>
  );
}
