import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import useUser from '../lib/useUser';

export default function Tasks() {
  const user = useUser();
  const [tasks, setTasks] = useState<any[]>([]);
  const [text, setText] = useState('');
  const [assignee, setAssignee] = useState('');

  const load = async () => {
    const res = await fetch('/api/tasks');
    if (res.ok) {
      const data = await res.json();
      setTasks(data.tasks);
    }
  };

  useEffect(() => { load(); }, []);

  const create = async () => {
    if (!text || !assignee) return;
    await fetch('/api/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ assignee, text })
    });
    setText('');
    setAssignee('');
    load();
  };

  const toggle = async (id: number, completed: number) => {
    await fetch('/api/tasks', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, completed: !completed })
    });
    load();
  };

  return (
    <Layout title="Tasks">
      <div className="space-y-4 max-w-xl mx-auto">
        <h1 className="text-2xl font-bold">Tasks</h1>
        <div className="flex gap-2">
          <input value={assignee} onChange={e=>setAssignee(e.target.value)} placeholder="@user" className="input input-bordered flex-1" />
          <input value={text} onChange={e=>setText(e.target.value)} placeholder="Task" className="input input-bordered flex-1" />
          <button className="btn btn-primary" onClick={create}>Add</button>
        </div>
        <ul className="space-y-2">
          {tasks.map(t => (
            <li key={t.id} className="flex items-center gap-2">
              <input type="checkbox" checked={t.completed} onChange={()=>toggle(t.id,t.completed)} />
              <span className={t.completed ? 'line-through' : ''}>{t.text} - {t.assignee}</span>
            </li>
          ))}
        </ul>
      </div>
    </Layout>
  );
}
