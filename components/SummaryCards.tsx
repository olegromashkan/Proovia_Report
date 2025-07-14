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
            <Skeleton key={i} className="h-20 rounded-xl" />
          ))
        : cards.map((c) => (
            <motion.button
              key={c.id}
              whileHover={{ scale: 1.05, rotate: 2 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => onSelect(c.id)}
              className="bg-white/20 backdrop-blur-sm rounded-xl p-4 text-center border border-white/10 hover:bg-white/40 transition focus:outline-none focus:ring"
              type="button"
            >
              <h3 className="text-sm font-semibold text-white">{c.title}</h3>
              <p className="text-2xl font-bold text-white">{c.value}</p>
            </motion.button>
          ))}
    </motion.div>
  );
}

