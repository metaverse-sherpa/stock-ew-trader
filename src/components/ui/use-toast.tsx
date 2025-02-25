import { createContext, useContext, useState } from "react";

type Toast = {
  id: string;
  title: string;
  description: string;
  variant?: "default" | "destructive";
};

type ToastContextType = {
  toasts: Toast[];
  toast: (toast: Omit<Toast, "id">) => void;
  dismissToast: (id: string) => void;
};

const ToastContext = createContext<ToastContextType | null>(null);

export const ToastProvider = ({ children }: { children: React.ReactNode }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const toast = (toast: Omit<Toast, "id">) => {
    const id = Math.random().toString(36).substr(2, 9);
    setToasts((prev) => [...prev, { id, ...toast }]);
    setTimeout(() => dismissToast(id), 5000); // Auto-dismiss after 5 seconds
  };

  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };
    
  return (
    <ToastContext.Provider value={{ toasts, toast, dismissToast }}>
      {children}
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}; 