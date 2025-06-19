import { motion, AnimatePresence } from 'framer-motion';

export default function PageLoader({ loading }: { loading: boolean }) {
  return (
    <AnimatePresence>
      {loading && (
        <motion.div
          className="fixed inset-0 flex flex-col items-center justify-center bg-white dark:bg-gray-900 z-50"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          <motion.img
            src="https://cdn.proovia.uk/pd/images/logo/logo-default.svg"
            alt="Loading"
            className="w-32"
            initial={{ rotate: 0 }}
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
