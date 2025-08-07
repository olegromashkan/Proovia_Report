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
      {/* Simple dark theme header with minimal glass effect */}

      <div className="p-6 bg-primary min-h-screen">
        <div className="max-w-5xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {links.map(({ href, icon, label }) => (
            <Link
              key={href}
              href={href}
              className="block p-4 bg-primary/50 backdrop-blur-sm border border-gray-700/50 rounded-xl hover:bg-gray-700/50 transition-colors duration-200 flex flex-col items-center justify-center gap-2 group"
            >
              <Icon name={icon} className="w-6 h-6 text-blue-400 group-hover:text-blue-300" />
              <span className="text-base font-medium text-gray-200 group-hover:text-white">{label}</span>
            </Link>
          ))}
        </div>
      </div>
    </Layout>
  );
}