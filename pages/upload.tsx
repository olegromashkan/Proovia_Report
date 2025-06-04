import { useState, ChangeEvent } from 'react';
import Layout from '../components/Layout';

export default function Upload() {
  const [message, setMessage] = useState('');
  const [progress, setProgress] = useState(0);
  const [logs, setLogs] = useState<string[]>([]);

  const handleFile = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setProgress(0);
    setLogs([]);
    setMessage('');

    const text = await file.text();
    try {
      const json = JSON.parse(text);
      setLogs((l) => [...l, 'File parsed, starting upload...']);

      const xhr = new XMLHttpRequest();
      xhr.open('POST', '/api/upload');
      xhr.setRequestHeader('Content-Type', 'application/json');

      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          setProgress(Math.round((event.loaded / event.total) * 100));
        }
      };

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          setMessage('Upload successful');
          setLogs((l) => [...l, 'Server responded with success']);
        } else {
          setMessage('Upload failed');
          setLogs((l) => [...l, `Server error: ${xhr.statusText}`]);
        }
      };

      xhr.onerror = () => {
        setMessage('Upload failed');
        setLogs((l) => [...l, 'Network error during upload']);
      };

      xhr.send(JSON.stringify(json));
    } catch {
      setMessage('Invalid JSON');
      setLogs((l) => [...l, 'Failed to parse JSON']);
    }
  };

  return (
    <Layout title="Upload JSON">
      <h1 className="text-2xl font-bold">Upload JSON</h1>
      <input type="file" accept=".json" onChange={handleFile} />
      <progress className="w-full" value={progress} max={100}></progress>
      {message && <p>{message}</p>}
      {logs.length > 0 && (
        <div className="bg-gray-100 p-2 rounded">
          <h2 className="font-semibold">Logs</h2>
          <ul className="list-disc list-inside text-sm">
            {logs.map((log, idx) => (
              <li key={idx}>{log}</li>
            ))}
          </ul>
        </div>
      )}
    </Layout>
  );
}
