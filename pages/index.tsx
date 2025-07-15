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
        className="relative rounded-2xl bg-white/0 dark:bg-black/50 border border-white/20 dark:border-black/20 shadow-lg"
      >
        <div className="relative flex flex-col sm:flex-row items-center justify-between p-4 gap-4">
          <SummaryCards onSelect={setSelected} />
        </div>
      </motion.div>

      <div className="flex flex-col md:flex-row gap-6 mt-6">
        <div className="flex-[3] w-full md:w-62 p-4">
          <Calendar />
        </div>
        <div className="flex-[5] min-w-[900px] bg-white/70 dark:bg-black/50 p-4">
          <SummaryFeed />
        </div>
      </div>

      <Modal open={!!selected} onClose={() => setSelected(null)}>
        <div className="bg-white p-6 rounded-lg shadow-lg">
          <h2 className="text-xl font-bold mb-4">{selected ? cardTitles[selected] : ''}</h2>
          <div className="h-40 flex items-center justify-center text-gray-500">Graph Placeholder</div>
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

