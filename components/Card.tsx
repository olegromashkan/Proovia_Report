import { ReactNode } from 'react';

interface CardProps {
  title: string;
  value: ReactNode;
  onClick?: () => void;
}

export default function Card({ title, value, onClick }: CardProps) {
  return (
    <div
      onClick={onClick}
      className="border rounded-system p-4 shadow-system cursor-pointer hover:shadow-lg text-center"
      style={{ background: 'var(--card-bg)' }}
    >
      <h2 className="text-sm font-medium mb-1">{title}</h2>
      <div className="text-4xl font-bold">{value}</div>
    </div>
  );
}
