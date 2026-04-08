"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import * as Toast from "@radix-ui/react-toast";

type ToastVariant = "success" | "error" | "info";

interface ToastMessage {
  readonly id: number;
  readonly title: string;
  readonly variant: ToastVariant;
}

interface ToastContextValue {
  showToast: (title: string, variant: ToastVariant) => void;
}

const ToastContext = createContext<ToastContextValue>({
  showToast: () => {},
});

export function useToast() {
  return useContext(ToastContext);
}

let toastId = 0;

export function ToastProvider({ children }: { readonly children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const showToast = useCallback((title: string, variant: ToastVariant) => {
    const id = ++toastId;
    setToasts((prev) => [...prev, { id, title, variant }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const variantStyles: Record<ToastVariant, string> = {
    success: "border-emerald-600 bg-emerald-900/40 text-emerald-300",
    error: "border-red-600 bg-red-900/40 text-red-300",
    info: "border-indigo-600 bg-indigo-900/40 text-indigo-300",
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      <Toast.Provider swipeDirection="right">
        {children}
        {toasts.map((t) => (
          <Toast.Root
            key={t.id}
            className={`rounded-lg border px-4 py-3 text-sm shadow-lg ${variantStyles[t.variant]}`}
          >
            <Toast.Title>{t.title}</Toast.Title>
          </Toast.Root>
        ))}
        <Toast.Viewport className="fixed bottom-4 right-4 z-50 flex w-80 flex-col gap-2" />
      </Toast.Provider>
    </ToastContext.Provider>
  );
}
