import Link from 'next/link';
import Image from 'next/image';
import useFetch from '../lib/useFetch';
import useCurrentUser from '../lib/useCurrentUser';

export default function UsersPanel() {
  const { data } = useFetch<{ users: any[] }>('/api/users');
  const users = data?.users || [];
  const me = useCurrentUser();
  const isAdmin = me?.role === 'admin';

  const remove = async (name: string) => {
    await fetch(`/api/user?username=${name}`, { method: 'DELETE' });
    location.reload();
  };
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold">Registered Users</h2>
      <ul className="space-y-2">
        {users.map((u: any) => (
          <li key={u.id} className="flex items-center gap-3">
            {u.photo && (
              <Image src={u.photo} alt="avatar" width={32} height={32} className="w-8 h-8 rounded-full" />
            )}
            <Link href={`/profile/${u.username}`} className="text-[#b53133] hover:underline flex-1">
              {u.username}
            </Link>
            {isAdmin && (
              <button
                className="text-xs text-red-600 hover:underline"
                onClick={() => remove(u.username)}
              >
                Delete
              </button>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
