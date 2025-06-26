import type { NextApiRequest, NextApiResponse } from 'next';
import db, { addNotification } from '../../lib/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const username = req.cookies.user;
  if (!username) return res.status(401).end();

  if (req.method === 'GET') {
    const rows = await db
      .prepare('SELECT * FROM tasks WHERE assignee = ? OR creator = ? ORDER BY created_at DESC')
      .all(username, username);
    return res.status(200).json({ tasks: rows });
  }

  if (req.method === 'POST') {
    const { assignee, text, dueAt } = req.body || {};
    if (!assignee || !text) return res.status(400).json({ message: 'Missing fields' });
    await db
      .prepare('INSERT INTO tasks (creator, assignee, text, due_at) VALUES (?, ?, ?, ?)')
      .run(
        username,
        assignee,
        text,
        dueAt || null,
      );
    if (assignee !== username) {
      addNotification('task', `${username} assigned you a task: ${text}`);
    }
    return res.status(200).json({ message: 'Created' });
  }

  if (req.method === 'PUT') {
    const { id, completed } = req.body || {};
    if (!id) return res.status(400).end();
    const task = await db.prepare('SELECT * FROM tasks WHERE id = ?').get(id);
    if (!task) return res.status(404).end();
    await db
      .prepare('UPDATE tasks SET completed = ? WHERE id = ?')
      .run(completed ? 1 : 0, id);
    if (!task.completed && completed && task.creator !== task.assignee) {
      addNotification('task', `${task.assignee} completed task: ${task.text}`);
    }
    return res.status(200).json({ message: 'Updated' });
  }

  res.status(405).end();
}
