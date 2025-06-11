import { useState, ChangeEvent } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import Layout from '../../components/Layout';

export default function Register() {
  const [step, setStep] = useState(1);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [photo, setPhoto] = useState('');
  const [header, setHeader] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  const handlePhoto = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result !== 'string') return;
      const img = new Image();
      img.onload = () => {
        let w = img.width;
        let h = img.height;
        const ratio = w / h;
        if (w > h) {
          if (w > 1280) {
            w = 1280;
            h = Math.round(w / ratio);
          }
        } else {
          if (h > 720) {
            h = 720;
            w = Math.round(h * ratio);
          }
        }
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, w, h);
          const data = canvas.toDataURL('image/jpeg', 0.8);
          setPhoto(data);
        }
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  };

  const handleHeader = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result !== 'string') return;
      const img = new Image();
      img.onload = () => {
        let w = img.width;
        let h = img.height;
        const ratio = w / h;
        if (w > 1280) {
          w = 1280;
          h = Math.round(w / ratio);
        }
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, w, h);
          const data = canvas.toDataURL('image/jpeg', 0.8);
          setHeader(data);
        }
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  };

  const submit = async () => {
    const res = await fetch('/api/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password, photo, header }),
    });
    if (res.ok) {
      router.push('/auth/login');
    } else {
      const data = await res.json();
      setError(data.message || 'Oops, something went wrong! Try again.');
    }
  };

  const nextStep = () => {
    if (step === 1 && !username) {
      setError('Please choose a username to continue!');
      return;
    }
    if (step === 2 && !password) {
      setError('Please set a password to continue!');
      return;
    }
    setError('');
    setStep(step + 1);
  };

  const prevStep = () => {
    setError('');
    setStep(step - 1);
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            transition={{ type: 'spring', stiffness: 120, damping: 20 }}
            className="space-y-6"
          >
            <h2 className="text-4xl font-extrabold bg-gradient-to-r from-blue-600 to-purple-500 bg-clip-text text-transparent">
              Pick Your Username
            </h2>
            <p className="text-gray-500 text-lg">Choose a name that sparkles!</p>
            <input
              type="text"
              placeholder="Your unique username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full p-4 rounded-2xl bg-white bg-opacity-70 backdrop-blur-md text-gray-800 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-400 shadow-lg"
            />
          </motion.div>
        );
      case 2:
        return (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            transition={{ type: 'spring', stiffness: 120, damping: 20 }}
            className="space-y-6"
          >
            <h2 className="text-4xl font-extrabold bg-gradient-to-r from-blue-600 to-purple-500 bg-clip-text text-transparent">
              Set a Password
            </h2>
            <p className="text-gray-500 text-lg">Make it strong and secure!</p>
            <input
              type="password"
              placeholder="Your secret password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-4 rounded-2xl bg-white bg-opacity-70 backdrop-blur-md text-gray-800 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-400 shadow-lg"
            />
          </motion.div>
        );
      case 3:
        return (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            transition={{ type: 'spring', stiffness: 120, damping: 20 }}
            className="space-y-6"
          >
            <h2 className="text-4xl font-extrabold bg-gradient-to-r from-blue-600 to-purple-500 bg-clip-text text-transparent">
              Add a Profile Photo
            </h2>
            <p className="text-gray-500 text-lg">Show off your style!</p>
            <input
              type="file"
              accept="image/*"
              onChange={handlePhoto}
              className="w-full p-4 rounded-2xl bg-white bg-opacity-70 backdrop-blur-md text-gray-800 border border-gray-200 file:mr-4 file:py-3 file:px-5 file:rounded-xl file:border-0 file:bg-gradient-to-r file:from-blue-500 file:to-purple-500 file:text-white hover:file:from-blue-600 hover:file:to-purple-600 shadow-lg"
            />
            {photo && (
              <motion.img
                src={photo}
                alt="Profile preview"
                className="w-32 h-32 object-cover rounded-full mx-auto shadow-xl border-4 border-white"
                initial={{ scale: 0, rotate: -10 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: 'spring', stiffness: 200, damping: 20 }}
              />
            )}
          </motion.div>
        );
      case 4:
        return (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            transition={{ type: 'spring', stiffness: 120, damping: 20 }}
            className="space-y-6"
          >
            <h2 className="text-4xl font-extrabold bg-gradient-to-r from-blue-600 to-purple-500 bg-clip-text text-transparent">
              Choose a Header Image
            </h2>
            <p className="text-gray-500 text-lg">Set the mood for your profile!</p>
            <input
              type="file"
              accept="image/*"
              onChange={handleHeader}
              className="w-full p-4 rounded-2xl bg-white bg-opacity-70 backdrop-blur-md text-gray-800 border border-gray-200 file:mr-4 file:py-3 file:px-5 file:rounded-xl file:border-0 file:bg-gradient-to-r file:from-blue-500 file:to-purple-500 file:text-white hover:file:from-blue-600 hover:file:to-purple-600 shadow-lg"
            />
            {header && (
              <motion.img
                src={header}
                alt="Header preview"
                className="w-full h-48 object-cover rounded-2xl shadow-xl border-2 border-white"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', stiffness: 150, damping: 20 }}
              />
            )}
          </motion.div>
        );
      case 5:
        return (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            transition={{ type: 'spring', stiffness: 120, damping: 20 }}
            className="space-y-6 text-center"
          >
            <h2 className="text-4xl font-extrabold bg-gradient-to-r from-blue-600 to-purple-500 bg-clip-text text-transparent">
              Let’s Get Started!
            </h2>
            <p className="text-gray-500 text-lg">Your profile is ready to dazzle. Let’s go!</p>
            <motion.button
              onClick={submit}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-blue-500 to-purple-500 text-white font-semibold text-lg shadow-xl hover:from-blue-600 hover:to-purple-600 transition"
              whileHover={{ scale: 1.05, boxShadow: '0 8px 32px rgba(0, 0, 255, 0.3)' }}
              whileTap={{ scale: 0.95 }}
            >
              Go!
            </motion.button>
          </motion.div>
        );
      default:
        return null;
    }
  };

  return (
    <Layout title="Register">
      <div className="fixed inset-0 flex items-center justify-center overflow-hidden bg-gradient-to-br from-gray-50 to-gray-200">
        <motion.div
          className="fixed inset-0 bg-cover bg-center filter blur-3xl"
          style={{ backgroundImage: header ? `url(${header})` : 'none' }}
          initial={{ opacity: 0 }}
          animate={{ opacity: header ? 0.6 : 0 }}
          transition={{ duration: 1.5, ease: 'easeInOut' }}
        />
        <motion.div
          className="fixed inset-0 bg-black bg-opacity-10"
          initial={{ opacity: 0 }}
          animate={{ opacity: header ? 0.3 : 0 }}
          transition={{ duration: 1.5, ease: 'easeInOut' }}
        />
        <motion.div
          className="relative z-10 bg-white bg-opacity-80 backdrop-blur-lg p-12 rounded-3xl shadow-2xl max-w-md w-full mx-4"
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 100, damping: 20 }}
        >
          <AnimatePresence mode="wait">{renderStep()}</AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-red-400 text-sm mt-6 text-center font-medium"
            >
              {error}
            </motion.div>
          )}
          <div className="flex justify-between mt-8">
            {step > 1 && (
              <motion.button
                onClick={prevStep}
                className="px-6 py-3 rounded-xl bg-white bg-opacity-70 backdrop-blur-md text-gray-700 font-semibold hover:bg-opacity-90 transition shadow-md"
                whileHover={{ scale: 1.05, boxShadow: '0 4px 16px rgba(0, 0, 0, 0.2)' }}
                whileTap={{ scale: 0.95 }}
              >
                Back
              </motion.button>
            )}
            {step < 5 && (
              <motion.button
                onClick={nextStep}
                className="px-6 py-3 rounded-xl bg-gradient-to-r from-blue-500 to-purple-500 text-white font-semibold hover:from-blue-600 hover:to-purple-600 transition ml-auto shadow-md"
                whileHover={{ scale: 1.05, boxShadow: '0 4px 16px rgba(0, 0, 255, 0.3)' }}
                whileTap={{ scale: 0.95 }}
              >
                Next
              </motion.button>
            )}
          </div>
          <div className="flex justify-center space-x-3 mt-8">
            {[1, 2, 3, 4, 5].map((s) => (
              <motion.div
                key={s}
                className={`w-4 h-4 rounded-full ${
                  step === s ? 'bg-gradient-to-r from-blue-500 to-purple-500' : 'bg-gray-300'
                }`}
                initial={{ scale: 0.8 }}
                animate={{ scale: step === s ? 1.3 : 1 }}
                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              />
            ))}
          </div>
        </motion.div>
      </div>
    </Layout>
  );
}