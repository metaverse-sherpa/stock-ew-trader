import { useState, useEffect } from 'react';

interface DialogProps {
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel?: () => void;
}

export const Dialog = ({ title, message, onConfirm, onCancel }: DialogProps) => {
  const [isOpen, setIsOpen] = useState(true);

  const handleConfirm = () => {
    onConfirm(); // Call the onConfirm callback
    setIsOpen(false); // Close the dialog
  };

  const handleCancel = () => {
    onCancel?.(); // Call the onCancel callback (if provided)
    setIsOpen(false); // Close the dialog
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999]">
      <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
        <h2 className="text-xl font-bold mb-4 text-gray-900">{title}</h2>
        <p className="mb-6 text-gray-700">{message}</p>
        <div className="flex justify-end space-x-4">
          {onCancel && (
            <button
              onClick={handleCancel}
              className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400 text-gray-900"
            >
              Cancel
            </button>
          )}
          <button
            onClick={handleConfirm}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
};