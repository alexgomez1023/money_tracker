"use client";

import { useEffect, useRef, useState } from "react";
import Icon from "@/components/ui/Icon";
import { TOAST_EVENT, type ToastDetail } from "@/lib/toast";

// How long a toast stays on screen.
const VISIBLE_MS = 4000;

type Toast = ToastDetail & {
  id: number;
};

// Renders the messages sent with showToast(). Sits just above the bottom navigation on phones.
export default function Toaster() {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const nextId = useRef(1);

  useEffect(() => {
    const timers: number[] = [];

    function handleToast(event: Event) {
      const detail = (event as CustomEvent<ToastDetail>).detail;
      const id = nextId.current++;

      setToasts((current) => [...current, { ...detail, id }]);

      const timer = window.setTimeout(() => {
        setToasts((current) =>
          current.filter((toast) => toast.id !== id)
        );
      }, VISIBLE_MS);

      timers.push(timer);
    }

    window.addEventListener(TOAST_EVENT, handleToast);

    return () => {
      window.removeEventListener(TOAST_EVENT, handleToast);

      for (const timer of timers) {
        window.clearTimeout(timer);
      }
    };
  }, []);

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-24 z-50 flex flex-col items-center gap-2 px-4 lg:bottom-8 lg:pl-60">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          role={toast.kind === "error" ? "alert" : "status"}
          className={`toast-enter pointer-events-auto flex max-w-sm items-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold text-white shadow-lg ${
            toast.kind === "error" ? "bg-accent" : "bg-primary"
          }`}
        >
          {toast.kind === "success" && (
            <Icon name="check" size={18} className="shrink-0" />
          )}

          {toast.text}
        </div>
      ))}
    </div>
  );
}
