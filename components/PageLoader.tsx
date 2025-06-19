import { motion, AnimatePresence, Variants } from 'framer-motion';
import { memo, useEffect } from 'react';

interface PageLoaderProps {
  loading: boolean;
  logoSrc?: string;
  onLoaded?: () => void; // Callback for when the loader finishes its exit animation
}

// Variants for the overall loader container
const loaderVariants: Variants = {
  initial: { opacity: 0 },
  animate: {
    opacity: 1,
    transition: {
      duration: 0.6,
      ease: [0.4, 0, 0.2, 1], // Standard, universally valid cubic-bezier
      when: 'beforeChildren',
    },
  },
  exit: {
    opacity: 0,
    transition: {
      duration: 0.5,
      ease: [0.4, 0, 0.2, 1], // Standard, universally valid cubic-bezier
    },
  },
};

// Variants for the central content (logo + wave)
const contentVariants: Variants = {
  initial: { opacity: 0, scale: 0.9 },
  animate: {
    opacity: 1,
    scale: 1,
    transition: {
      type: 'spring',
      damping: 18, // Less damping for a quicker, snappier feel
      stiffness: 120, // More stiffness
      delay: 0.2, // Slight delay after background appears
    },
  },
  exit: {
    opacity: 0,
    scale: 0.9,
    transition: { duration: 0.3, ease: [0.4, 0, 0.2, 1] }, // Standard, universally valid cubic-bezier
  },
};

// Variants for the pulsating gradient wave
const waveGradientVariants: Variants = {
  animate: {
    scale: [1, 1.2, 1], // Gentle pulsing
    opacity: [0.2, 0.4, 0.2], // Subtle opacity change
    x: ['-50%', '50%', '-50%'], // Move from left to right and back
    background: [
      'radial-gradient(circle at 10% 50%, var(--loader-gradient-color-light) 0%, transparent 40%)',
      'radial-gradient(circle at 50% 50%, var(--loader-gradient-color-medium) 0%, transparent 40%)',
      'radial-gradient(circle at 90% 50%, var(--loader-gradient-color-dark) 0%, transparent 40%)',
      'radial-gradient(circle at 10% 50%, var(--loader-gradient-color-light) 0%, transparent 40%)',
    ],
    transition: {
      duration: 5, // Slower, more majestic wave
      repeat: Infinity,
      ease: 'linear', // Linear for continuous movement
      repeatType: "loop", // Ensures seamless looping
    },
  },
};

const PageLoader = ({
  loading,
  logoSrc = 'https://cdn.proovia.uk/pd/images/logo/logo-default.svg',
  onLoaded,
}: PageLoaderProps) => {
  useEffect(() => {
    if (typeof document === 'undefined') return;
    const original = document.body.style.overflow;
    if (loading) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = original;
    }
    return () => {
      document.body.style.overflow = original;
    };
  }, [loading]);
  return (
    <AnimatePresence mode="wait" onExitComplete={onLoaded}>
      {loading && (
        <motion.div
          className="fixed inset-0 w-screen h-screen flex items-center justify-center z-[2147483647] bg-black pointer-events-auto overflow-hidden"
          variants={loaderVariants}
          initial="initial"
          animate="animate"
          exit="exit"
          role="status"
          aria-live="polite"
          aria-label="Loading content"
        >
          {/* The moving gradient wave */}
          <motion.div
            className="absolute top-0 left-0 w-[200%] h-full pointer-events-none"
            variants={waveGradientVariants}
            initial={{ x: '-50%' }}
            animate="animate"
            style={{
                // Initial background for the wave, will be animated by variants
                background: 'radial-gradient(circle at 10% 50%, var(--loader-gradient-color-light) 0%, transparent 40%)',
                filter: 'blur(30px)',
                opacity: 0.3,
            }}
          />

          {/* Central Logo Container */}
          <motion.div
            className="relative flex flex-col items-center justify-center z-10"
            variants={contentVariants}
          >
            {/* Logo */}
            <motion.img
              src={logoSrc}
              alt="Company Logo"
              className="w-40 h-40 object-contain drop-shadow-2xl"
              whileHover={{ scale: 1.05 }}
              transition={{ type: 'spring', damping: 10, stiffness: 100 }}
            />

            {/* Optional Loading Text */}
            <motion.p
              className="text-white text-xl font-light tracking-wider mt-6 opacity-80"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 0.8, y: 0, transition: { delay: 0.8, duration: 0.5 } }}
            >
              Loading...
            </motion.p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// Styles will now be defined in a global CSS file (e.g., globals.css)
// This entire 'styles' constant and the 'if (typeof document !== 'undefined')' block are REMOVED from here.

export default memo(PageLoader);