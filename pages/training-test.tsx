import { useState, useEffect } from 'react';
import Layout from '../components/Layout';

interface Template { id: number; name: string }
interface Question { text: string; points: number }

export default function TrainingTest() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [selected, setSelected] = useState<number | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [answers, setAnswers] = useState<string[]>([]);
  const [sent, setSent] = useState(false);

  useEffect(() => {
    fetch('/api/test-templates')
      .then(res => (res.ok ? res.json() : Promise.reject()))
      .then(d => setTemplates(d.templates || []));
  }, []);

  useEffect(() => {
    if (!selected) return;
    fetch(`/api/test-templates/${selected}`)
      .then(res => (res.ok ? res.json() : Promise.reject()))
      .then(d => {
        const qs: Question[] = d.template.questions || [];
        setQuestions(qs);
        setAnswers(qs.map(() => ''));
      });
  }, [selected]);

  const handleChange = (idx: number, val: string) => {
    setAnswers(a => a.map((v, i) => (i === idx ? val : v)));
  };

  const handleSubmit = async () => {
    await fetch('/api/tests', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name,
        email,
        test_id: selected,
        answers: questions.map((q, i) => ({ question: q.text, answer: answers[i] }))
      })
    });
    setSent(true);
  };

  return (
    <Layout title="Training Test">
      {sent ? (
        <p>Your answers have been submitted.</p>
      ) : (
        <div className="space-y-4">
          {!selected ? (
            <div>
              <label className="block font-medium mb-1">Choose Test</label>
              <select className="select select-bordered w-full" onChange={e => setSelected(Number(e.target.value))} defaultValue="">
                <option value="" disabled>Select template</option>
                {templates.map(t => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>
          ) : (
            <>
              <div>
                <label className="block font-medium mb-1">Name</label>
                <input className="input input-bordered w-full" value={name} onChange={e => setName(e.target.value)} />
              </div>
              <div>
                <label className="block font-medium mb-1">Email</label>
                <input className="input input-bordered w-full" value={email} onChange={e => setEmail(e.target.value)} />
              </div>
              {questions.map((q, i) => (
                <div key={i}>
                  <label className="block font-medium mb-1">{q.text}</label>
                  <textarea
                    className="textarea textarea-bordered w-full"
                    rows={2}
                    value={answers[i]}
                    onChange={e => handleChange(i, e.target.value)}
                  />
                </div>
              ))}
              <button className="btn btn-primary" onClick={handleSubmit}>Submit</button>
            </>
          )}
        </div>
      )}
    </Layout>
  );
}
