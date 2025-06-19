import { useRouter } from 'next/router';
import { useState, ChangeEvent, useEffect } from 'react';
import Link from 'next/link';
import ChatPanel from '../../components/ChatPanel';
import useFetch from '../../lib/useFetch';
import Layout from '../../components/Layout';
import Icon from '../../components/Icon';
import useUser from '../../lib/useUser';
import UserHoverCard from '../../components/UserHoverCard';

export default function Profile() {
  const router = useRouter();
  const { user } = router.query as { user: string };
  const { data } = useFetch<{ users: any[] }>(user ? '/api/users' : null);
  const info = data?.users.find((u: any) => u.username === user);
  const current = useUser();
  const { data: me } = useFetch<{ user: any }>(current ? '/api/user' : null);
  const canEdit = current === user || me?.user?.role === 'admin';

  const [editing, setEditing] = useState(false);
  const [photo, setPhoto] = useState('');
  const [header, setHeader] = useState('');
  const [password, setPassword] = useState('');
  const [chatOpen, setChatOpen] = useState(false);

  const [posts, setPosts] = useState<any[]>([]);
  const [creatingPost, setCreatingPost] = useState(false);
  const [postText, setPostText] = useState('');
  const [postImage, setPostImage] = useState('');
  const [comments, setComments] = useState<Record<number, any[]>>({});
  const [commentText, setCommentText] = useState<Record<number, string>>({});
  const [editingPost, setEditingPost] = useState<number | null>(null);
  const [editText, setEditText] = useState('');
  const [editImage, setEditImage] = useState('');

  const handleImage = (e: ChangeEvent<HTMLInputElement>, set: (v: string) => void) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => set(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleEditImage = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setEditImage(reader.result as string);
    reader.readAsDataURL(file);
  };

  const save = async () => {
    await fetch('/api/profile', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ photo, header, password })
    });
    setEditing(false);
    location.reload();
  };

  const loadPosts = async () => {
    if (!user) return;
    const res = await fetch('/api/posts?user=' + user);
    if (res.ok) {
      const d = await res.json();
      setPosts(d.posts);
    }
  };

  const createPost = async () => {
    await fetch('/api/posts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: postText, image: postImage })
    });
    setPostText('');
    setPostImage('');
    setCreatingPost(false);
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
      setComments(prev => ({ ...prev, [id]: d.comments }));
    }
  };

  const addComment = async (id: number) => {
    await fetch('/api/comments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ post: id, text: commentText[id] || '' })
    });
    setCommentText(prev => ({ ...prev, [id]: '' }));
    loadComments(id);
    loadPosts();
  };

  const startEditPost = (p: any) => {
    setEditingPost(p.id);
    setEditText(p.content);
    setEditImage(p.image || '');
  };

  const saveEditPost = async () => {
    if (editingPost === null) return;
    await fetch('/api/posts', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: editingPost, content: editText, image: editImage }),
    });
    setEditingPost(null);
    setEditText('');
    setEditImage('');
    loadPosts();
  };

  const deletePost = async (id: number) => {
    await fetch('/api/posts?id=' + id, { method: 'DELETE' });
    loadPosts();
  };

  useEffect(() => { loadPosts(); }, [user]);

  const vars = ['--p', '--a', '--b1', '--b2', '--card-bg', '--section-bg', '--rounded-btn', '--rounded-box', '--rounded-badge', '--shadow-strength'];
  const custom = typeof window !== 'undefined' && current === user
    ? vars.reduce((acc, v) => { const val = localStorage.getItem('style' + v); if (val) acc[v] = val; return acc; }, {} as Record<string, string>)
    : {};

  if (!info) return <Layout title="Profile">Loading...</Layout>;

  return (
    <Layout title={`${info.username} Profile`} fullWidth>
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header Section with Profile Overlay */}
        <div className="relative">
          {/* Header Image */}
          <div className="relative h-64 overflow-hidden rounded-2xl bg-red-600 shadow-xl">
            {info.header && (
              <img
                src={info.header}
                alt="header"
                className="h-full w-full object-cover"
              />
            )}
            {/* Gradient Overlay for better text readability */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
          </div>

          {/* Profile Photo - Overlapping header */}
          <div className="absolute -bottom-16 left-4 sm:left-8">
            <div className="relative">
              {info.photo ? (
                <img
                  src={info.photo}
                  alt="avatar"
                  className="h-32 w-32 rounded-full border-4 border-white bg-white object-cover shadow-2xl"
                />
              ) : (
                <div className="flex h-32 w-32 items-center justify-center rounded-full border-4 border-white bg-gradient-to-br from-gray-300 to-gray-400 shadow-2xl">
                  <span className="text-4xl font-bold text-white">
                    {info.username?.[0]?.toUpperCase()}
                  </span>
                </div>
              )}
              {/* Online indicator */}
              <div className={`absolute bottom-2 right-2 h-6 w-6 rounded-full border-2 border-white ${info.status === 'online' ? 'bg-green-500' : info.status === 'away' ? 'bg-orange-500' : info.status === 'dnd' ? 'bg-red-500' : 'bg-gray-400'}`}></div>
            </div>
          </div>

          {/* Edit Button */}
          {canEdit && (
            <div className="absolute right-4 top-4">
              <button
                className="flex items-center gap-2 rounded-lg bg-white/90 px-3 py-2 text-sm text-gray-800 shadow-sm backdrop-blur-sm transition-all hover:bg-white hover:shadow-lg"
                onClick={() => setEditing(!editing)}
              >
                {editing ? (
                  <>
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    Cancel
                  </>
                ) : (
                  <>
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    Edit
                  </>
                )}
              </button>
            </div>
          )}
        </div>

        {/* Profile Info Section */}
        <div className="mt-20 px-4 pb-8 sm:px-8">
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="space-y-2">
              <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
                {info.username}
              </h1>
              <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                Joined {new Date(info.created_at).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                <span className={`h-2.5 w-2.5 rounded-full ${info.status === 'online' ? 'bg-green-500' : info.status === 'away' ? 'bg-orange-500' : info.status === 'dnd' ? 'bg-red-500' : 'bg-gray-400'}`}></span>
                <span>
                  {info.status === 'online'
                    ? info.status_message || 'Online'
                    : info.status === 'away'
                      ? 'Away'
                      : info.status === 'dnd'
                        ? 'Do not disturb'
                        : 'last seen ' + new Date(info.last_seen).toLocaleString()}
                </span>
              </div>
              {info.status_message && info.status !== 'online' && (
                <div className="text-sm text-gray-500 dark:text-gray-400">{info.status_message}</div>
              )}
            </div>
            <div>
              <button
                className="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
                onClick={() => setChatOpen(true)}
              >
                Chat
              </button>
            </div>
          </div>

          {/* Edit Form */}
          {editing && (
            <div className="mb-6 space-y-4 rounded-2xl border border-gray-200 bg-gray-50 p-6 dark:border-gray-700 dark:bg-gray-800">
              <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
                Edit Profile
              </h3>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Profile Photo
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={e => handleImage(e, setPhoto)}
                    className="w-full rounded-lg border border-gray-300 bg-white file:mr-4 file:rounded-lg file:border-0 file:bg-gray-100 file:px-4 file:py-2 file:text-gray-700 dark:bg-gray-700 dark:file:bg-gray-600 dark:file:text-gray-300"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Header Image
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={e => handleImage(e, setHeader)}
                    className="w-full rounded-lg border border-gray-300 bg-white file:mr-4 file:rounded-lg file:border-0 file:bg-gray-100 file:px-4 file:py-2 file:text-gray-700 dark:bg-gray-700 dark:file:bg-gray-600 dark:file:text-gray-300"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  New Password
                </label>
                <input
                  type="password"
                  placeholder="Enter new password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 dark:bg-gray-700"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 sm:flex-none sm:px-8"
                  onClick={save}
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Save Changes
                </button>
                <button
                  className="rounded-lg px-4 py-2 text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700"
                  onClick={() => setEditing(false)}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Customizations Section */}
          {Object.keys(custom).length > 0 && (
            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
              <h2 className="mb-4 flex items-center gap-2 text-xl font-semibold text-gray-900 dark:text-white">
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zM21 5H9a2 2 0 00-2 2v12a4 4 0 004 4h10a2 2 0 002-2V7a2 2 0 00-2-2z" />
                </svg>
                Your Customizations
              </h2>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {Object.entries(custom).map(([k, v]) => (
                  <div
                    key={k}
                    className="rounded-lg border border-gray-200 bg-gray-50 p-3 dark:border-gray-600 dark:bg-gray-700"
                  >
                    <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      {k}
                    </div>
                    <div className="break-all text-sm font-mono text-gray-600 dark:text-gray-400">
                      {v}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Feed Section */}
        <div className="mt-8 space-y-4">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Feed</h2>
          {canEdit && (
            creatingPost ? (
              <div className="space-y-3 rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
                <textarea
                  className="w-full rounded-lg border border-gray-300 px-3 py-2"
                  rows={3}
                  placeholder="What's on your mind?"
                  value={postText}
                  onChange={e => setPostText(e.target.value)}
                />
                <input
                  type="file"
                  accept="image/*"
                  onChange={e => handleImage(e, setPostImage)}
                  className="w-full rounded-lg border border-gray-300 bg-white file:mr-4 file:rounded-lg file:border-0 file:bg-gray-100 file:px-4 file:py-2 file:text-gray-700 dark:bg-gray-700 dark:file:bg-gray-600 dark:file:text-gray-300"
                />
                {postImage && (
                  <img src={postImage} alt="preview" className="max-h-60 rounded-lg" />
                )}
                <div className="flex gap-2">
                  <button className="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700" onClick={createPost}>Post</button>
                  <button className="rounded-lg px-4 py-2 text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700" onClick={() => { setCreatingPost(false); setPostText(''); setPostImage(''); }}>Cancel</button>
                </div>
              </div>
            ) : (
              <button className="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700" onClick={() => setCreatingPost(true)}>Create Post</button>
            )
          )}
          <div className="space-y-4">
            {posts.map(p => (
              <div key={p.id} className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
                <div className="mb-2 flex items-center gap-2">
                  <UserHoverCard username={p.username}>
                    <Link href={`/profile/${p.username}`} className="flex items-center gap-2">
                      {p.photo ? (
                        <img src={p.photo} alt={p.username} className="h-8 w-8 rounded-full object-cover" />
                      ) : (
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-300 text-sm font-bold text-gray-600">
                          {p.username[0]?.toUpperCase()}
                        </div>
                      )}
                      <div className="text-sm font-semibold text-gray-800 dark:text-gray-100">{p.username}</div>
                    </Link>
                  </UserHoverCard>
                  <div className="ml-auto text-xs text-gray-500">
                    {new Date(p.created_at).toLocaleString()}
                    {p.updated_at && (
                      <span className="ml-2 italic">(edited)</span>
                    )}
                  </div>
                </div>
                {editingPost === p.id ? (
                  <div className="space-y-3">
                    <textarea
                      className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-3 text-gray-800 focus:outline-none focus:ring-2 focus:ring-red-600 resize-none"
                      rows={3}
                      value={editText}
                      onChange={e => setEditText(e.target.value)}
                    />
                    {editImage && (
                      <div className="relative">
                        <img src={editImage} className="max-h-64 w-full rounded-xl object-contain" />
                        <button className="absolute right-2 top-2 rounded-full bg-gray-800/50 p-1 text-white" onClick={() => setEditImage('')}>
                          <Icon name="x" className="h-4 w-4" />
                        </button>
                      </div>
                    )}
                    <div className="flex items-center justify-between">
                      <label className="cursor-pointer">
                        <input type="file"
                        accept="image/*"
                        onChange={handleEditImage}
                        className="hidden"
                      />
                        <Icon name="image" className="h-6 w-6 text-gray-600 hover:text-red-700 dark:text-gray-400" />
                      </label>
                      <div>
                        <div className="space-x-2">
                          <button className="rounded rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700" onClick={saveEditPost}>Save</button>
                          <button className="rounded rounded-lg px-4 py-2 text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700" onClick={() => setEditingPost(null)}>Cancel</button>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="whitespace-pre-wrap whitespace-white text-gray-700 dark:text-gray-200">{p.content}</div>
                    {p.image && (
                      <img src={p.image} alt="post" className="mt-3 w-full max-h-96 rounded-lg object-contain" />
                    )}
                  </>
                )}
                <div className="mt-3 flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                  <button onClick={() => toggleLike(p.id, p.liked)} className="flex items-center gap-1">
                    <Icon name={p.liked ? 'hand-thumbs-up-fill' : 'hand-thumbs-up'} className="h-4 w-4" />
                    <span>{p.likes}</span>
                  </button>
                  <button onClick={() => comments[p.id] ? setComments(prev => ({ ...prev, [p.id]: undefined })) : loadComments(p.id)} className="flex items-center gap-1">
                    <Icon name="chat-left" className="h-4 w-4" />
                    <span>{p.comments}</span>
                  </button>
                  {current === p.username && (
                    <>
                      <button onClick={() => startEditPost(p)} className="flex items-center gap-1">
                        <Icon name="pen" className="h-4 w-4" />
                      </button>
                      <button onClick={() => deletePost(p.id)} className="flex items-center gap-1">
                        <Icon name="trash" className="h-4 w-4" />
                      </button>
                    </>
                  )}
                </div>
                {comments[p.id] && (
                  <div className="mt-3 space-y-2">
                    {comments[p.id].map(c => (
                      <div key={c.id} className="flex items-start gap-2 text-sm">
                        <UserHoverCard username={c.username}>
                          <Link href="/profile/${c.username}" className="flex items-center gap-2">
                            {c.photo ? (
                              <img src="/${c.photo}" alt={c.username} className="h-6 w-6 rounded-full object-cover" />
                            ) : (
                              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gray-300 text-xs font-bold text-gray-600">
                                {c.username[0]?.username[0]?.toUpperCase()}
                              </div>
                            )}
                          </Link>
                        </UserHoverCard>
                        <div>
                          <div className="whitespace-pre-wrap text-gray-700 dark:text-gray-200">
                            {c.text}
                          </div>
                          <div className="text-xs text-gray-500">
                            {new Date(c.created_at).toLocaleString()}
                          </div>
                        </div>
                      </div>
                    ))}
                    <div className="flex items-center gap-2">
                      <input
                        className="flex-1 rounded-lg border border-gray-300 px-3 py-2"
                        placeholder="Add a comment"
                        value={commentText[p.id] || ''}
                        onChange={e =>
                          setCommentText(prev => ({ ...prev, [p.id]: e.target.value }))
                        }
                      />
                      <button
                        className="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
                        onClick={() => addComment(p.id)}
                      >
                        Send
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
      <ChatPanel open={chatOpen} user={info.username} onClose={() => setChatOpen(false)} />
    </Layout>
  );
};
