import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import Layout from '../../../components/Layout';

interface Question {
  text: string;
  points: number;
  type: 'text' | 'textarea' | 'radio' | 'checkbox';
  options: string[];
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
        const qs: Question[] = (d.template.questions || []).map((q: any) => ({
          text: q.text || '',
          points: q.points ?? 1,
          type: q.type || 'text',
          options: q.options || []
        }));
        setQuestions(qs);
      })
      .catch(() => {});
  }, [id, isNew]);

  const addQuestion = () => {
    setQuestions(q => [
      ...q,
      { text: '', points: 1, type: 'text', options: [] }
    ]);
  };

  const updateQuestion = (idx: number, field: keyof Question, val: any) => {
    setQuestions(q =>
      q.map((item, i) => (i === idx ? { ...item, [field]: val } : item))
    );
  };

  const addOption = (idx: number) => {
    setQuestions(q =>
      q.map((item, i) =>
        i === idx ? { ...item, options: [...(item.options || []), ''] } : item
      )
    );
  };

  const updateOption = (qIdx: number, oIdx: number, val: string) => {
    setQuestions(q =>
      q.map((item, i) => {
        if (i !== qIdx) return item;
        const opts = item.options.slice();
        opts[oIdx] = val;
        return { ...item, options: opts };
      })
    );
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
          <div key={i} className="border p-2 rounded space-y-2">
            <div className="flex gap-2 items-center">
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
            <div className="flex gap-2 items-center">
              <select
                className="select select-bordered"
                value={q.type}
                onChange={e => updateQuestion(i, 'type', e.target.value as Question['type'])}
              >
                <option value="text">Short text</option>
                <option value="textarea">Paragraph</option>
                <option value="radio">Single choice</option>
                <option value="checkbox">Multiple choice</option>
              </select>
              {(q.type === 'radio' || q.type === 'checkbox') && (
                <button className="btn" onClick={() => addOption(i)}>Add Option</button>
              )}
            </div>
            {(q.type === 'radio' || q.type === 'checkbox') && (
              <div className="space-y-1">
                {q.options.map((opt, oi) => (
                  <input
                    key={oi}
                    className="input input-bordered w-full"
                    value={opt}
                    placeholder={`Option ${oi + 1}`}
                    onChange={e => updateOption(i, oi, e.target.value)}
                  />
                ))}
              </div>
            )}
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
