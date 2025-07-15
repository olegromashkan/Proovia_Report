import React from 'react';
import useSWR from 'swr';
import { motion } from 'framer-motion';
import Skeleton from './Skeleton';
import { Summary } from '../types';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

interface SummaryCardsProps {
  onSelect: (id: string) => void;
}

export default function SummaryCards({ onSelect }: SummaryCardsProps) {
  // Fetch summary data on the client
  const { data, error, isLoading } = useSWR<Summary>('/api/summary', fetcher);

  if (error) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 w-full sm:w-auto">
        <div className="col-span-4 text-center text-red-500">Failed to load summary</div>
      </div>
    );
  }

  const cards = [
    { id: 'total', title: 'Total Tasks', value: data?.total ?? 0 },
    { id: 'complete', title: 'Completed', value: data?.complete ?? 0 },
    { id: 'failed', title: 'Failed', value: data?.failed ?? 0 },
    { id: 'avg', title: 'Avg Punctuality (m)', value: data?.avgPunctuality ?? 0 },
  ];

  return (
    <motion.div
      className="grid grid-cols-2 sm:grid-cols-4 gap-4 w-full sm:w-auto"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.4, type: 'spring', stiffness: 80, damping: 15 }}
    >
      {isLoading
        ? Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-20 rounded-lg" />
          ))
        : cards.map((c) => (
            <motion.button
              key={c.id}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => onSelect(c.id)}
              className="stat bg-base-200 hover:bg-base-300 text-center rounded-lg transition"
              type="button"
            >
              <div className="stat-title">{c.title}</div>
              <div className="stat-value">{c.value}</div>
            </motion.button>
          ))}
    </motion.div>
  );
}

