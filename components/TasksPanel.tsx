import { useState, useEffect } from 'react';
import Icon from './Icon';
import useFetch from '../lib/useFetch';

interface User {
  id: string;
  username: string;
}

interface Task {
  id: number;
  text: string;
  assignee: string;
  completed: number;
}

interface FetchUsers {
  users: User[];
}

interface TasksPanelProps {
  open: boolean;
  onClose: () => void;
}

export default function TasksPanel({ open, onClose }: TasksPanelProps) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [text, setText] = useState('');
  const [assignee, setAssignee] = useState('');
  const { data } = useFetch<FetchUsers>(open ? '/api/users' : null);
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
      body: JSON.stringify({ assignee, text }),
    });
    setText('');
    setAssignee('');
    load();
  };

  const toggle = async (id: number, completed: number) => {
    await fetch('/api/tasks', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, completed: !completed }),
    });
    load();
  };

  if (!open) return null;

  return (
    <div className="fixed bottom-6 right-6 w-full max-w-sm bg-white dark:bg-gray-800 rounded-2xl shadow-xl z-50 p-6 border border-gray-200 dark:border-gray-700">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2m-4 4h4m-4 4h4m-8-8v12" />
          </svg>
          Tasks
        </h3>
        <button
          onClick={onClose}
          className="btn btn-sm btn-ghost text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Task Description
          </label>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Enter task description"
            rows={3}
            className="textarea textarea-bordered w-full bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Assignee
          </label>
          <input
            list="task-users"
            value={assignee}
            onChange={(e) => setAssignee(e.target.value)}
            placeholder="@username"
            className="input input-bordered w-full bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          <datalist id="task-users">
            {users.map((u) => (
              <option key={u.id} value={u.username} />
            ))}
          </datalist>
        </div>

        <button
          onClick={create}
          disabled={!text || !assignee}
          className="btn btn-primary w-full flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
          </svg>
          Add Task
        </button>
      </div>

      <div className="mt-6 max-h-64 overflow-y-auto pr-2">
        {tasks.length === 0 ? (
          <div className="text-center text-gray-500 dark:text-gray-400 text-sm py-4">
            No tasks available
          </div>
        ) : (
          <ul className="space-y-3">
            {tasks.map((t) => (
              <li
                key={t.id}
                className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600 transition-all"
              >
                <input
                  type="checkbox"
                  checked={!!t.completed}
                  onChange={() => toggle(t.id, t.completed)}
                  className="checkbox checkbox-primary"
                />
                <div className="flex-1">
                  <span className={`text-sm ${t.completed ? 'line-through text-gray-500 dark:text-gray-400' : 'text-gray-900 dark:text-white'}`}>
                    {t.text}
                  </span>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    Assigned to: {t.assignee}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}