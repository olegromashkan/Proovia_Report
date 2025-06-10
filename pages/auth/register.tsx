import { useState, ChangeEvent } from 'react';
import { useRouter } from 'next/router';
import Layout from '../../components/Layout';

export default function Register() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [photo, setPhoto] = useState('');
  const [header, setHeader] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  const handlePhoto = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result !== 'string') return;
      const img = new Image();
      img.onload = () => {
        let w = img.width;
        let h = img.height;
        const ratio = w / h;
        if (w > h) {
          if (w > 1280) {
            w = 1280;
            h = Math.round(w / ratio);
          }
        } else {
          if (h > 720) {
            h = 720;
            w = Math.round(h * ratio);
          }
        }
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, w, h);
          const data = canvas.toDataURL('image/jpeg', 0.8);
          setPhoto(data);
        }
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  };

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
          type="file"
          accept="image/*"
          onChange={handlePhoto}
          className="file-input file-input-bordered w-full"
        />
        {photo && (
          <img src={photo} alt="preview" className="w-24 h-24 object-cover rounded-full" />
        )}
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
