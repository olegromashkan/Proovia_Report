import Link from 'next/link';
import useFetch from '../lib/useFetch';
import useUser from '../lib/useUser';

export default function UsersPanel() {
  const user = useUser();
  const { data } = useFetch<{ users: any[] }>('/api/users');
  const users = data?.users || [];
  const { data: info } = useFetch<{ user: any }>(user ? '/api/user' : null);
  const isAdmin = info?.user?.role === 'admin';

  const remove = async (name: string) => {
    await fetch(`/api/user?username=${encodeURIComponent(name)}`, { method: 'DELETE' });
    location.reload();
  };
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold">Registered Users</h2>
      <ul className="space-y-2">
        {users.map((u: any) => (
          <li key={u.id} className="flex items-center gap-3">
            {u.photo && <img src={u.photo} alt="avatar" className="w-8 h-8 rounded-full" />}
            <Link href={`/profile/${u.username}`} className="text-blue-600 hover:underline flex-1">
              {u.username}
            </Link>
            {isAdmin && (
              <button className="btn btn-xs btn-ghost text-red-600" onClick={() => remove(u.username)}>Delete</button>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
