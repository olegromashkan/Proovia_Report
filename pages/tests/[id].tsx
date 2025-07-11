import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import Layout from '../../components/Layout';

interface Answer {
  question: string;
  answer: string;
  score?: number;
  comment?: string;
}

interface TestData {
  id: number;
  name: string;
  email: string;
  created_at: string;
  test_id?: number;
  answers: Answer[];
  scores: Answer[];
}

export default function TestDetail() {
  const router = useRouter();
  const { id } = router.query as { id?: string };
  const [data, setData] = useState<TestData | null>(null);
  const [scores, setScores] = useState<Answer[]>([]);
  const [template, setTemplate] = useState<{ questions: { text: string; points: number }[] } | null>(null);

  useEffect(() => {
    if (!id) return;
    fetch(`/api/tests/${id}`)
      .then(res => (res.ok ? res.json() : Promise.reject()))
      .then(d => {
        setData(d.test);
        setScores(d.test.scores.length ? d.test.scores : d.test.answers.map((a: Answer) => ({ question: a.question, answer: a.answer, score: 0, comment: '' })));
        if (d.test.test_id) {
          fetch(`/api/test-templates/${d.test.test_id}`)
            .then(res => (res.ok ? res.json() : Promise.reject()))
            .then(t => setTemplate(t.template))
            .catch(() => setTemplate(null));
        }
      })
      .catch(() => setData(null));
  }, [id]);

  const handleChange = (idx: number, field: 'score' | 'comment', val: any) => {
    setScores(s => s.map((a, i) => (i === idx ? { ...a, [field]: val } : a)));
  };

  const save = async () => {
    if (!id) return;
    await fetch(`/api/tests/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ scores })
    });
    router.push('/tests');
  };

  if (!data) return <Layout title="Test">Loading...</Layout>;

  return (
    <Layout title={`Test ${id}`}>
      <h1 className="text-xl font-bold mb-4">{data.name} - {data.email}</h1>
      <div className="space-y-4">
        {data.answers.map((a, i) => (
          <div key={i} className="border p-2 rounded">
            <p className="font-medium">{a.question} <span className="text-sm text-gray-500">(points: {template?.questions[i]?.points ?? '-'})</span></p>
            <p className="mb-2 whitespace-pre-wrap">{a.answer}</p>
            <div className="flex gap-2 items-center">
              <input
                type="number"
                className="input input-bordered w-24"
                value={scores[i]?.score ?? 0}
                onChange={e => handleChange(i, 'score', Number(e.target.value))}
              />
              <input
                type="text"
                className="input input-bordered flex-1"
                placeholder="Comment"
                value={scores[i]?.comment ?? ''}
                onChange={e => handleChange(i, 'comment', e.target.value)}
              />
            </div>
          </div>
        ))}
      </div>
      <button className="btn btn-primary mt-4" onClick={save}>Save</button>
    </Layout>
  );
}
