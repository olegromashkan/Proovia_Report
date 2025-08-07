import Link from 'next/link';
import Layout from '../components/Layout';
import DCNavbar from '../components/DCNavbar';
import Icon from '../components/Icon';

export default function DriverControlHub() {
  const links = [
    { href: '/upload', icon: 'upload', label: 'Upload' },
    { href: '/driver-routes', icon: 'signpost', label: 'Driver Routes' },
    { href: '/working-times', icon: 'clock', label: 'Working Times' },
    { href: '/schedule-tool', icon: 'database', label: 'Schedule Tool' },
    { href: '/start-time', icon: 'clock-history', label: 'Start Time' },
  ];
  return (
    <Layout title="Driver Control Hub" hideNavbar fullWidth>
      <DCNavbar />
      <div className="p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {links.map(({ href, icon, label }) => (
          <Link
            key={href}
            href={href}
            className="btn btn-primary btn-lg h-24 flex items-center justify-center gap-2"
          >
            <Icon name={icon} className="w-6 h-6" />
            {label}
          </Link>
        ))}
      </div>
    </Layout>
  );
}
