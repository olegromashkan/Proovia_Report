import React, { ReactNode } from 'react';

interface SectionCardProps {
  title: string;
  Icon: React.ElementType;
  children: ReactNode;
}

export default function SectionCard({ title, Icon, children }: SectionCardProps) {
  return (
    <div className="bg-white rounded-3xl shadow-md p-6">
      <div className="flex items-center gap-3 mb-6">
        <Icon className="w-5 h-5 text-gray-600" />
        <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
      </div>
      {children}
    </div>
  );
}
