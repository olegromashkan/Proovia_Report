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
      className="cursor-pointer bg-white border rounded shadow-sm p-4 hover:bg-gray-50 flex flex-col items-center"
    >
      <div className="text-sm text-gray-500">{title}</div>
      <div className="text-2xl font-bold">{value}</div>
    </div>
  );
}
