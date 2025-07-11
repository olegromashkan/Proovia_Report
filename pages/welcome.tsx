import { useRouter } from 'next/router';
import EmailTemplate from '../components/EmailTemplate';

export default function WelcomeEmailPage() {
  const router = useRouter();
  const name = typeof router.query.name === 'string' ? router.query.name : 'Candidate';
  const score = typeof router.query.score === 'string' ? router.query.score : '95';
  const pdfUrl = typeof router.query.pdf === 'string' ? router.query.pdf : '#';
  const date = typeof router.query.date === 'string' ? router.query.date : 'Monday, July 14, 2025';
  const time = typeof router.query.time === 'string' ? router.query.time : '7:30 AM';

  return (
    <EmailTemplate name={name} score={Number(score)} pdfUrl={pdfUrl} date={date} time={time} />
  );
}
