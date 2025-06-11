import { useEffect, useState, ChangeEvent } from 'react';
import Layout from '../components/Layout';
import Icon from '../components/Icon';
import useUser from '../lib/useUser';

export default function Feed() {
  const me = useUser();
  const [posts, setPosts] = useState<any[]>([]);
  const [creatingPost, setCreatingPost] = useState(false);
  const [postText, setPostText] = useState('');
  const [postImage, setPostImage] = useState('');
  const [comments, setComments] = useState<Record<number, any[]>>({});
  const [commentText, setCommentText] = useState<Record<number, string>>({});

  const handleImage = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setPostImage(reader.result as string);
    reader.readAsDataURL(file);
  };

  const loadPosts = async () => {
    const res = await fetch('/api/posts');
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

  useEffect(() => { loadPosts(); }, []);

  return (
    <Layout title="Feed" fullWidth>
      <div className="max-w-2xl mx-auto space-y-4">
        {me && (
          creatingPost ? (
            <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl border border-gray-200 dark:border-gray-700 space-y-3">
              <textarea
                className="textarea textarea-bordered w-full"
                rows={3}
                placeholder="What's on your mind?"
                value={postText}
                onChange={e => setPostText(e.target.value)}
              />
              <input
                type="file"
                accept="image/*"
                onChange={handleImage}
                className="file-input file-input-bordered w-full bg-white dark:bg-gray-700"
              />
              {postImage && (
                <img src={postImage} alt="preview" className="max-h-60 rounded-lg" />
              )}
              <div className="flex gap-2">
                <button className="btn btn-primary" onClick={createPost}>Post</button>
                <button className="btn btn-ghost" onClick={() => { setCreatingPost(false); setPostText(''); setPostImage(''); }}>Cancel</button>
              </div>
            </div>
          ) : (
            <button className="btn btn-primary" onClick={() => setCreatingPost(true)}>Create Post</button>
          )
        )}
        {posts.map(p => (
          <div key={p.id} className="bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-2 mb-2">
              {p.photo ? (
                <img src={p.photo} alt={p.username} className="w-8 h-8 rounded-full object-cover" />
              ) : (
                <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center text-sm font-bold text-gray-600">
                  {p.username[0]?.toUpperCase()}
                </div>
              )}
              <div className="text-sm font-semibold text-gray-800 dark:text-gray-100">{p.username}</div>
              <div className="text-xs text-gray-500 ml-auto">{new Date(p.created_at).toLocaleString()}</div>
            </div>
            <div className="whitespace-pre-wrap text-gray-700 dark:text-gray-200">{p.content}</div>
            {p.image && (
              <img src={p.image} alt="post" className="mt-3 rounded-lg max-h-96 w-full object-contain" />
            )}
            <div className="flex items-center gap-4 mt-3 text-sm text-gray-600 dark:text-gray-400">
              <button onClick={() => toggleLike(p.id, p.liked)} className="flex items-center gap-1">
                <Icon name={p.liked ? 'hand-thumbs-up-fill' : 'hand-thumbs-up'} className="w-4 h-4" />
                <span>{p.likes}</span>
              </button>
              <button onClick={() => comments[p.id] ? setComments(prev => ({ ...prev, [p.id]: undefined })) : loadComments(p.id)} className="flex items-center gap-1">
                <Icon name="chat-left" className="w-4 h-4" />
                <span>{p.comments}</span>
              </button>
            </div>
            {comments[p.id] && (
              <div className="mt-3 space-y-2">
                {comments[p.id].map(c => (
                  <div key={c.id} className="flex items-start gap-2 text-sm">
                    {c.photo ? (
                      <img src={c.photo} alt={c.username} className="w-6 h-6 rounded-full object-cover" />
                    ) : (
                      <div className="w-6 h-6 rounded-full bg-gray-300 flex items-center justify-center text-xs font-bold text-gray-600">
                        {c.username[0]?.toUpperCase()}
                      </div>
                    )}
                    <div>
                      <div className="font-semibold text-gray-800 dark:text-gray-100">{c.username}</div>
                      <div className="text-gray-700 dark:text-gray-200 whitespace-pre-wrap">{c.text}</div>
                      <div className="text-xs text-gray-500">{new Date(c.created_at).toLocaleString()}</div>
                    </div>
                  </div>
                ))}
                <div className="flex items-center gap-2">
                  <input
                    className="input input-bordered flex-1"
                    placeholder="Add a comment"
                    value={commentText[p.id] || ''}
                    onChange={e => setCommentText(prev => ({ ...prev, [p.id]: e.target.value }))}
                  />
                  <button className="btn btn-primary" onClick={() => addComment(p.id)}>Send</button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </Layout>
  );
}
