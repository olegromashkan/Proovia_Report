import { useEffect, useState } from 'react';
import Modal from './Modal';
import ThemeToggle from './ThemeToggle';
import useCurrentUser from '../lib/useCurrentUser';

interface Props {
  open: boolean;
  onClose: () => void;
}

interface Bg {
  id: number;
  url: string;
}

export default function WelcomeModal({ open, onClose }: Props) {
  const user = useCurrentUser();
  const [bgs, setBgs] = useState<Bg[]>([]);
  const [selected, setSelected] = useState('');

  useEffect(() => {
    if (open) {
      fetch('/api/backgrounds')
        .then(res => res.ok ? res.json() : Promise.reject())
        .then(d => setBgs(d.backgrounds || []))
        .catch(() => {});
    }
  }, [open]);

  useEffect(() => {
    setSelected(user?.header || '');
  }, [user]);

  const save = async () => {
    if (user && selected !== user.header) {
      await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ header: selected })
      });
    }
    localStorage.setItem('welcomeSeen', '1');
    onClose();
  };

  return (
    <Modal open={open} onClose={save} className="max-w-3xl">
      <h2 className="text-2xl font-bold mb-4">Welcome{user ? `, ${user.username}` : ''}!</h2>
      <p className="mb-4 text-sm">Use the navigation below to explore reports and upload data.</p>
      <h3 className="text-lg font-semibold mb-2">Changelog</h3>
      <ul className="list-disc list-inside text-sm mb-4">
        <li>Added background customization</li>
        <li>General improvements</li>
      </ul>
      <h3 className="text-lg font-semibold mb-2">Theme</h3>
      <ThemeToggle />
      <h3 className="text-lg font-semibold mt-4 mb-2">Background</h3>
      <div className="flex gap-2 overflow-x-auto pb-2">
        {user?.header && (
          <img
            src={user.header}
            onClick={() => setSelected(user.header)}
            className={`h-24 w-40 object-cover rounded cursor-pointer ${selected === user.header ? 'ring-4 ring-primary' : ''}`}
          />
        )}
        {bgs.map(bg => (
          <img
            key={bg.id}
            src={bg.url}
            onClick={() => setSelected(bg.url)}
            className={`h-24 w-40 object-cover rounded cursor-pointer ${selected === bg.url ? 'ring-4 ring-primary' : ''}`}
          />
        ))}
      </div>
      <div className="text-right mt-4">
        <button className="btn btn-primary" onClick={save}>Start</button>
      </div>
    </Modal>
  );
}
