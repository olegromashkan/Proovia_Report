import useSWR from 'swr';
import Link from 'next/link';

const fetcher = (url: string) => fetch(url).then(r => r.json());

export default function UsersPanel() {
  const { data } = useSWR('/api/users', fetcher);
  const users = data?.users || [];
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold">Registered Users</h2>
      <ul className="space-y-2">
        {users.map((u: any) => (
          <li key={u.id} className="flex items-center gap-3">
            {u.photo && <img src={u.photo} alt="avatar" className="w-8 h-8 rounded-full" />}
            <Link href={`/profile/${u.username}`} className="text-blue-600 hover:underline">
              {u.username}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
