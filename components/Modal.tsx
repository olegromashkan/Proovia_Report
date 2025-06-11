import { ReactNode } from 'react';
import Icon from './Icon';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  className?: string;
}

export default function Modal({ open, onClose, children, className }: ModalProps) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
      <div
        className={`relative bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 w-full max-h-[90vh] overflow-auto ${
          className || 'max-w-2xl'
        }`}
      >
        <button
          className="absolute right-4 top-4 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          onClick={onClose}
          aria-label="Close modal"
        >
          <Icon name="xmark" className="w-5 h-5" />
        </button>
        {children}
      </div>
    </div>
  );
}