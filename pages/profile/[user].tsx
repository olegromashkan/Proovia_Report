import { useRouter } from 'next/router';
import useSWR from 'swr';
import Layout from '../../components/Layout';
import useUser from '../../lib/useUser';

const fetcher = (url: string) => fetch(url).then(r => r.json());

export default function Profile() {
  const router = useRouter();
  const { user } = router.query as { user: string };
  const { data } = useSWR(user ? `/api/users` : null, fetcher);
  const info = data?.users.find((u: any) => u.username === user);
  const current = useUser();
  const vars = ['--p','--a','--b1','--b2','--card-bg','--section-bg','--rounded-btn','--rounded-box','--rounded-badge','--shadow-strength'];
  const custom = typeof window !== 'undefined' && current === user
    ? vars.reduce((acc,v)=>{const val=localStorage.getItem('style'+v);if(val)acc[v]=val;return acc;},{} as Record<string,string>)
    : {};

  if (!info) return <Layout title="Profile">Loading...</Layout>;
  return (
    <Layout title={`${info.username} Profile`} fullWidth>
      <div className="max-w-3xl mx-auto space-y-6">
        {info.header && (
          <img src={info.header} alt="header" className="w-full h-48 object-cover rounded-system" />
        )}
        <div className="flex items-center gap-4">
          {info.photo && <img src={info.photo} alt="avatar" className="w-24 h-24 rounded-full" />}
          <h1 className="text-3xl font-bold">{info.username}</h1>
        </div>
        <div className="text-sm text-gray-500">Joined {new Date(info.created_at).toLocaleDateString()}</div>
        {Object.keys(custom).length > 0 && (
          <div className="space-y-1 text-sm">
            <h2 className="font-semibold mt-4">Your Customizations</h2>
            {Object.entries(custom).map(([k,v]) => (
              <div key={k}>{k}: {v}</div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
