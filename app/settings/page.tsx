'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

type Engine = 'mock' | 'duckdb';

export default function SettingsPage() {
  const [engine, setEngine] = useState<Engine>('mock');
  const [duckdbPath, setDuckdbPath] = useState('./data/analytics.duckdb');
  const [message, setMessage] = useState<string | null>(null);

  const loadCurrent = async () => {
    const res = await fetch('/api/db/current');
    const data = await res.json();
    setEngine(data.engine);
    if (data.duckdbPath) setDuckdbPath(data.duckdbPath);
  };

  const testConn = async () => {
    const res = await fetch('/api/db/test', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ engine, duckdbPath }),
    });
    const data = await res.json();
    if (data.ok) setMessage(`OK: ${data.version}`);
    else setMessage(`Error: ${data.error}`);
  };

  const save = async () => {
    const res = await fetch('/api/db/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ engine, duckdbPath }),
    });
    const data = await res.json();
    if (data.ok) setMessage('Сохранено');
    else setMessage(`Error: ${data.error}`);
  };

  return (
    <main className="max-w-lg mx-auto space-y-4">
      <h1 className="text-xl font-semibold">Настройки</h1>
      <div className="space-y-2">
        <Label>Движок базы данных</Label>
        <RadioGroup value={engine} onValueChange={v => setEngine(v as Engine)} className="flex space-x-4">
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="mock" id="mock" />
            <Label htmlFor="mock">mock</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="duckdb" id="duckdb" />
            <Label htmlFor="duckdb">duckdb</Label>
          </div>
        </RadioGroup>
      </div>
      {engine === 'duckdb' && (
        <div className="space-y-2">
          <Label htmlFor="duckdbPath">Путь к файлу</Label>
          <Input id="duckdbPath" value={duckdbPath} onChange={e => setDuckdbPath(e.target.value)} />
        </div>
      )}
      <div className="flex space-x-2">
        <Button type="button" onClick={testConn}>Проверить подключение</Button>
        <Button type="button" onClick={save} variant="secondary">Сохранить</Button>
        <Button type="button" onClick={loadCurrent} variant="outline">Загрузить текущие</Button>
      </div>
      {message && <p>{message}</p>}
    </main>
  );
}
