import { ReactNode } from 'react';

interface CardProps {
  title: string;
  value: ReactNode;
  onClick?: () => void;
}

export default function Card({ title, value, onClick }: CardProps) {
  return (
    <div onClick={onClick} className="card bg-base-100 shadow cursor-pointer hover:shadow-lg">
      <div className="card-body items-center p-4">
        <h2 className="card-title text-sm font-medium">{title}</h2>
        <p className="text-4xl font-bold">{value}</p>
      </div>
    </div>
  );
}
