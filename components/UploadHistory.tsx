import { useEffect, useState } from 'react';
import { RefreshCw, AlertCircle } from 'lucide-react';

interface Item {
  id: number;
  message: string;
  created_at: string;
  status?: string;
  fileName?: string;
}

export default function UploadHistory() {
  const [items, setItems] = useState<Item[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/notifications?type=upload');
      if (!res.ok) {
        throw new Error('Failed to fetch upload history');
      }
      const data = await res.json();
      const items = Array.isArray(data.items) ? data.items : [];
      setItems(items as Item[]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleRefresh = () => {
    load();
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 max-w-2xl mx-auto transition-colors duration-200">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
          Upload History
        </h2>
        <button
          onClick={handleRefresh}
          disabled={isLoading}
          className={`flex items-center px-3 py-1 rounded-md text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 transition-colors duration-150 ${
            isLoading ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {isLoading && (
        <div className="flex justify-center items-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 dark:border-blue-400"></div>
        </div>
      )}

      {error && (
        <div className="flex items-center p-4 mb-4 text-sm text-red-800 bg-red-50 dark:bg-red-900/30 dark:text-red-300 rounded-lg">
          <AlertCircle className="w-5 h-5 mr-2" />
          {error}
        </div>
      )}

      {!isLoading && !error && items.length === 0 && (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          No upload history available
        </div>
      )}

      {!isLoading && !error && items.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left text-gray-700 dark:text-gray-300">
            <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-300">
              <tr>
                <th scope="col" className="px-6 py-3">Message</th>
                <th scope="col" className="px-6 py-3">File</th>
                <th scope="col" className="px-6 py-3">Status</th>
                <th scope="col" className="px-6 py-3">Date</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr
                  key={item.id}
                  className="bg-white border-b dark:bg-gray-800 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-100"
                >
                  <td className="px-6 py-4">{item.message}</td>
                  <td className="px-6 py-4">{item.fileName || '-'}</td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-2 py-1 rounded-full text-xs ${
                        item.status === 'success'
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                          : item.status === 'failed'
                          ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                          : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                      }`}
                    >
                      {item.status || 'Unknown'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {new Date(item.created_at).toLocaleString('en-US', {
                      dateStyle: 'medium',
                      timeStyle: 'short',
                    })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}