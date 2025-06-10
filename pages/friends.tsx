import { useState, useEffect } from 'react';
import Layout from '../components/Layout';

export default function Friends() {
  const [friends, setFriends] = useState<any[]>([]);
  const [name, setName] = useState('');

  const load = async () => {
    const res = await fetch('/api/friends');
    if (res.ok) {
      const data = await res.json();
      setFriends(data.friends);
    }
  };
  useEffect(() => { load(); }, []);

  const add = async () => {
    if (!name) return;
    await fetch('/api/friends', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ friend: name }) });
    setName('');
    load();
  };

  const remove = async (u: string) => {
    await fetch(`/api/friends?friend=${u}`, { method:'DELETE' });
    load();
  };

  return (
    <Layout title="Friends">
      <div className="space-y-4 max-w-xl mx-auto">
        <h1 className="text-2xl font-bold">Friends</h1>
        <div className="flex gap-2">
          <input value={name} onChange={e=>setName(e.target.value)} placeholder="username" className="input input-bordered flex-1" />
          <button className="btn btn-primary" onClick={add}>Add</button>
        </div>
        <ul className="space-y-2">
          {friends.map(f => (
            <li key={f.id} className="flex items-center gap-2">
              {f.photo && <img src={f.photo} className="w-6 h-6 rounded-full" alt="" />}
              <span>{f.username}</span>
              <button className="btn btn-xs btn-ghost" onClick={()=>remove(f.username)}>remove</button>
            </li>
          ))}
        </ul>
      </div>
    </Layout>
  );
}
