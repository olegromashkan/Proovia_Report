// pages/api/ai-query.ts

import type { NextApiRequest, NextApiResponse } from 'next';
import db from '../../lib/db';
import { withRetry } from '../../lib/withRetry';
import { getSchemaDescription } from '../../lib/schema';

export const config = { api: { bodyParser: { sizeLimit: '1mb' } } };

// Определяем единый тип ответа для фронтенда
type AiApiResponse = {
  type: 'sql' | 'conversation' | 'error';
  sqlQuery?: string;
  data?: unknown;
  responseText?: string;
  error?: string;
  details?: string;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<AiApiResponse>
) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).end('Method Not Allowed');
  }

  const { userQuery } = req.body;
  if (!userQuery || typeof userQuery !== 'string') {
    return res.status(400).json({ type: 'error', error: 'Missing or invalid userQuery' });
  }

  const schema = getSchemaDescription();

  // Улучшенный системный промпт:
  // Мы просим AI явно указывать тип ответа с помощью префиксов.
  const systemPrompt = `You are Proovia AI Assistant. Your task is to analyze the user's request and respond in one of two ways:

1.  **If the request is about data, orders, customers, or the database (an SQL query):**
    - Translate the natural language request into a safe SQLite SELECT query.
    - Your entire response MUST start with the prefix "SQL_QUERY:".
    - Example: "SQL_QUERY: SELECT * FROM orders WHERE status = 'delivered';"
    - Use only the provided schema:
      ${schema}

2.  **If the request is a general greeting, question, or conversation (not about database data):**
    - Provide a helpful, conversational response in the user's language (English or Russian).
    - Your entire response MUST start with the prefix "CONVERSATION:".
    - Example: "CONVERSATION: Hello! How can I assist you with your courier needs today?"

Analyze the user's query and provide a response with the correct prefix.

User: "${userQuery}"
Assistant:`;

  try {
    const response = await fetch('http://localhost:11434/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'gemma:2b', // Убедитесь, что ваша модель достаточно мощная для этой задачи
        prompt: systemPrompt,
        stream: false,
      }),
    });

    if (!response.ok) {
        throw new Error(`AI service returned status ${response.status}`);
    }

    const data = await response.json();
    const aiResponse = String(data.response || '').trim();

    // Теперь мы парсим ответ AI, а не угадываем
    if (aiResponse.startsWith('SQL_QUERY:')) {
      const sql = aiResponse.substring('SQL_QUERY:'.length).trim();

      if (!sql.toLowerCase().startsWith('select')) {
        return res.status(400).json({ type: 'error', error: 'AI returned an unsafe query.' });
      }

      const result = await withRetry(() => db.prepare(sql).all());
      return res.status(200).json({ type: 'sql', sqlQuery: sql, data: result });

    } else if (aiResponse.startsWith('CONVERSATION:')) {
      const text = aiResponse.substring('CONVERSATION:'.length).trim();
      return res.status(200).json({ type: 'conversation', responseText: text });

    } else {
      // Если AI не вернул префикс, считаем это обычным разговором (безопасный вариант)
      return res.status(200).json({ type: 'conversation', responseText: aiResponse });
    }

  } catch (err: any) {
    console.error(err); // Логирование ошибки на сервере важно
    return res.status(500).json({
      type: 'error',
      error: 'An error occurred while processing your request.',
      details: err.message,
    });
  }
}