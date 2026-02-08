'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

export interface ToastItem {
  id: string;
  type: 'info' | 'success' | 'warning' | 'danger';
  title: string;
  description?: string;
}

const TYPE_STYLES: Record<ToastItem['type'], string> = {
  info: 'border-blue-500/40 text-blue-300',
  success: 'border-emerald-500/40 text-emerald-300',
  warning: 'border-amber-500/40 text-amber-300',
  danger: 'border-red-500/40 text-red-300',
};

const DISMISS_MS = 3000;

// --- Global toast state ---
type Listener = () => void;
let toasts: ToastItem[] = [];
const listeners = new Set<Listener>();

function notify() {
  listeners.forEach(fn => fn());
}

export function pushToast(item: Omit<ToastItem, 'id'>) {
  toasts = [...toasts, { ...item, id: `toast_${Date.now()}_${Math.random().toString(36).slice(2, 5)}` }];
  notify();
}

function removeToast(id: string) {
  toasts = toasts.filter(t => t.id !== id);
  notify();
}

function useToasts() {
  const [, setTick] = useState(0);
  useEffect(() => {
    const fn = () => setTick(prev => prev + 1);
    listeners.add(fn);
    return () => { listeners.delete(fn); };
  }, []);
  return toasts;
}

// --- Single toast ---
function ToastCard({ item, onClose }: { item: ToastItem; onClose: () => void }) {
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const [exiting, setExiting] = useState(false);

  const dismiss = useCallback(() => {
    setExiting(true);
    setTimeout(onClose, 300);
  }, [onClose]);

  useEffect(() => {
    timerRef.current = setTimeout(dismiss, DISMISS_MS);
    return () => clearTimeout(timerRef.current);
  }, [dismiss]);

  const style = TYPE_STYLES[item.type];

  return (
    <div
      className={`
        relative max-w-sm w-full pointer-events-auto
        rounded-xl border p-3 pr-8
        backdrop-blur-xl bg-zinc-900/60
        shadow-2xl shadow-black/40
        transition-all duration-300
        ${style}
        ${exiting ? 'opacity-0 translate-x-8' : 'opacity-100 translate-x-0'}
      `}
      onMouseEnter={() => clearTimeout(timerRef.current)}
      onMouseLeave={() => { timerRef.current = setTimeout(dismiss, DISMISS_MS); }}
    >
      <button
        onClick={dismiss}
        className="absolute top-2 right-2 text-zinc-500 hover:text-zinc-200 transition-colors"
      >
        <X className="w-3.5 h-3.5" />
      </button>
      <div className="text-sm font-medium">{item.title}</div>
      {item.description && (
        <div className="text-xs text-zinc-400 mt-0.5">{item.description}</div>
      )}
    </div>
  );
}

// --- Portal container ---
export function ToastContainer() {
  const items = useToasts();
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  if (!mounted) return null;

  return createPortal(
    <div className="fixed bottom-4 right-4 z-[9999] flex flex-col-reverse gap-2 pointer-events-none">
      {items.map(item => (
        <ToastCard key={item.id} item={item} onClose={() => removeToast(item.id)} />
      ))}
    </div>,
    document.body
  );
}
