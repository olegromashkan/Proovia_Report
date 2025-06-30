import type { NextApiRequest, NextApiResponse } from 'next';
import db from '../../lib/db';
import { withRetry } from '../../lib/withRetry';

export const config = { api: { bodyParser: { sizeLimit: '1mb' } } };

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end();

  const { userQuery } = req.body || {};
  if (!userQuery) return res.status(400).json({ error: 'Missing userQuery' });

  const systemPrompt = `
Ты AI-помощник логистической компании. Превращай команды в SQL.
Таблицы: users, tasks, messages, posts.
Отвечай ТОЛЬКО SQL-запросом, без объяснений.
`;

  try {
    const response = await fetch('http://localhost:11434/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'phi',
        prompt: `${systemPrompt}\nПользователь: ${userQuery}`,
        stream: false,
      }),
    });

    const data = await response.json();
    const sql = String(data.response || '').trim();

    if (!sql.toLowerCase().startsWith('select')) {
      return res.status(400).json({ error: 'AI вернул опасный SQL' });
    }

    const result = await withRetry(() => db.prepare(sql).all());
    res.status(200).json({ sql, result });
  } catch (err: any) {
    res.status(500).json({ error: 'Ошибка выполнения', details: err.message });
  }
}
