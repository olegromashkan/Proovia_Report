import { useState } from 'react';
import { useRouter } from 'next/router';
import Layout from '../../components/Layout';

export default function Register() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [photo, setPhoto] = useState('');
  const [header, setHeader] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  const submit = async () => {
    const res = await fetch('/api/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password, photo, header })
    });
    if (res.ok) {
      router.push('/auth/login');
    } else {
      const data = await res.json();
      setError(data.message || 'Registration failed');
    }
  };

  return (
    <Layout title="Register">
      <div className="max-w-sm mx-auto space-y-4">
        <h1 className="text-2xl font-bold">Register</h1>
        {error && <div className="text-red-500 text-sm">{error}</div>}
        <input
          type="text"
          placeholder="Username"
          value={username}
          onChange={e => setUsername(e.target.value)}
          className="input input-bordered w-full"
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          className="input input-bordered w-full"
        />
        <input
          type="text"
          placeholder="Photo URL"
          value={photo}
          onChange={e => setPhoto(e.target.value)}
          className="input input-bordered w-full"
        />
        <input
          type="text"
          placeholder="Header URL"
          value={header}
          onChange={e => setHeader(e.target.value)}
          className="input input-bordered w-full"
        />
        <button onClick={submit} className="btn btn-primary w-full">Register</button>
      </div>
    </Layout>
  );
}
