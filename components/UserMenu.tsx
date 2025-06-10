import { useState } from 'react';
import Link from 'next/link';
import Icon from './Icon';
import useUser from '../lib/useUser';
import useFetch from '../lib/useFetch';

export default function UserMenu() {
  const username = useUser();
  const { data } = useFetch<{ users: any[] }>(username ? '/api/users' : null);
  const info = data?.users.find((u: any) => u.username === username);
  const [open, setOpen] = useState(false);

  if (!username) {
    return (
      <Link href="/auth/login" className="p-2" title="Login">
        <Icon name="box-arrow-in-right" className="w-6 h-6" />
      </Link>
    );
  }

  const logout = async () => {
    await fetch('/api/logout');
    location.reload();
  };

  return (
    <div className="dropdown dropdown-end">
      <label
        tabIndex={0}
        className="btn btn-ghost btn-circle"
        onClick={() => setOpen(!open)}
      >
        {info?.photo ? (
          <img src={info.photo} alt="avatar" className="w-8 h-8 rounded-full" />
        ) : (
          <Icon name="person-circle" className="w-6 h-6" />
        )}
      </label>
      {open && (
        <ul
          tabIndex={0}
          className="menu menu-sm dropdown-content mt-3 p-2 shadow bg-base-100 rounded-box w-36"
        >
          <li>
            <Link href={`/profile/${username}`}>Profile</Link>
          </li>
          <li>
            <button onClick={logout}>Logout</button>
          </li>
        </ul>
      )}
    </div>
  );
}
