'use client';

import { useEffect } from 'react';

const SCROLL_STORAGE_KEY = 'timeslot:scroll-restore';

export function PreserveScrollOnSubmit() {
  useEffect(() => {
    const savedScroll = sessionStorage.getItem(SCROLL_STORAGE_KEY);

    if (savedScroll) {
      const nextScroll = Number(savedScroll);
      if (Number.isFinite(nextScroll) && nextScroll >= 0) {
        window.requestAnimationFrame(() => window.scrollTo({ top: nextScroll, behavior: 'auto' }));
      }
      sessionStorage.removeItem(SCROLL_STORAGE_KEY);
    }

    const handleSubmit = (event: Event) => {
      const form = event.target instanceof HTMLFormElement ? event.target : null;
      if (!form) {
        return;
      }

      if (form.dataset.preserveScroll !== 'true') {
        return;
      }

      sessionStorage.setItem(SCROLL_STORAGE_KEY, String(window.scrollY));
    };

    document.addEventListener('submit', handleSubmit, true);

    return () => {
      document.removeEventListener('submit', handleSubmit, true);
    };
  }, []);

  return null;
}
