import type { NextApiRequest, NextApiResponse } from 'next';
import db, { addNotification } from '../../lib/db';

export const config = { api: { bodyParser: { sizeLimit: '5mb' } } };

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const current = req.cookies.user || '';

  if (req.method === 'GET') {
    const { user, type, limit } = req.query as { user?: string; type?: string; limit?: string };
    const base = `
      SELECT p.id, p.username, p.content, p.image, p.created_at, p.updated_at, p.type, u.photo,
        (SELECT COUNT(*) FROM post_likes WHERE post_id = p.id) as likes,
        (SELECT COUNT(*) FROM post_comments WHERE post_id = p.id) as comments,
        (SELECT 1 FROM post_likes WHERE post_id = p.id AND username = ?) as liked
      FROM posts p JOIN users u ON p.username = u.username`;
    const order = 'ORDER BY COALESCE(p.updated_at, p.created_at) DESC';
    const where: string[] = [];
    const params: any[] = [current];
    if (user) {
      where.push('p.username = ?');
      params.push(user);
    }
    if (type) {
      where.push('p.type = ?');
      params.push(type);
    }
    let query = base;
    if (where.length) query += ' WHERE ' + where.join(' AND ');
    query += ` ${order}`;
    const lim = Math.min(100, Number(limit || 0)) || 0;
    if (lim) {
      query += ' LIMIT ?';
      params.push(lim);
    }
    const rows = db.prepare(query).all(...params);
    return res.status(200).json({ posts: rows });
  }

  if (req.method === 'POST') {
    if (!current) return res.status(401).end();
    const { content, image } = req.body || {};
    if (!content && !image) return res.status(400).json({ message: 'Missing content' });
    db.prepare('INSERT INTO posts (username, content, image) VALUES (?, ?, ?)').run(current, content || '', image || null);
    addNotification('post', `${current} created a post`);
    return res.status(200).json({ message: 'Created' });
  }

  if (req.method === 'PUT') {
    if (!current) return res.status(401).end();
    const { id, content, image } = req.body || {};
    if (!id) return res.status(400).end();
    const post = db.prepare('SELECT username, type FROM posts WHERE id = ?').get(id);
    if (!post) return res.status(404).end();
    if (post.type === 'summary') {
      const info = db.prepare('SELECT role FROM users WHERE username = ?').get(current);
      if (!info || info.role !== 'admin') return res.status(403).end();
    } else if (post.username !== current) {
      return res.status(403).end();
    }
    const updates: string[] = [];
    const params: any[] = [];
    if (content !== undefined) {
      updates.push('content = ?');
      params.push(content);
    }
    if (image !== undefined) {
      updates.push('image = ?');
      params.push(image);
    }
    if (!updates.length) return res.status(400).json({ message: 'No data' });
    updates.push('updated_at = CURRENT_TIMESTAMP');
    params.push(id);
    db.prepare(`UPDATE posts SET ${updates.join(', ')} WHERE id = ?`).run(...params);
    addNotification('update', `${current} updated a post`);
    return res.status(200).json({ message: 'Updated' });
  }

  if (req.method === 'DELETE') {
    const { id } = req.query as { id?: string };
    if (!id) return res.status(400).end();
    const post = db.prepare('SELECT username, type FROM posts WHERE id = ?').get(id);
    if (!post) return res.status(404).end();
    if (post.type === 'summary') {
      const info = db.prepare('SELECT role FROM users WHERE username = ?').get(current);
      if (!info || info.role !== 'admin') return res.status(403).end();
    } else if (post.username !== current) {
      return res.status(403).end();
    }
    db.prepare('DELETE FROM post_likes WHERE post_id = ?').run(id);
    db.prepare('DELETE FROM post_comments WHERE post_id = ?').run(id);
    db.prepare('DELETE FROM posts WHERE id = ?').run(id);
    addNotification('delete', `${current} deleted a post`);
    return res.status(200).json({ message: 'Deleted' });
  }

  res.status(405).end();
}
