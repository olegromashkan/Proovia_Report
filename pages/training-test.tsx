import { useState, useEffect } from 'react';
import Layout from '../components/Layout';

interface Template { id: number; name: string }
interface Question {
  text: string;
  points: number;
  type?: 'text' | 'textarea' | 'radio' | 'checkbox';
  options?: string[];
}

type AnswerValue = string | string[];

export default function TrainingTest() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [selected, setSelected] = useState<number | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [answers, setAnswers] = useState<AnswerValue[]>([]);
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
        const qs: Question[] = (d.template.questions || []).map((q: any) => ({
          text: q.text,
          points: q.points,
          type: q.type || 'text',
          options: q.options || []
        }));
        setQuestions(qs);
        setAnswers(qs.map(q => (q.type === 'checkbox' ? [] : '')));
      });
  }, [selected]);

  const handleTextChange = (idx: number, val: string) => {
    setAnswers(a => a.map((v, i) => (i === idx ? val : v)));
  };

  const handleRadioChange = (idx: number, val: string) => {
    setAnswers(a => a.map((v, i) => (i === idx ? val : v)));
  };

  const handleCheckboxChange = (idx: number, option: string, checked: boolean) => {
    setAnswers(a =>
      a.map((v, i) => {
        if (i !== idx) return v;
        const arr = Array.isArray(v) ? v.slice() : [];
        if (checked) {
          if (!arr.includes(option)) arr.push(option);
        } else {
          const index = arr.indexOf(option);
          if (index > -1) arr.splice(index, 1);
        }
        return arr;
      })
    );
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
                <div key={i} className="space-y-1">
                  <label className="block font-medium">{q.text}</label>
                  {(!q.type || q.type === 'text') && (
                    <input
                      className="input input-bordered w-full"
                      value={answers[i] as string}
                      onChange={e => handleTextChange(i, e.target.value)}
                    />
                  )}
                  {q.type === 'textarea' && (
                    <textarea
                      className="textarea textarea-bordered w-full"
                      rows={2}
                      value={answers[i] as string}
                      onChange={e => handleTextChange(i, e.target.value)}
                    />
                  )}
                  {q.type === 'radio' && (
                    <div className="space-y-1">
                      {q.options?.map(opt => (
                        <label key={opt} className="flex items-center gap-2">
                          <input
                            type="radio"
                            className="radio"
                            checked={answers[i] === opt}
                            onChange={() => handleRadioChange(i, opt)}
                          />
                          {opt}
                        </label>
                      ))}
                    </div>
                  )}
                  {q.type === 'checkbox' && (
                    <div className="space-y-1">
                      {q.options?.map(opt => (
                        <label key={opt} className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            className="checkbox"
                            checked={Array.isArray(answers[i]) && (answers[i] as string[]).includes(opt)}
                            onChange={e => handleCheckboxChange(i, opt, e.target.checked)}
                          />
                          {opt}
                        </label>
                      ))}
                    </div>
                  )}
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
