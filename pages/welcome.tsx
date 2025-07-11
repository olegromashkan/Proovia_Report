import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import EmailTemplate from '../components/EmailTemplate';

export default function WelcomeEmailPage() {
  const router = useRouter();
  const [name, setName] = useState('Candidate');
  const [score, setScore] = useState(95);
  const [pdfUrl, setPdfUrl] = useState('#');
  const [date, setDate] = useState('Monday, July 14, 2025');
  const [time, setTime] = useState('7:30 AM');

  useEffect(() => {
    if (!router.isReady) return;
    if (typeof router.query.name === 'string') setName(router.query.name);
    if (typeof router.query.score === 'string') setScore(Number(router.query.score));
    if (typeof router.query.pdf === 'string') setPdfUrl(router.query.pdf);
    if (typeof router.query.date === 'string') setDate(router.query.date);
    if (typeof router.query.time === 'string') setTime(router.query.time);
  }, [router.isReady, router.query]);

  return (
    <Layout title="Welcome Email" fullWidth>
      <div className="grid md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
            <input
              type="text"
              className="input input-bordered w-full"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Score</label>
            <input
              type="number"
              className="input input-bordered w-full"
              value={score}
              onChange={(e) => setScore(Number(e.target.value))}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">PDF URL</label>
            <input
              type="text"
              className="input input-bordered w-full"
              value={pdfUrl}
              onChange={(e) => setPdfUrl(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
            <input
              type="text"
              className="input input-bordered w-full"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Time</label>
            <input
              type="text"
              className="input input-bordered w-full"
              value={time}
              onChange={(e) => setTime(e.target.value)}
            />
          </div>
        </div>
        <div className="overflow-auto">
          <EmailTemplate name={name} score={score} pdfUrl={pdfUrl} date={date} time={time} />
        </div>
      </div>
    </Layout>
  );
}
