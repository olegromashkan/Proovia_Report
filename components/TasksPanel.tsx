import { useState, useEffect } from 'react';
import Icon from './Icon';
import useFetch from '../lib/useFetch';

interface TasksPanelProps {
  open: boolean;
  onClose: () => void;
}

export default function TasksPanel({ open, onClose }: TasksPanelProps) {
  const [tasks, setTasks] = useState<any[]>([]);
  const [text, setText] = useState('');
  const [assignee, setAssignee] = useState('');
  const { data } = useFetch<{ users: any[] }>(open ? '/api/users' : null);
  const users = data?.users || [];

  const load = async () => {
    const res = await fetch('/api/tasks');
    if (res.ok) {
      const d = await res.json();
      setTasks(d.tasks);
    }
  };

  useEffect(() => {
    if (open) load();
  }, [open]);

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

  if (!open) return null;

  return (
    <div className="fixed bottom-4 right-4 w-80 bg-base-100 text-base-content rounded-system shadow-system z-50 p-4 space-y-3">
      <div className="flex justify-between items-center">
        <h3 className="font-semibold text-lg">Tasks</h3>
        <button onClick={onClose} className="btn btn-xs btn-ghost">
          <Icon name="xmark" />
        </button>
      </div>
      <textarea
        value={text}
        onChange={e => setText(e.target.value)}
        placeholder="Task"
        rows={3}
        className="textarea textarea-bordered w-full"
      />
      <input
        list="task-users"
        value={assignee}
        onChange={e => setAssignee(e.target.value)}
        placeholder="@user"
        className="input input-bordered w-full"
      />
      <datalist id="task-users">
        {users.map(u => (
          <option key={u.id} value={u.username} />
        ))}
      </datalist>
      <button onClick={create} className="btn btn-primary w-full">Add</button>
      <ul className="space-y-2 max-h-60 overflow-y-auto">
        {tasks.map(t => (
          <li key={t.id} className="flex items-center gap-2">
            <input type="checkbox" checked={!!t.completed} onChange={() => toggle(t.id, t.completed)} />
            <span className={t.completed ? 'line-through' : ''}>{t.text} - {t.assignee}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
