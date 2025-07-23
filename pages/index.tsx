import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { motion } from 'framer-motion';
import Layout from '../components/Layout';
import Modal from '../components/Modal';
import Calendar from '../components/Calendar';
import SummaryFeed from '../components/SummaryFeed';
import SummaryCards from '../components/SummaryCards';

// Dynamic imports for overlays improve initial load performance
const WelcomeModal = dynamic(() => import('../components/WelcomeModal'), { ssr: false });
const SearchOverlay = dynamic(() => import('../components/SearchOverlay'), { ssr: false });
const TasksPanel = dynamic(() => import('../components/TasksPanel'), { ssr: false });
const AiChatPanel = dynamic(() => import('../components/AiChatPanel'), { ssr: false });

export default function Home() {
  const [selected, setSelected] = useState<string | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [tasksOpen, setTasksOpen] = useState(false);
  const [aiOpen, setAiOpen] = useState(false);
  const [aiText, setAiText] = useState('');
  const [welcomeOpen, setWelcomeOpen] = useState(false);

  // Show welcome modal only once
  useEffect(() => {
    const seen = localStorage.getItem('welcomeSeen');
    if (!seen) setWelcomeOpen(true);
  }, []);

  const closeWelcome = () => {
    localStorage.setItem('welcomeSeen', '1');
    setWelcomeOpen(false);
  };

  const cardTitles: Record<string, string> = {
    total: 'Total Tasks',
    complete: 'Completed',
    failed: 'Failed',
    avg: 'Avg Punctuality (m)'
  };

  return (
    <Layout title="Home" fullWidth>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 80, damping: 15 }}
        className="card bg-base-100 shadow-xl border border-base-200"
      >
        <div className="card-body flex flex-col sm:flex-row items-center justify-between gap-3 p-3">
          <SummaryCards onSelect={setSelected} />
        </div>
      </motion.div>

      <div className="flex flex-col md:flex-row gap-4 mt-4">
        <div className="flex-[2] w-full">
          <Calendar />
        </div>
        <div className="flex-[3] min-w-[300px] card bg-base-100/70 shadow-xl p-3">
          <SummaryFeed />
        </div>
      </div>

      <Modal open={!!selected} onClose={() => setSelected(null)}>
        <div className="card bg-base-100 p-4 shadow-xl">
          <h2 className="text-lg font-bold mb-3">{selected ? cardTitles[selected] : ''}</h2>
          <div className="h-32 flex items-center justify-center text-base-content/50">
            Graph Placeholder
          </div>
        </div>
      </Modal>

      <WelcomeModal open={welcomeOpen} onClose={closeWelcome} />
      <SearchOverlay
        open={searchOpen}
        onClose={() => setSearchOpen(false)}
        onAskAi={(q) => {
          setAiText(q);
          setSearchOpen(false);
          setAiOpen(true);
        }}
      />
      <TasksPanel open={tasksOpen} onClose={() => setTasksOpen(false)} />
      <AiChatPanel open={aiOpen} onClose={() => setAiOpen(false)} initialText={aiText} />
    </Layout>
  );
}