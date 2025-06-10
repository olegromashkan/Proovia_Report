import Link from 'next/link';
import Icon from './Icon';
import useUser from '../lib/useUser';
import useFetch from '../lib/useFetch';

export default function UserMenu() {
  const username = useUser();
  const { data } = useFetch<{ users: any[] }>(username ? '/api/users' : null);
  const info = data?.users.find((u: any) => u.username === username);

  if (!username) {
    return (
      <Link href="/auth/login" className="p-2" title="Login">
        <Icon name="box-arrow-in-right" className="w-6 h-6" />
      </Link>
    );
  }

  return (
    <Link href="/settings" className="btn btn-ghost btn-circle" title="Settings">
      {info?.photo ? (
        <img src={info.photo} alt="avatar" className="w-8 h-8 rounded-full" />
      ) : (
        <Icon name="person-circle" className="w-6 h-6" />
      )}
    </Link>
  );
}
