import type { NextApiRequest, NextApiResponse } from 'next';

const API_BASE = 'https://app.trengo.com/api/v2';
// TODO: Replace with your actual API key or environment variable
const API_KEY = 'YOUR_TRENGO_API_KEY';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { start = '', end = '', channel = '' } = req.query as Record<string, string>;

  if (!start || !end) {
    return res.status(400).json({ message: 'Missing start or end date' });
  }

  const params = new URLSearchParams({ start, end });
  if (channel) params.append('channel', channel);

  try {
    const response = await fetch(`${API_BASE}/reports/tickets?${params.toString()}`, {
      headers: {
        Authorization: `Bearer ${API_KEY}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const text = await response.text();
      console.error('Trengo API error', response.status, text);
      return res.status(response.status).json({ message: 'Trengo API error', details: text });
    }

    const data = await response.json();
    res.status(200).json(data);
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ message: 'Server error', details: err.message });
  }
}
