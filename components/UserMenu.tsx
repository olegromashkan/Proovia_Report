import Link from 'next/link';
import { useRouter } from 'next/router';
import Icon from './Icon';
import useUser from '../lib/useUser';
import useFetch from '../lib/useFetch';

export default function UserMenu() {
  const router = useRouter();
  const username = useUser();
  const { data } = useFetch<{ users: any[] }>(username ? '/api/users' : null);
  const info = data?.users.find((u: any) => u.username === username);

  const logout = async () => {
    await fetch('/api/logout');
    router.push('/auth/login');
  };

  if (!username) {
    return (
      <Link href="/auth/login" className="btn btn-ghost btn-circle" title="Login">
        <Icon name="box-arrow-in-right" className="w-6 h-6" />
      </Link>
    );
  }

  return (
    <div className="dropdown dropdown-end">
      <label tabIndex={0} className="btn btn-ghost btn-circle avatar">
        {info?.photo ? (
          <img src={info.photo} alt="avatar" className="w-8 h-8 rounded-full" />
        ) : (
          <Icon name="person-circle" className="w-6 h-6" />
        )}
      </label>
      <ul
        tabIndex={0}
        className="dropdown-content menu p-2 shadow bg-base-100 rounded-box w-40 mt-3"
      >
        <li>
          <Link href={`/profile/${username}`}>Profile</Link>
        </li>
        <li>
          <Link href="/settings">Settings</Link>
        </li>
        <li>
          <button onClick={logout}>Logout</button>
        </li>
      </ul>
    </div>
  );
}
