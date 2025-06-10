import { useRouter } from 'next/router';
import { useState, ChangeEvent } from 'react';
import useFetch from '../../lib/useFetch';
import Layout from '../../components/Layout';
import useUser from '../../lib/useUser';


export default function Profile() {
  const router = useRouter();
  const { user } = router.query as { user: string };
  const { data } = useFetch<{ users: any[] }>(user ? '/api/users' : null);
  const info = data?.users.find((u: any) => u.username === user);
  const current = useUser();
  const { data: me } = useFetch<{ user: any }>(current ? '/api/user' : null);
  const canEdit = current === user || me?.user?.role === 'admin';
  const [editing, setEditing] = useState(false);
  const [photo, setPhoto] = useState('');
  const [header, setHeader] = useState('');
  const [password, setPassword] = useState('');

  const handleImage = (e: ChangeEvent<HTMLInputElement>, set: (v:string)=>void) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => set(reader.result as string);
    reader.readAsDataURL(file);
  };
  const save = async () => {
    await fetch('/api/profile', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ photo, header, password })
    });
    setEditing(false);
    location.reload();
  };
  const vars = ['--p','--a','--b1','--b2','--card-bg','--section-bg','--rounded-btn','--rounded-box','--rounded-badge','--shadow-strength'];
  const custom = typeof window !== 'undefined' && current === user
    ? vars.reduce((acc,v)=>{const val=localStorage.getItem('style'+v);if(val)acc[v]=val;return acc;},{} as Record<string,string>)
    : {};

  if (!info) return <Layout title="Profile">Loading...</Layout>;
  return (
    <Layout title={`${info.username} Profile`} fullWidth>
      <div className="max-w-3xl mx-auto space-y-6">
        {info.header && (
          <img src={info.header} alt="header" className="w-full h-48 object-cover rounded-system" />
        )}
        <div className="flex items-center gap-4">
          {info.photo && <img src={info.photo} alt="avatar" className="w-24 h-24 rounded-full" />}
          <h1 className="text-3xl font-bold">{info.username}</h1>
          {canEdit && (
            <button className="btn btn-sm btn-secondary" onClick={()=>setEditing(!editing)}>{editing ? 'Cancel' : 'Edit'}</button>
          )}
        </div>
        {editing && (
          <div className="space-y-2">
            <input type="file" accept="image/*" onChange={e=>handleImage(e,setPhoto)} className="file-input file-input-bordered w-full" />
            <input type="file" accept="image/*" onChange={e=>handleImage(e,setHeader)} className="file-input file-input-bordered w-full" />
            <input type="password" placeholder="New password" value={password} onChange={e=>setPassword(e.target.value)} className="input input-bordered w-full" />
            <button className="btn btn-primary" onClick={save}>Save</button>
          </div>
        )}
        <div className="text-sm text-gray-500">Joined {new Date(info.created_at).toLocaleDateString()}</div>
        {Object.keys(custom).length > 0 && (
          <div className="space-y-1 text-sm">
            <h2 className="font-semibold mt-4">Your Customizations</h2>
            {Object.entries(custom).map(([k,v]) => (
              <div key={k}>{k}: {v}</div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
