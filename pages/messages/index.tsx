import useFetch from '../../lib/useFetch';
import Layout from '../../components/Layout';
import Link from 'next/link';

export default function MessagesPage() {
  const { data } = useFetch<{ users: any[] }>('/api/users');
  const { data: groupData } = useFetch<{ groups: any[] }>('/api/groups');
  const users = data?.users || [];
  const groups = groupData?.groups || [];

  return (
    <Layout title="Chats" fullWidth>
      <div className="max-w-xl mx-auto p-4 space-y-4">
        <h1 className="text-2xl font-bold mb-4">Chats</h1>
        <ul className="space-y-2">
          {users.map(u => (
            <li key={u.id}>
              <Link
                href={`/messages/${encodeURIComponent(u.username)}`}
                className="block p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                {u.username}
              </Link>
            </li>
          ))}
          {groups.map(g => (
            <li key={`g${g.id}`}>
              <Link
                href={`/messages/g:${encodeURIComponent(g.id)}`}
                className="block p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                {g.name}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </Layout>
  );
}
