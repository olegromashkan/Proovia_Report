import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import Layout from '../../../components/Layout';

interface Question {
  text: string;
  points: number;
}

export default function EditTemplate() {
  const router = useRouter();
  const { id } = router.query as { id?: string };
  const isNew = id === 'new' || !id;
  const [name, setName] = useState('');
  const [questions, setQuestions] = useState<Question[]>([]);

  useEffect(() => {
    if (!id || isNew) return;
    fetch(`/api/test-templates/${id}`)
      .then(res => (res.ok ? res.json() : Promise.reject()))
      .then(d => {
        setName(d.template.name);
        setQuestions(d.template.questions || []);
      })
      .catch(() => {});
  }, [id, isNew]);

  const addQuestion = () => {
    setQuestions(q => [...q, { text: '', points: 1 }]);
  };

  const updateQuestion = (idx: number, field: keyof Question, val: any) => {
    setQuestions(q => q.map((item, i) => (i === idx ? { ...item, [field]: val } : item)));
  };

  const save = async () => {
    const method = isNew ? 'POST' : 'PUT';
    const url = isNew ? '/api/test-templates' : `/api/test-templates/${id}`;
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, questions })
    });
    if (res.ok) router.push('/tests/dashboard');
  };

  return (
    <Layout title={isNew ? 'New Template' : 'Edit Template'}>
      <div className="space-y-4 max-w-xl">
        <div>
          <label className="block font-medium mb-1">Name</label>
          <input className="input input-bordered w-full" value={name} onChange={e => setName(e.target.value)} />
        </div>
        {questions.map((q, i) => (
          <div key={i} className="flex gap-2 items-center">
            <input
              className="input input-bordered flex-1"
              placeholder="Question"
              value={q.text}
              onChange={e => updateQuestion(i, 'text', e.target.value)}
            />
            <input
              type="number"
              className="input input-bordered w-24"
              value={q.points}
              onChange={e => updateQuestion(i, 'points', Number(e.target.value))}
            />
          </div>
        ))}
        <button className="btn" onClick={addQuestion}>Add Question</button>
        <button className="btn btn-primary" onClick={save} disabled={!name.trim() || !questions.length}>
          Save
        </button>
      </div>
    </Layout>
  );
}
