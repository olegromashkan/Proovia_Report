import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import Layout from '../../components/Layout';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [userData, setUserData] = useState<{ photo?: string; header?: string } | null>(null);
  const router = useRouter();

  const submit = async () => {
    setError('');
    setIsLoading(true);
    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      if (res.ok) {
        const data = await res.json();
        setUserData({ photo: data.user?.photo, header: data.user?.header });
        setTimeout(() => {
          router.push('/');
        }, 2000); // Delay for animation
      } else {
        let message = 'Login failed';
        const text = await res.text();
        try {
          const data = JSON.parse(text);
          message = data.message || message;
        } catch {
          if (text) message = text;
        }
        setError(message);
        setIsLoading(false);
      }
    } catch {
      setError('Oops, something went wrong! Try again.');
      setIsLoading(false);
    }
  };

  return (
    <Layout title="Login">
      <div className="fixed inset-0 flex items-center justify-center overflow-hidden bg-gradient-to-br from-gray-50 to-gray-200">
        {/* Full-screen blurred background */}
        <AnimatePresence>
          {userData?.header && (
            <>
              <motion.div
                className="fixed inset-0 bg-cover bg-center filter blur-3xl"
                style={{ backgroundImage: `url(${userData.header})` }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.6 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 1.5, ease: 'easeInOut' }}
              />
              <motion.div
                className="fixed inset-0 bg-black bg-opacity-50"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 1.5, ease: 'easeInOut' }}
              />
            </>
          )}
        </AnimatePresence>

        {/* Success animation */}
        <AnimatePresence>
          {isLoading && userData?.photo && (
            <motion.div
              className="fixed inset-0 flex items-center justify-center z-20"
              initial={{ opacity: 1 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1 }}
            >
              <div className="relative flex flex-col items-center space-y-6">
                <div className="relative">
                  <motion.img
                    src={userData.photo}
                    alt="User avatar"
                    className="w-40 h-40 object-cover rounded-full border-4 border-white shadow-xl"
                    initial={{ scale: 0.8 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 200, damping: 20 }}
                  />
                  <motion.div
                    className="absolute inset-0 border-4 border-transparent border-t-blue-500 border-r-purple-500 rounded-full"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
                  />
                </div>
                <motion.div
                  className="text-white text-3xl font-semibold"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.8, delay: 0.3 }}
                >
                  Welcome back!
                </motion.div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Login form */}
        <motion.div
          className="relative z-10 bg-white bg-opacity-80 backdrop-blur-lg p-12 rounded-3xl shadow-2xl max-w-md w-full mx-4"
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 100, damping: 20 }}
        >
          <AnimatePresence mode="wait">
            {!isLoading && (
              <motion.div
                key="login-form"
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -50 }}
                transition={{ type: 'spring', stiffness: 120, damping: 20 }}
                className="space-y-6"
              >
                <h2 className="text-4xl font-extrabold bg-gradient-to-r from-blue-600 to-purple-500 bg-clip-text text-transparent">
                  Welcome Back!
                </h2>
                <p className="text-gray-500 text-lg">Log in to shine!</p>
                <input
                  type="text"
                  placeholder="Your username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full p-4 rounded-2xl bg-white bg-opacity-70 backdrop-blur-md text-gray-800 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-400 shadow-lg"
                />
                <input
                  type="password"
                  placeholder="Your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full p-4 rounded-2xl bg-white bg-opacity-70 backdrop-blur-md text-gray-800 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-400 shadow-lg"
                />
                <motion.button
                  onClick={submit}
                  className="w-full py-4 rounded-2xl bg-gradient-to-r from-blue-500 to-purple-500 text-white font-semibold text-lg shadow-xl hover:from-blue-600 hover:to-purple-600 transition"
                  whileHover={{ scale: 1.05, boxShadow: '0 8px 32px rgba(0, 0, 255, 0.3)' }}
                  whileTap={{ scale: 0.95 }}
                >
                  Log In
                </motion.button>
                <p className="text-center text-gray-500 text-sm">
                  New here?{' '}
                  <a
                    href="/auth/register"
                    className="text-blue-500 hover:text-blue-600 font-semibold"
                  >
                    Sign up now!
                  </a>
                </p>
              </motion.div>
            )}
          </AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-red-400 text-sm mt-6 text-center font-medium"
            >
              {error}
            </motion.div>
          )}
        </motion.div>
      </div>
    </Layout>
  );
}