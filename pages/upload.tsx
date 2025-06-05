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
    let payload: any = null;
    try {
      payload = JSON.parse(text);
      setLogs((l) => [...l, 'File parsed as JSON, starting upload...']);
    
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

      xhr.send(JSON.stringify(payload));
    } catch {
      // try CSV parsing
      try {
        const lines = text.trim().split(/\r?\n/);
        const headers = lines[0]
          .split(/,(?=(?:[^"]*"[^"]*")*[^"]*$)/)
          .map((h) => h.replace(/^"|"$/g, ''));
        const items = lines.slice(1).map((line) => {
          const values = line
            .split(/,(?=(?:[^"]*"[^"]*")*[^"]*$)/)
            .map((v) => v.replace(/^"|"$/g, ''));
          const obj: any = {};
          headers.forEach((h, i) => {
            obj[h] = values[i];
          });
          return obj;
        });
        payload = { csvTrips: items };
        setLogs((l) => [...l, 'CSV parsed, starting upload...']);

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

        xhr.send(JSON.stringify(payload));
      } catch {
        setMessage('Invalid file');
        setLogs((l) => [...l, 'Failed to parse file']);
      }
    }
  };

  return (
    <Layout title="Upload JSON">
      <h1 className="text-2xl font-bold">Upload JSON</h1>
      <input id="file" type="file" accept=".json,.csv" onChange={handleFile} className="hidden" />
      <label htmlFor="file" className="btn mb-2 cursor-pointer bg-indigo-600">
        <i className="fa-solid fa-file-arrow-up" />
        <span>Select File</span>
      </label>
      <progress className="w-full h-2 rounded bg-gray-200" value={progress} max={100}></progress>
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
