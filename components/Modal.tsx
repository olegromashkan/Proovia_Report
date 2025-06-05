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
    <div className="modal modal-open">
      <div className={`modal-box ${className || 'max-w-lg'}`}>
        <button className="btn btn-sm btn-circle absolute right-2 top-2" onClick={onClose}>
          <Icon name="xmark" className="icon" />
        </button>
        {children}
      </div>
    </div>
  );
}
