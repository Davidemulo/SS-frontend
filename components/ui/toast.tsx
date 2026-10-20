"use client";
import { createContext, useCallback, useContext, useState } from "react";

interface Toast {
  id: number;
  title: string;
  description?: string;
}

const ToastCtx = createContext<(t: Omit<Toast, "id">) => void>(() => {});

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const push = useCallback((t: Omit<Toast, "id">) => {
    const id = Date.now() + Math.random();
    setToasts((p) => [...p, { ...t, id }]);
    setTimeout(() => setToasts((p) => p.filter((x) => x.id !== id)), 4000);
  }, []);
  return (
    <ToastCtx.Provider value={push}>
      {children}
      <div className="fixed bottom-4 right-4 z-[60] flex flex-col gap-2">
        {toasts.map((t) => (
          <div
            key={t.id}
            role="status"
            className="animate-in slide-in-from-bottom rounded-lg border bg-emerald-600 px-4 py-3 text-white shadow-lg"
          >
            <p className="font-semibold">{t.title}</p>
            {t.description && <p className="text-sm opacity-90">{t.description}</p>}
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}

export const useToast = () => useContext(ToastCtx);
