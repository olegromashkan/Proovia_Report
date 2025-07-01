import dynamic from 'next/dynamic';
import Layout from '../components/Layout';

const DriverReportTable = dynamic(() => import('../components/DriverReportTable'), { ssr: false });

export default function DriverReportPage() {
  return (
    <Layout title="Driver Report" fullWidth>
      <div className="p-4">
        <DriverReportTable />
      </div>
    </Layout>
  );
}
