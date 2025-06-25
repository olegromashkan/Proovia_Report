import { useEffect, useState, ChangeEvent } from 'react';

interface Bg {
  id: number;
  url: string;
}

export default function BackgroundSettingsPanel() {
  const [images, setImages] = useState<Bg[]>([]);
  const [file, setFile] = useState('');

  const load = async () => {
    const res = await fetch('/api/backgrounds');
    if (res.ok) {
      const d = await res.json();
      setImages(d.backgrounds || []);
    }
  };

  useEffect(() => { load(); }, []);

  const handleFile = (e: ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = () => setFile(reader.result as string);
    reader.readAsDataURL(f);
  };

  const add = async () => {
    if (!file) return;
    await fetch('/api/backgrounds', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: file })
    });
    setFile('');
    load();
  };

  const remove = async (id: number) => {
    await fetch(`/api/backgrounds?id=${id}`, { method: 'DELETE' });
    load();
  };

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold">Background Images</h2>
      <div className="space-y-2">
        <input type="file" accept="image/*" onChange={handleFile} className="file-input file-input-bordered w-full" />
        {file && <img src={file} alt="preview" className="h-32 object-cover rounded" />}
        {file && (
          <button className="btn btn-primary mt-2" onClick={add}>Add</button>
        )}
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {images.map(i => (
          <div key={i.id} className="relative">
            <img src={i.url} className="w-full h-24 object-cover rounded" />
            <button onClick={() => remove(i.id)} className="absolute top-1 right-1 bg-white/70 rounded p-1 text-red-600">
              &times;
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
