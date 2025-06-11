import { useRouter } from 'next/router';
import { useState, ChangeEvent } from 'react';
import { useChat } from '../../contexts/ChatContext';
import useFetch from '../../lib/useFetch';
import Layout from '../../components/Layout';
import useUser from '../../lib/useUser';

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
  const { openChat } = useChat();

  const handleImage = (e: ChangeEvent<HTMLInputElement>, set: (v:string)=>void) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => set(reader.result as string);
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

  const vars = ['--p','--a','--b1','--b2','--card-bg','--section-bg','--rounded-btn','--rounded-box','--rounded-badge','--shadow-strength'];
  const custom = typeof window !== 'undefined' && current === user
    ? vars.reduce((acc,v)=>{const val=localStorage.getItem('style'+v);if(val)acc[v]=val;return acc;},{} as Record<string,string>)
    : {};

  if (!info) return <Layout title="Profile">Loading...</Layout>;

  return (
    <Layout title={`${info.username} Profile`} fullWidth>
      <div className="max-w-4xl mx-auto">
        {/* Header Section with Profile Overlay */}
        <div className="relative">
          {/* Header Image */}
          <div className="relative h-64 bg-gradient-to-br from-blue-400 via-purple-500 to-pink-500 rounded-2xl overflow-hidden shadow-xl">
            {info.header && (
              <img 
                src={info.header} 
                alt="header" 
                className="w-full h-full object-cover"
              />
            )}
            {/* Gradient Overlay for better text readability */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent"></div>
          </div>

          {/* Profile Photo - Overlapping header */}
          <div className="absolute -bottom-16 left-8">
            <div className="relative">
              {info.photo ? (
                <img 
                  src={info.photo} 
                  alt="avatar" 
                  className="w-32 h-32 rounded-full border-4 border-white shadow-2xl object-cover bg-white"
                />
              ) : (
                <div className="w-32 h-32 rounded-full border-4 border-white shadow-2xl bg-gradient-to-br from-gray-300 to-gray-400 flex items-center justify-center">
                  <span className="text-4xl font-bold text-white">
                    {info.username?.[0]?.toUpperCase()}
                  </span>
                </div>
              )}
              {/* Online indicator (optional) */}
              <div className="absolute bottom-2 right-2 w-6 h-6 bg-green-500 border-2 border-white rounded-full"></div>
            </div>
          </div>

          {/* Edit Button */}
          {canEdit && (
            <div className="absolute top-4 right-4">
              <button 
                className="btn btn-sm bg-white/90 backdrop-blur-sm border-white/20 text-gray-800 hover:bg-white hover:shadow-lg transition-all duration-200" 
                onClick={() => setEditing(!editing)}
              >
                {editing ? (
                  <span className="flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    Cancel
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    Edit
                  </span>
                )}
              </button>
            </div>
          )}
        </div>

        {/* Profile Info Section */}
        <div className="mt-20 px-8 pb-8">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-6">
            <div className="space-y-2">
              <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
                {info.username}
              </h1>
              <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                Joined {new Date(info.created_at).toLocaleDateString('en-US', { 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </div>
            </div>
            <div>
              <button
                className="btn btn-primary"
                onClick={() => openChat(info.username)}
              >
                Chat
              </button>
            </div>
          </div>

          {/* Edit Form */}
          {editing && (
            <div className="bg-gray-50 dark:bg-gray-800 rounded-2xl p-6 space-y-4 mb-6 border border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Edit Profile
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Profile Photo
                  </label>
                  <input 
                    type="file" 
                    accept="image/*" 
                    onChange={e => handleImage(e, setPhoto)} 
                    className="file-input file-input-bordered w-full bg-white dark:bg-gray-700" 
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
                    className="file-input file-input-bordered w-full bg-white dark:bg-gray-700" 
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
                  className="input input-bordered w-full bg-white dark:bg-gray-700" 
                />
              </div>
              
              <div className="flex gap-3 pt-2">
                <button 
                  className="btn btn-primary flex-1 sm:flex-none sm:px-8"
                  onClick={save}
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Save Changes
                </button>
                <button 
                  className="btn btn-ghost"
                  onClick={() => setEditing(false)}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Customizations Section */}
          {Object.keys(custom).length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zM21 5H9a2 2 0 00-2 2v12a4 4 0 004 4h10a2 2 0 002-2V7a2 2 0 00-2-2z" />
                </svg>
                Your Customizations
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {Object.entries(custom).map(([k, v]) => (
                  <div 
                    key={k} 
                    className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 border border-gray-200 dark:border-gray-600"
                  >
                    <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      {k}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400 font-mono break-all">
                      {v}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}