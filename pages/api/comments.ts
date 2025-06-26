import type { NextApiRequest, NextApiResponse } from 'next';
import db, { addNotification } from '../../lib/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const current = req.cookies.user || '';

  if (req.method === 'GET') {
    const { post } = req.query as { post?: string };
    if (!post) return res.status(400).end();
    const rows = await db
      .prepare(
        'SELECT c.id, c.post_id, c.username, c.text, c.created_at, u.photo FROM post_comments c JOIN users u ON c.username = u.username WHERE post_id = ? ORDER BY c.created_at ASC'
      )
      .all(post);
    return res.status(200).json({ comments: rows });
  }

  if (!current) return res.status(401).end();

  if (req.method === 'POST') {
    const { post: postId, text } = req.body || {};
    if (!postId || !text) return res.status(400).json({ message: 'Missing fields' });
    await db
      .prepare('INSERT INTO post_comments (post_id, username, text) VALUES (?, ?, ?)')
      .run(postId, current, text);
    const owner = (await db
      .prepare('SELECT username FROM posts WHERE id = ?')
      .get(postId)) as { username?: string };
    if (owner?.username && owner.username !== current) {
      addNotification('comment', `${current} commented on ${owner.username}'s post`);
    }
    return res.status(200).json({ message: 'Created' });
  }

  if (req.method === 'DELETE') {
    const { id } = req.query as { id?: string };
    if (!id) return res.status(400).end();
    const comment = await db
      .prepare('SELECT username FROM post_comments WHERE id = ?')
      .get(id);
    if (!comment) return res.status(404).end();
    if (comment.username !== current) return res.status(403).end();
    await db.prepare('DELETE FROM post_comments WHERE id = ?').run(id);
    return res.status(200).json({ message: 'Deleted' });
  }

  res.status(405).end();
}
