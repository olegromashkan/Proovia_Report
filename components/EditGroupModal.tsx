import { useEffect, useState, ChangeEvent } from 'react';
import Modal from './Modal';

interface Props {
  open: boolean;
  chat: { id: number; name: string; photo?: string } | null;
  onClose: () => void;
  onSaved?: () => void;
}

export default function EditGroupModal({ open, chat, onClose, onSaved }: Props) {
  const [name, setName] = useState('');
  const [photo, setPhoto] = useState<string>('');

  useEffect(() => {
    if (chat) {
      setName(chat.name);
      setPhoto(chat.photo || '');
    }
  }, [chat]);

  const handlePhoto = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setPhoto(reader.result as string);
    reader.readAsDataURL(file);
  };

  const save = async () => {
    if (!chat) return;
    await fetch('/api/chats', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: chat.id, name, photo }),
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
