import type { NextApiRequest, NextApiResponse } from 'next';
import db from '../../lib/db';
import { createHash } from 'crypto';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end();
  const { username, password } = req.body || {};
  if (!username || !password) {
    return res.status(400).json({ message: 'Missing username or password' });
  }
  const hashed = createHash('sha256').update(password).digest('hex');
  const user = db.prepare('SELECT id FROM users WHERE username = ? AND password = ?').get(username, hashed);
  if (!user) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }
  db.prepare('UPDATE users SET last_seen = CURRENT_TIMESTAMP WHERE username = ?').run(username);
  // The frontend relies on accessing the "user" cookie via `document.cookie`.
  // Setting the cookie as HttpOnly prevents client-side code from reading it,
  // which causes the navbar to always show the login button even after a
  // successful login.  We therefore omit the HttpOnly flag so the React hooks
  // can read the cookie and display user information.
  res.setHeader('Set-Cookie', `user=${username}; Path=/`);
  return res.status(200).json({ message: 'Logged in' });
}
