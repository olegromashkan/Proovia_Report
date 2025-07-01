import dynamic from 'next/dynamic';
import Layout from '../components/Layout';

const DriverRoutesTable = dynamic(() => import('../components/DriverRoutesTable'), { ssr: false });

export default function DriverRoutesTablePage() {
  return (
    <Layout title="Driver Routes Table" fullWidth>
      <div className="p-4">
        <DriverRoutesTable />
      </div>
    </Layout>
  );
}
