'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

interface ToastFeedbackProps {
  message: string;
  type: 'success' | 'error';
}

const AUTO_CLOSE_MS = 3600;
const EXIT_ANIMATION_MS = 220;

export function ToastFeedback({ message, type }: ToastFeedbackProps) {
  const [visible, setVisible] = useState(Boolean(message));
  const [isEntering, setIsEntering] = useState(false);
  const closeTimeoutRef = useRef<number | null>(null);
  const unmountTimeoutRef = useRef<number | null>(null);

  const clearTimers = useCallback(() => {
    if (closeTimeoutRef.current !== null) {
      window.clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }

    if (unmountTimeoutRef.current !== null) {
      window.clearTimeout(unmountTimeoutRef.current);
      unmountTimeoutRef.current = null;
    }
  }, []);

  const closeToast = useCallback(() => {
    clearTimers();
    setIsEntering(false);

    unmountTimeoutRef.current = window.setTimeout(() => {
      setVisible(false);
    }, EXIT_ANIMATION_MS);
  }, [clearTimers]);

  useEffect(() => {
    if (!message) {
      return;
    }

    clearTimers();
    setVisible(true);
    window.requestAnimationFrame(() => setIsEntering(true));

    const url = new URL(window.location.href);
    url.searchParams.delete('feedback');
    url.searchParams.delete('feedbackType');
    window.history.replaceState({}, '', url.toString());

    closeTimeoutRef.current = window.setTimeout(() => closeToast(), AUTO_CLOSE_MS);

    return () => clearTimers();
  }, [message, closeToast, clearTimers]);

  useEffect(() => {
    return () => clearTimers();
  }, [clearTimers]);

  if (!message || !visible) {
    return null;
  }

  const colorClasses =
    type === 'success'
      ? 'border-emerald-300 bg-emerald-50 text-emerald-900'
      : 'border-danger/40 bg-white text-danger';

  return (
    <div className="pointer-events-none fixed right-3 top-3 z-50 w-[calc(100%-1.5rem)] max-w-md md:right-4 md:top-4 md:w-[calc(100%-2rem)]">
      <div
        role="status"
        aria-live="polite"
        className={`pointer-events-auto overflow-hidden rounded-xl border text-sm shadow-lg transition-all duration-200 ${
          isEntering ? 'translate-y-0 opacity-100' : '-translate-y-2 opacity-0'
        } ${colorClasses}`}
      >
        <div className="flex items-start justify-between gap-3 px-4 py-3">
          <span>{message}</span>
          <button
            type="button"
            onClick={closeToast}
            className="shrink-0 rounded-md border border-current/20 px-2 py-1 text-xs font-semibold hover:bg-black/5"
          >
            Fechar
          </button>
        </div>
        <div className="h-1 w-full bg-black/10">
          <div className="h-full w-full origin-left bg-current/60 toast-progress" style={{ animationDuration: `${AUTO_CLOSE_MS}ms` }} />
        </div>
      </div>
    </div>
  );
}
