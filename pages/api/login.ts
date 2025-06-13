import type { NextApiRequest, NextApiResponse } from 'next';
import db from '../../lib/db';
import { createHash } from 'crypto';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ message: 'Method not allowed' });
    return;
  }
  const { username, password } = req.body || {};
  if (!username || !password) {
    res.status(400).json({ message: 'Missing username or password' });
    return;
  }
  const hashed = createHash('sha256').update(password).digest('hex');
  let user: any;
  try {
    user = db
      .prepare('SELECT id, username, photo, header FROM users WHERE username = ? AND password = ?')
      .get(username, hashed);
  } catch (err: any) {
    if (err.code === 'SQLITE_BUSY') {
      res.status(503).json({ message: 'Database is busy' });
      return;
    }
    throw err;
  }
  if (!user) {
    res.status(401).json({ message: 'Invalid credentials' });
    return;
  }
  try {
    db.prepare('UPDATE users SET status = ?, last_seen = CURRENT_TIMESTAMP WHERE username = ?').run('online', username);
  } catch (err: any) {
    if (err.code === 'SQLITE_BUSY') {
      res.status(503).json({ message: 'Database is busy' });
      return;
    }
    throw err;
  }
  // The frontend relies on accessing the "user" cookie via `document.cookie`.
  // Setting the cookie as HttpOnly prevents client-side code from reading it,
  // which causes the navbar to always show the login button even after a
  // successful login.  We therefore omit the HttpOnly flag so the React hooks
  // can read the cookie and display user information.
  // Encode the username to ensure the cookie only contains ASCII characters
  // Browsers expect cookie values to be ASCII-only, otherwise setting the
  // cookie may fail with a runtime error.
  res.setHeader('Set-Cookie', `user=${encodeURIComponent(username)}; Path=/`);
  res.status(200).json({ message: 'Logged in', user });
  return;
}
