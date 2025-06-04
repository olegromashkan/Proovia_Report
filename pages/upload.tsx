import { useState, ChangeEvent } from 'react';
import Head from 'next/head';
import Navbar from '../components/Navbar';

export default function Upload() {
  const [message, setMessage] = useState('');

  const handleFile = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const text = await file.text();
    try {
      const json = JSON.parse(text);
      const res = await fetch('/api/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(json),
      });
      if (res.ok) {
        setMessage('Upload successful');
      } else {
        setMessage('Upload failed');
      }
    } catch {
      setMessage('Invalid JSON');
    }
  };

  return (
    <>
      <Head>
        <title>Upload JSON</title>
      </Head>
      <Navbar />
      <main className="p-4">
        <h1 className="text-2xl font-bold mb-4">Upload JSON</h1>
        <input type="file" accept=".json" onChange={handleFile} />
        {message && <p className="mt-2">{message}</p>}
      </main>
    </>
  );
}
