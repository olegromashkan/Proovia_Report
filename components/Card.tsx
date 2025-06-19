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
      className="p-6 rounded-2xl bg-white dark:bg-gray-800 shadow-lg cursor-pointer hover:shadow-xl transition-all text-center"
    >
      <h2 className="text-sm font-semibold mb-1 text-gray-700 dark:text-gray-200">
        {title}
      </h2>
      <div className="text-4xl font-bold text-gray-900 dark:text-white">{value}</div>
    </div>
  );
}
