import Layout from '../../components/Layout';
import DatabaseManager from '../../components/DatabaseManager';

export default function DatabaseSettingsPage() {
  return (
    <Layout title="Database Settings" fullWidth>
      <div className="p-4 md:p-6">
        <DatabaseManager />
      </div>
    </Layout>
  );
}
