import { useEffect, useState, ChangeEvent } from 'react';
import Modal from './Modal';
import useFetch from '../lib/useFetch';

interface Props {
  open: boolean;
  chat: { id: number; name: string; photo?: string } | null;
  onClose: () => void;
  onSaved?: () => void;
}

export default function EditGroupModal({ open, chat, onClose, onSaved }: Props) {
  const [name, setName] = useState('');
  const [photo, setPhoto] = useState<string>('');
  const [members, setMembers] = useState<string[]>([]);
  const { data } = useFetch<{ users: any[] }>(open ? '/api/users' : null);
  const users = Array.isArray(data?.users) ? data.users : [];

  useEffect(() => {
    if (chat && open) {
      setName(chat.name);
      setPhoto(chat.photo || '');
      fetch(`/api/chats?id=${chat.id}`)
        .then((res) => res.json())
        .then((d) => setMembers(d.members || []));
    }
  }, [chat, open]);

  const handlePhoto = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setPhoto(reader.result as string);
    reader.readAsDataURL(file);
  };

  const toggle = (u: string) => {
    setMembers((prev) =>
      prev.includes(u) ? prev.filter((x) => x !== u) : [...prev, u]
    );
  };

  const save = async () => {
    if (!chat) return;
    const originalRes = await fetch(`/api/chats?id=${chat.id}`);
    const original = await originalRes.json();
    const originalMembers: string[] = original.members || [];
    const addMembers = members.filter((m) => !originalMembers.includes(m));
    const removeMembers = originalMembers.filter((m) => !members.includes(m));
    await fetch('/api/chats', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: chat.id, name, photo, addMembers, removeMembers }),
    });
    onSaved?.();
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose}>
      <h2 className="text-lg font-semibold mb-4">Edit Group</h2>
      <input
        type="text"
        className="input input-bordered w-full mb-4"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
      <input
        type="file"
        accept="image/*"
        onChange={handlePhoto}
        className="file-input file-input-bordered w-full mb-4"
      />
      {photo && (
        <img
          src={photo}
          alt="Preview"
          className="w-16 h-16 rounded-full mb-4 object-cover"
        />
      )}
      <div className="max-h-60 overflow-y-auto space-y-1 mb-4">
        {users.map((u) => (
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
        <button onClick={save} className="btn btn-primary btn-sm" disabled={!name.trim()}>
          Save
        </button>
      </div>
    </Modal>
  );
}
