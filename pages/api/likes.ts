import type { NextApiRequest, NextApiResponse } from 'next';
import db, { addNotification } from '../../lib/db';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const username = req.cookies.user;
  if (!username) return res.status(401).end();
  const { post } = req.query as { post?: string };
  if (!post) return res.status(400).end();

  if (req.method === 'POST') {
    db.prepare('INSERT OR IGNORE INTO post_likes (post_id, username) VALUES (?, ?)').run(post, username);
    const owner = db.prepare('SELECT username FROM posts WHERE id = ?').get(post) as { username?: string };
    if (owner?.username && owner.username !== username) {
      addNotification('like', `${username} liked ${owner.username}'s post`);
    }
    return res.status(200).json({ message: 'Liked' });
  }

  if (req.method === 'DELETE') {
    db.prepare('DELETE FROM post_likes WHERE post_id = ? AND username = ?').run(post, username);
    return res.status(200).json({ message: 'Unliked' });
  }

  res.status(405).end();
}
