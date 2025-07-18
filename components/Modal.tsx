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
    <div
      className="modal modal-open"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className={`modal-box ${className || ''}`.trim()}>
        <button
          className="btn btn-sm btn-circle absolute right-2 top-2"
          onClick={onClose}
          aria-label="Close modal"
        >
          <Icon name="xmark" className="w-4 h-4" />
        </button>
        {children}
      </div>
    </div>
  );
}