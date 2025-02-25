import { useEffect, useState } from 'react';

interface BubbleNotificationProps {
  message: string;
  duration?: number;
  onConfirm?: () => void;
  onCancel?: () => void;
}

export const BubbleNotification = ({ message, duration = 2000, onConfirm, onCancel }: BubbleNotificationProps) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    if (!onConfirm && !onCancel) {
      // Auto-hide if there are no interactive buttons
      const timer = setTimeout(() => {
        setIsVisible(false);
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [duration, onConfirm, onCancel]);

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-4 right-4 bg-gray-800 text-white px-4 py-2 rounded-lg shadow-lg z-[9999]">
      <p className="mb-2">{message}</p>
      {onConfirm && onCancel && (
        <div className="flex justify-end space-x-2">
          <button
            onClick={() => {
              onConfirm();
              setIsVisible(false);
            }}
            className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Yes
          </button>
          <button
            onClick={() => {
              onCancel();
              setIsVisible(false);
            }}
            className="px-3 py-1 bg-gray-500 text-white rounded hover:bg-gray-600"
          >
            No
          </button>
        </div>
      )}
    </div>
  );
}; 