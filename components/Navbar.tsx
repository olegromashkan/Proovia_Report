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
      </ul>
    </nav>
  );
}
