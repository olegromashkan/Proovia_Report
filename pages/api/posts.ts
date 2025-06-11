import type { NextApiRequest, NextApiResponse } from 'next';
import db from '../../lib/db';

export const config = { api: { bodyParser: { sizeLimit: '5mb' } } };

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const current = req.cookies.user || '';

  if (req.method === 'GET') {
    const { user } = req.query as { user?: string };
    const base = `
      SELECT p.id, p.username, p.content, p.image, p.created_at, u.photo,
        (SELECT COUNT(*) FROM post_likes WHERE post_id = p.id) as likes,
        (SELECT COUNT(*) FROM post_comments WHERE post_id = p.id) as comments,
        (SELECT 1 FROM post_likes WHERE post_id = p.id AND username = ?) as liked
      FROM posts p JOIN users u ON p.username = u.username`;
    let rows;
    if (user) {
      rows = db.prepare(`${base} WHERE p.username = ? ORDER BY p.created_at DESC`).all(current, user);
    } else {
      rows = db.prepare(`${base} ORDER BY p.created_at DESC`).all(current);
    }
    return res.status(200).json({ posts: rows });
  }

  if (req.method === 'POST') {
    if (!current) return res.status(401).end();
    const { content, image } = req.body || {};
    if (!content && !image) return res.status(400).json({ message: 'Missing content' });
    db.prepare('INSERT INTO posts (username, content, image) VALUES (?, ?, ?)').run(current, content || '', image || null);
    return res.status(200).json({ message: 'Created' });
  }

  if (req.method === 'DELETE') {
    const { id } = req.query as { id?: string };
    if (!id) return res.status(400).end();
    const post = db.prepare('SELECT username FROM posts WHERE id = ?').get(id);
    if (!post) return res.status(404).end();
    if (post.username !== current) return res.status(403).end();
    db.prepare('DELETE FROM post_likes WHERE post_id = ?').run(id);
    db.prepare('DELETE FROM post_comments WHERE post_id = ?').run(id);
    db.prepare('DELETE FROM posts WHERE id = ?').run(id);
    return res.status(200).json({ message: 'Deleted' });
  }

  res.status(405).end();
}
