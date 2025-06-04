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
      className="cursor-pointer bg-white/80 backdrop-blur border border-gray-200 rounded-lg shadow-md p-6 flex flex-col items-center transition hover:-translate-y-1 hover:shadow-lg"
    >
      <div className="text-sm text-gray-500">{title}</div>
      <div className="text-3xl font-semibold">{value}</div>
    </div>
  );
}
