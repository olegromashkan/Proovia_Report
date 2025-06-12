import { useState } from 'react';
import Modal from './Modal';
import useFetch from '../lib/useFetch';
import useUser from '../lib/useUser';

interface Props {
  open: boolean;
  onClose: () => void;
  onCreated?: (id: number) => void;
}

export default function CreateGroupModal({ open, onClose, onCreated }: Props) {
  const me = useUser();
  const { data } = useFetch<{ users: any[] }>(open ? '/api/users' : null);
  const users = data?.users || [];
  const [name, setName] = useState('');
  const [members, setMembers] = useState<string[]>([]);
  const [photo, setPhoto] = useState('');

  const toggle = (u: string) => {
    setMembers((prev) =>
      prev.includes(u) ? prev.filter((x) => x !== u) : [...prev, u]
    );
  };

  const create = async () => {
    const res = await fetch('/api/chats', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, members, photo }),
    });
    if (res.ok) {
      const d = await res.json();
      onCreated?.(d.id);
      setName('');
      setMembers([]);
      onClose();
    }
  };

  return (
    <Modal open={open} onClose={onClose}>
      <h2 className="text-lg font-semibold mb-4">New Group</h2>
      <input
        type="text"
        placeholder="Group name"
        className="input input-bordered w-full mb-4"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
      <input
        type="text"
        placeholder="Avatar URL (optional)"
        className="input input-bordered w-full mb-4"
        value={photo}
        onChange={(e) => setPhoto(e.target.value)}
      />
      <div className="max-h-60 overflow-y-auto space-y-1">
        {users
          .filter((u) => u.username !== me)
          .map((u) => (
            <label key={u.id} className="flex items-center gap-2">
              <input
                type="checkbox"
                className="checkbox"
                checked={members.includes(u.username)}
                onChange={() => toggle(u.username)}
              />
              <span>{u.username}</span>
            </label>
          ))}
      </div>
      <div className="mt-4 flex justify-end gap-2">
        <button onClick={onClose} className="btn btn-sm">
          Cancel
        </button>
        <button
          onClick={create}
          disabled={!name.trim() || members.length === 0}
          className="btn btn-primary btn-sm"
        >
          Create
        </button>
      </div>
    </Modal>
  );
}
