export default async function Home() {
  const res = await fetch('http://localhost:3000/api/db/ping', { cache: 'no-store' });
  const data = await res.json();
  return (
    <main className="max-w-sm mx-auto">
      <div className="border rounded p-4">
        <h2 className="text-lg font-semibold mb-2">Статус подключения к БД</h2>
        <p>Движок: {data.engine}</p>
        <p>Подключено: {String(data.connected)}</p>
        {data.version && <p>Версия: {data.version}</p>}
      </div>
    </main>
  );
}
