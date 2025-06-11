import { useEffect, useState, ChangeEvent } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import Layout from '../components/Layout';
import Icon from '../components/Icon';
import useUser from '../lib/useUser';
import UserHoverCard from '../components/UserHoverCard';

export default function Feed() {
  const me = useUser();
  const [posts, setPosts] = useState<any[]>([]);
  const [postText, setPostText] = useState('');
  const [postImage, setPostImage] = useState('');
  const [comments, setComments] = useState<Record<number, any[]>>({});
  const [commentText, setCommentText] = useState<Record<number, string>>({});
  const [editing, setEditing] = useState<number | null>(null);
  const [editText, setEditText] = useState('');
  const [editImage, setEditImage] = useState('');

  const handleImage = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setPostImage(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleEditImage = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setEditImage(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const items = e.clipboardData.items;
    for (const item of items) {
      if (item.type.startsWith('image/')) {
        const file = item.getAsFile();
        if (file) {
          const reader = new FileReader();
          reader.onload = () => setPostImage(reader.result as string);
          reader.readAsDataURL(file);
        }
      }
    }
  };

  const loadPosts = async () => {
    const res = await fetch('/api/posts');
    if (res.ok) {
      const d = await res.json();
      setPosts(d.posts);
    }
  };

  const createPost = async () => {
    if (!postText.trim() && !postImage) return;
    await fetch('/api/posts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: postText, image: postImage }),
    });
    setPostText('');
    setPostImage('');
    loadPosts();
  };

  const toggleLike = async (id: number, liked: number) => {
    await fetch('/api/likes?post=' + id, { method: liked ? 'DELETE' : 'POST' });
    loadPosts();
  };

  const loadComments = async (id: number) => {
    const res = await fetch('/api/comments?post=' + id);
    if (res.ok) {
      const d = await res.json();
      setComments((prev) => ({ ...prev, [id]: d.comments }));
    }
  };

  const addComment = async (id: number) => {
    if (!commentText[id]?.trim()) return;
    await fetch('/api/comments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ post: id, text: commentText[id] || '' }),
    });
    setCommentText((prev) => ({ ...prev, [id]: '' }));
    loadComments(id);
    loadPosts();
  };

  const startEdit = (p: any) => {
    setEditing(p.id);
    setEditText(p.content);
    setEditImage(p.image || '');
  };

  const saveEdit = async () => {
    if (editing === null) return;
    await fetch('/api/posts', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: editing, content: editText, image: editImage }),
    });
    setEditing(null);
    setEditText('');
    setEditImage('');
    loadPosts();
  };

  const deletePost = async (id: number) => {
    await fetch('/api/posts?id=' + id, { method: 'DELETE' });
    loadPosts();
  };

  useEffect(() => {
    loadPosts();
  }, []);

  return (
    <Layout title="Feed" fullWidth>
      <div className="max-w-2xl mx-auto space-y-4 py-6">
        {me ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 120, damping: 20 }}
            className="bg-white bg-opacity-90 p-4 rounded-2xl shadow-md border border-gray-100"
          >
            <div className="flex items-start gap-3">
              {me.photo ? (
                <img
                  src={me.photo}
                  alt="User avatar"
                  className="w-10 h-10 rounded-full object-cover border border-[#b53133]"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-sm font-bold text-gray-600 border border-[#b53133]">
                  {me.username ? me.username[0]?.toUpperCase() : '?'}
                </div>
              )}
              <div className="flex-1 space-y-3">
                <textarea
                  className="w-full p-3 rounded-xl bg-gray-50 text-gray-800 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#b53133] resize-none"
                  rows={2}
                  placeholder="What's happening?"
                  value={postText}
                  onChange={(e) => setPostText(e.target.value)}
                  onPaste={handlePaste}
                />
                {postImage && (
                  <motion.div
                    className="relative"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3 }}
                  >
                    <img
                      src={postImage}
                      alt="preview"
                      className="max-h-64 w-full object-contain rounded-xl"
                    />
                    <button
                      className="absolute top-2 right-2 bg-gray-800 bg-opacity-50 text-white rounded-full p-1"
                      onClick={() => setPostImage('')}
                    >
                      <Icon name="x" className="w-4 h-4" />
                    </button>
                  </motion.div>
                )}
                <div className="flex items-center justify-between">
                  <label className="cursor-pointer">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImage}
                      className="hidden"
                    />
                    <Icon name="image" className="w-6 h-6 text-[#b53133] hover:text-[#a12b2e]" />
                  </label>
                  <motion.button
                    className="px-4 py-2 rounded-xl bg-[#b53133] text-white font-semibold hover:bg-[#a12b2e] transition disabled:opacity-50"
                    onClick={createPost}
                    disabled={!postText.trim() && !postImage}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    Post
                  </motion.button>
                </div>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 120, damping: 20 }}
            className="bg-white bg-opacity-90 p-4 rounded-2xl shadow-md border border-gray-100 text-center"
          >
            <p className="text-gray-800 text-base">
              <Link href="/auth/login" className="text-[#b53133] hover:text-[#a12b2e] font-semibold">
                Log in
              </Link>{' '}
              or{' '}
              <Link href="/auth/register" className="text-[#b53133] hover:text-[#a12b2e] font-semibold">
                sign up
              </Link>{' '}
              to share your thoughts!
            </p>
          </motion.div>
        )}
        {posts.map((p) => (
          <motion.div
            key={p.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 120, damping: 20 }}
            className="bg-white bg-opacity-90 p-4 rounded-2xl shadow-md border border-gray-100"
          >
            <div className="flex items-center justify-between mb-3">
              <UserHoverCard username={p.username}>
                <Link href={`/profile/${p.username}`} className="flex items-center gap-2">
                  {p.photo ? (
                    <img
                      src={p.photo}
                      alt={p.username}
                      className="w-8 h-8 rounded-full object-cover border border-[#b53133]"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-xs font-bold text-gray-600 border border-[#b53133]">
                      {p.username[0]?.toUpperCase()}
                    </div>
                  )}
                  <div className="text-sm font-semibold text-gray-800">{p.username}</div>
                </Link>
              </UserHoverCard>
              <div className="text-xs text-gray-500">
                {new Date(p.created_at).toLocaleString()}
                {p.updated_at && (
                  <span className="italic ml-2">(edited)</span>
                )}
              </div>
            </div>
            {editing === p.id ? (
              <div className="space-y-3">
                <textarea
                  className="w-full p-3 rounded-xl bg-gray-50 text-gray-800 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#b53133] resize-none"
                  rows={3}
                  value={editText}
                  onChange={(e) => setEditText(e.target.value)}
                />
                {editImage && (
                  <div className="relative">
                    <img src={editImage} className="max-h-64 w-full object-contain rounded-xl" />
                    <button className="absolute top-2 right-2 bg-gray-800 bg-opacity-50 text-white rounded-full p-1" onClick={() => setEditImage('')}>
                      <Icon name="x" className="w-4 h-4" />
                    </button>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <label className="cursor-pointer">
                    <input type="file" accept="image/*" onChange={handleEditImage} className="hidden" />
                    <Icon name="image" className="w-6 h-6 text-[#b53133] hover:text-[#a12b2e]" />
                  </label>
                  <div className="space-x-2">
                    <motion.button
                      className="px-3 py-1 rounded-xl bg-[#b53133] text-white font-semibold"
                      onClick={saveEdit}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      Save
                    </motion.button>
                    <motion.button
                      className="px-3 py-1 rounded-xl bg-gray-200 text-gray-800"
                      onClick={() => setEditing(null)}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      Cancel
                    </motion.button>
                  </div>
                </div>
              </div>
            ) : (
              <>
                <div className="text-gray-800 text-base whitespace-pre-wrap">{p.content}</div>
                {p.image && (
                  <motion.img
                    src={p.image}
                    alt="post"
                    className="mt-3 rounded-xl max-h-96 w-full object-contain"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3 }}
                  />
                )}
              </>
            )}
            <div className="flex items-center gap-4 mt-3 text-sm text-gray-600">
              <motion.button
                onClick={() => toggleLike(p.id, p.liked)}
                className="flex items-center gap-1"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <Icon
                  name={p.liked ? 'hand-thumbs-up-fill' : 'hand-thumbs-up'}
                  className={`w-4 h-4 ${p.liked ? 'text-[#b53133]' : 'text-gray-500'}`}
                />
                <span>{p.likes}</span>
              </motion.button>
              <motion.button
                onClick={() =>
                  comments[p.id]
                    ? setComments((prev) => ({ ...prev, [p.id]: undefined }))
                    : loadComments(p.id)
                }
                className="flex items-center gap-1"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <Icon name="chat-left" className="w-4 h-4 text-gray-500" />
                <span>{p.comments}</span>
              </motion.button>
              {me === p.username && (
                <>
                  <motion.button
                    onClick={() => startEdit(p)}
                    className="flex items-center gap-1"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <Icon name="pen" className="w-4 h-4 text-gray-500" />
                  </motion.button>
                  <motion.button
                    onClick={() => deletePost(p.id)}
                    className="flex items-center gap-1"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <Icon name="trash" className="w-4 h-4 text-gray-500" />
                  </motion.button>
                </>
              )}
            </div>
            {comments[p.id] && (
              <div className="mt-3 space-y-2">
                {comments[p.id].map((c) => (
                  <motion.div
                    key={c.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.2 }}
                    className="flex items-start gap-2 text-sm"
                  >
                    <UserHoverCard username={c.username}>
                      <Link href={`/profile/${c.username}`} className="flex items-start gap-1">
                        {c.photo ? (
                          <img
                            src={c.photo}
                            alt={c.username}
                            className="w-6 h-6 rounded-full object-cover border border-[#b53133]"
                          />
                        ) : (
                          <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-xs font-bold text-gray-600 border border-[#b53133]">
                            {c.username[0]?.toUpperCase()}
                        </div>
                        )}
                        <div className="font-semibold text-gray-800">{c.username}</div>
                      </Link>
                    </UserHoverCard>
                    <div className="flex-1">
                      <div className="text-gray-800 p-2 rounded-xl bg-gray-50">{c.text}</div>
                      <div className="text-xs text-gray-500 mt-1">
                        {new Date(c.created_at).toLocaleString()}
                      </div>
                    </div>
                  </motion.div>
                ))}
                <div className="flex items-center gap-2 mt-2">
                  <input
                    className="flex-1 p-2 rounded-xl bg-gray-50 text-gray-800 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#b53133]"
                    placeholder="Comment..."
                    value={commentText[p.id] || ''}
                    onChange={(e) =>
                      setCommentText((prev) => ({ ...prev, [p.id]: e.target.value }))
                    }
                  />
                  <motion.button
                    className="px-3 py-1 rounded-xl bg-[#b53133] text-white font-semibold hover:bg-[#a12b2e] transition"
                    onClick={() => addComment(p.id)}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    Send
                  </motion.button>
                </div>
              </div>
            )}
          </motion.div>
        ))}
      </div>
    </Layout>
  );
}