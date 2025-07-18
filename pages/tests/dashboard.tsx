import { useEffect, useState } from 'react';
import Link from 'next/link';
import Layout from '../../components/Layout';
import { ArrowUpDown } from 'lucide-react';

interface TemplateInfo {
  id: number;
  name: string;
  created_at: string;
}

interface TestInfo {
  id: number;
  name: string;
  email: string;
  created_at: string;
  test_id: number | null;
}

export default function TestDashboard() {
  const [templates, setTemplates] = useState<TemplateInfo[]>([]);
  const [tests, setTests] = useState<TestInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortConfig, setSortConfig] = useState<{ key: keyof TestInfo; direction: 'asc' | 'desc' } | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [templatesRes, testsRes] = await Promise.all([
          fetch('/api/test-templates'),
          fetch('/api/tests'),
        ]);

        if (!templatesRes.ok || !testsRes.ok) {
          throw new Error('Failed to fetch data');
        }

        const templatesData = await templatesRes.json();
        const testsData = await testsRes.json();

        setTemplates(templatesData.templates || []);
        setTests(testsData.tests || []);
      } catch (err) {
        setError('Failed to load data. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const sortTests = (key: keyof TestInfo) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }

    const sortedTests = [...tests].sort((a, b) => {
      if (key === 'created_at') {
        return direction === 'asc'
          ? new Date(a[key]).getTime() - new Date(b[key]).getTime()
          : new Date(b[key]).getTime() - new Date(a[key]).getTime();
      }
      return direction === 'asc'
        ? String(a[key]).localeCompare(String(b[key]))
        : String(b[key]).localeCompare(String(a[key]));
    });

    setSortConfig({ key, direction });
    setTests(sortedTests);
  };

  if (isLoading) {
    return (
      <Layout title="Test Dashboard">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout title="Test Dashboard">
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4" role="alert">
          <p>{error}</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Test Dashboard">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Templates Section */}
        <section className="rounded-2xl  border border-white/20 dark:border-black/20 shadow-lg p-6 mb-8  ">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold ">Templates</h2>
            <Link
              href="/tests/templates/new"
              className="inline-flex items-center px-4 py-2 "
            >
              New Template
            </Link>
          </div>
          {templates.length === 0 ? (
            <p className="text-gray-500">No templates available</p>
          ) : (
            <ul className="divide-y divide-gray-200">
              {templates.map((template) => (
                <li
                  key={template.id}
                  className="flex justify-between items-center py-3 hover:bg-gray-50 transition-colors"
                >
                  <span className="text-gray-700">{template.name}</span>
                  <Link
                    href={`/tests/templates/${template.id}`}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    Edit
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Tests Section */}
        <section className="rounded-2xl  border border-white/20 dark:border-black/20 shadow-lg p-6 mb-8">
          <h2 className="text-2xl font-bold mb-4">Completed Tests</h2>
          {tests.length === 0 ? (
            <p >No tests available</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead >
                  <tr>
                    {['name', 'email', 'created_at', 'test_id'].map((key) => (
                      <th
                        key={key}
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                        onClick={() => sortTests(key as keyof TestInfo)}
                      >
                        <div className="flex items-center">
                          {key === 'created_at' ? 'Date' : key.charAt(0).toUpperCase() + key.slice(1)}
                          <ArrowUpDown className="ml-2 h-4 w-4" />
                        </div>
                      </th>
                    ))}
                    <th scope="col" className="px-6 py-3"></th>
                  </tr>
                </thead>
                <tbody className=" divide-y divide-gray-200">
                  {tests.map((test) => (
                    <tr key={test.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{test.name}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{test.email}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(test.created_at).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {test.test_id ?? '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <Link
                          href={`/tests/${test.id}`}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          Open
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </Layout>
  );
}