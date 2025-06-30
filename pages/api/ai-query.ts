import type { NextApiRequest, NextApiResponse } from 'next';
import db from '../../lib/db';
import { withRetry } from '../../lib/withRetry';
import { getSchemaDescription } from '../../lib/schema';

export const config = { api: { bodyParser: { sizeLimit: '1mb' } } };

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end();

  const { userQuery } = req.body || {};
  if (!userQuery) return res.status(400).json({ error: 'Missing userQuery' });

const schema = getSchemaDescription();
const systemPrompt = `You are Proovia AI Assistant, a helpful SQL expert working inside a courier company web app.

Your job is to:
- Understand user requests written in natural human language (English).
- Translate them into safe and valid SQL queries that match the structure of the SQLite database.
- Execute the query and return the result to the user in a clear, readable format.
- Explain the SQL you used only if asked.

Use only SELECT queries. Never modify, insert, update, or delete data.
Reject any question that looks unsafe or unrelated to the database.

Here is the database schema:
${schema}

Be smart and helpful. Do not hallucinate table names or columns. Always use this schema.

If you're not sure — ask the user for clarification.`;


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
