import { useState } from 'react';
import Layout from '../components/Layout';

const QUESTIONS = [
  'To whom we provide our services to',
  'From which sources our orders are being added',
  'What items our company does not transport',
  'Specify the departments we have',
  'What happens after the order is added to our records',
  'How do we provide quotes to the customers',
  'Name the colors that the order can be marked and what they mean in Zoho',
  'What payment method do our company accept',
  'What steps will you take if the customer requested card or BACS payment',
  'Name 2 day routes and areas that we do not cover',
  'Define the difference between collection “specific”, “not before” and “not after”',
  'Define the difference between order “Ready to schedule”, “scheduled”, “complete”, “failed”',
  'Can we promise a specific time of arrival and why',
  'What steps do you take if the customer is not available for the collection/delivery',
  'Define the POD (proof of delivery)',
  'What steps do you take in case there is a missing part from the order',
  'What steps do you take in case our customer reported damage',
  'What steps do you take in case our customer would like to leave a complaint or receive a refund',
  'Military spelling',
  'Duties for the day'
];

export default function TrainingTest() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [answers, setAnswers] = useState<string[]>(QUESTIONS.map(() => ''));
  const [sent, setSent] = useState(false);

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
        answers: QUESTIONS.map((q, i) => ({ question: q, answer: answers[i] }))
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
          <div>
            <label className="block font-medium mb-1">Name</label>
            <input className="input input-bordered w-full" value={name} onChange={e => setName(e.target.value)} />
          </div>
          <div>
            <label className="block font-medium mb-1">Email</label>
            <input className="input input-bordered w-full" value={email} onChange={e => setEmail(e.target.value)} />
          </div>
          {QUESTIONS.map((q, i) => (
            <div key={i}>
              <label className="block font-medium mb-1">{q}</label>
              <textarea
                className="textarea textarea-bordered w-full"
                rows={2}
                value={answers[i]}
                onChange={e => handleChange(i, e.target.value)}
              />
            </div>
          ))}
          <button className="btn btn-primary" onClick={handleSubmit}>Submit</button>
        </div>
      )}
    </Layout>
  );
}
