import { useState, useEffect, DragEvent, ChangeEvent } from 'react';
import Layout from '../components/Layout';
import Icon from '../components/Icon';
import UploadHistory from '../components/UploadHistory';

export default function Upload() {
  const [files, setFiles] = useState<File[]>([]);
  const [progress, setProgress] = useState(0);
  const [logs, setLogs] = useState<string[]>([]);
  const [message, setMessage] = useState('');

  const limit =
    (typeof window !== 'undefined'
      ? parseInt(localStorage.getItem('uploadLimit') || '10', 10)
      : 10) * 1024 * 1024;
  const allowed: string[] =
    typeof window !== 'undefined'
      ? JSON.parse(localStorage.getItem('uploadTypes') || '["json","csv"]')
      : ['json', 'csv'];

  const accept = allowed.map((t) => '.' + t).join(',');

  const addFiles = (list: FileList) => {
    const arr = Array.from(list).filter(
      (f) =>
        allowed.some((t) => f.name.toLowerCase().endsWith('.' + t)) &&
        f.size <= limit,
    );
    if (arr.length) setFiles((cur) => [...cur, ...arr]);
  };

  const handleInput = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) addFiles(e.target.files);
    e.target.value = '';
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files) addFiles(e.dataTransfer.files);
  };

  const handleDrag = (e: DragEvent<HTMLDivElement>) => e.preventDefault();

  const startUpload = async () => {
    if (files.length === 0) return;
    setProgress(0);
    setLogs([]);
    setMessage('');
    let loaded = 0;
    const total = files.reduce((a, f) => a + f.size, 0);
    for (const file of files) {
      setLogs((l) => [...l, `Uploading ${file.name}`]);
      const text = await file.text();
      let payload: any;
      try {
        payload = JSON.parse(text);
      } catch {
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
        } catch {
          setLogs((l) => [...l, `Failed to parse ${file.name}`]);
          loaded += file.size;
          setProgress(Math.round((loaded / total) * 100));
          continue;
        }
      }
      await new Promise<void>((resolve) => {
        const xhr = new XMLHttpRequest();
        xhr.open('POST', '/api/upload');
        xhr.setRequestHeader('Content-Type', 'application/json');
        xhr.upload.onprogress = (ev) => {
          if (ev.lengthComputable) {
            setProgress(Math.round(((loaded + ev.loaded) / total) * 100));
          }
        };
        xhr.onload = () => {
          loaded += file.size;
          if (xhr.status >= 200 && xhr.status < 300) {
            setLogs((l) => [...l, `${file.name} uploaded`]);
          } else {
            setLogs((l) => [...l, `${file.name} failed: ${xhr.statusText}`]);
          }
          setProgress(Math.round((loaded / total) * 100));
          resolve();
        };
        xhr.onerror = () => {
          loaded += file.size;
          setLogs((l) => [...l, `${file.name} network error`]);
          setProgress(Math.round((loaded / total) * 100));
          resolve();
        };
        xhr.send(JSON.stringify(payload));
      });
    }
    setMessage('Done');
    setFiles([]);
  };

  return (
    <Layout title="Upload Files">
      <h1 className="text-2xl font-bold mb-4">Upload Files</h1>
      <div
        className="border-2 border-dashed rounded-lg p-6 text-center bg-white cursor-pointer"
        onDrop={handleDrop}
        onDragOver={handleDrag}
      >
        <input
          id="file"
          type="file"
          multiple
          accept={accept}
          onChange={handleInput}
          className="hidden"
        />
        <label htmlFor="file" className="text-gray-500 flex flex-col items-center gap-2">
          <Icon name="file-arrow-up" className="text-3xl" />
          <span>Drag files here or click to select</span>
        </label>
      </div>
      {files.length > 0 && (
        <div className="mt-4">
          <h2 className="font-medium mb-1">Files to upload</h2>
          <ul className="list-disc list-inside text-sm space-y-1">
            {files.map((f) => (
              <li key={f.name}>{f.name}</li>
            ))}
          </ul>
        </div>
      )}
      <button
        className="btn mt-4 bg-indigo-600"
        onClick={startUpload}
        disabled={files.length === 0}
      >
        Upload
      </button>
      <progress
        className="w-full h-2 rounded bg-gray-200 mt-4"
        value={progress}
        max={100}
      ></progress>
      {message && <p className="mt-2">{message}</p>}
      {logs.length > 0 && (
        <div className="bg-gray-100 p-2 rounded mt-4">
          <h2 className="font-semibold">Logs</h2>
          <ul className="list-disc list-inside text-sm">
            {logs.map((log, idx) => (
              <li key={idx}>{log}</li>
            ))}
          </ul>
        </div>
      )}
      <div className="mt-6">
        <UploadHistory />
      </div>
    </Layout>
  );
}
