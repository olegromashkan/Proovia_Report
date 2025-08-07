import Link from 'next/link';
import Icon from './Icon';

export default function DCNavbar() {
  const links = [
    { href: '/upload', icon: 'upload', label: 'Upload' },
    { href: '/driver-routes', icon: 'signpost', label: 'Driver Routes' },
    { href: '/working-times', icon: 'clock', label: 'Working Times' },
    { href: '/schedule-tool', icon: 'database', label: 'Schedule Tool' },
    { href: '/start-time', icon: 'clock-history', label: 'Start Time' },
  ];
  return (
    <div className="navbar bg-primary text-primary-content shadow-sm sticky top-0 z-50">
      <div className="flex-1">
        <Link href="/dc" className="btn btn-ghost normal-case text-xl">
          Driver Control Hub
        </Link>
      </div>
      <div className="flex-none">
        <ul className="menu menu-horizontal px-1">
          {links.map(({ href, icon, label }) => (
            <li key={href}>
              <Link href={href} className="gap-1">
                <Icon name={icon} className="w-4 h-4" />
                {label}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
