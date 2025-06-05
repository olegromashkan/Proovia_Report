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
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-20">
      <div
        className={`bg-white rounded-lg shadow-xl w-full p-6 relative ${className || 'max-w-lg'}`}
      >
        <button className="absolute top-2 right-2 text-xl hover:text-red-600" onClick={onClose}>
          <Icon name="xmark" className="icon" />
        </button>
        {children}
      </div>
    </div>
  );
}
