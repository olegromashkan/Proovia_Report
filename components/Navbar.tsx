import Link from 'next/link';

export default function Navbar() {
  return (
    <nav className="navbar">
      <ul>
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
