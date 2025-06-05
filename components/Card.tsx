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
      className="cursor-pointer bg-white/80 backdrop-blur border border-gray-200 rounded-xl shadow-md p-6 flex flex-col items-center transition hover:-translate-y-1 hover:shadow-xl"
    >
      <div className="text-xs font-semibold uppercase text-gray-500 tracking-wide">{title}</div>
      <div className="text-4xl font-bold">{value}</div>
    </div>
  );
}
