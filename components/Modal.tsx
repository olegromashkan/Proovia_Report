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
    <div className="modal modal-bottom sm:modal-middle modal-open">
      <div className={`modal-box ${className || 'max-w-2xl'}`}>
        <button className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2 z-10" onClick={onClose}>✕</button>
        {children}
      </div>
      {/* Этот label позволяет закрывать модальное окно по клику на фон */}
      <label className="modal-backdrop" onClick={onClose}>Close</label>
    </div>
  );
}