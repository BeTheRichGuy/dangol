'use client';

import { useEffect, useRef, useState, type RefObject } from 'react';

interface SeenOptions {

  threshold?: number;

  rootMargin?: string;
}

export function useSeen<T extends Element>(opts: SeenOptions = {}): [RefObject<T | null>, boolean] {
  const { threshold = 0, rootMargin = '0px' } = opts;
  const ref = useRef<T | null>(null);
  const [seen, setSeen] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === 'undefined') {
      const t = window.setTimeout(() => setSeen(true), 0);
      return () => window.clearTimeout(t);
    }
    const io = new IntersectionObserver(
      (entries) => {

        if (entries.some((e) => e.isIntersecting || e.boundingClientRect.top < 0)) {
          setSeen(true);
          io.disconnect();
        }
      },
      { threshold, rootMargin },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [threshold, rootMargin]);

  return [ref, seen];
}
