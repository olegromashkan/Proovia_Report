import React from 'react';

interface SkeletonProps {
  className?: string;
}

export default function Skeleton({ className }: SkeletonProps) {
  return <div className={`bg-white/20 rounded animate-pulse ${className}`.trim()} />;
}
