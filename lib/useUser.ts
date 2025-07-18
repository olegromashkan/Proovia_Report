import { useEffect, useState } from 'react';

function parseCookie(name: string) {
  const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
  return match ? decodeURIComponent(match[2]) : '';
}

export default function useUser() {
  const [user, setUser] = useState('');
  useEffect(() => {
    setUser(parseCookie('user'));
  }, []);
  return user;
}
