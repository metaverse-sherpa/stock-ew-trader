import { useState, useEffect } from 'react';

interface DialogProps {
  title: string;
  trigger?: React.ReactNode;
  onClose: () => void;
  children: React.ReactNode;
}

export const Dialog = ({ title, trigger, onClose, children }: DialogProps) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleClose = () => {
    setIsOpen(false);
    onClose();
  };

  // Prevent scrolling when the dialog is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }

    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [isOpen]);

  return (
    <>
      {trigger && (
        <div onClick={() => setIsOpen(true)}>
          {trigger}
        </div>
      )}
      
      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999]">
          <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
            <h2 className="text-xl font-bold mb-4 text-gray-900">{title}</h2>
            <div className="text-gray-700">
              {children}
            </div>
          </div>
        </div>
      )}
    </>
  );
};