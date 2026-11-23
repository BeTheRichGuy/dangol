'use client';

import { useEffect, useRef, useState, type RefObject } from 'react';

interface InViewOptions {

  rootMargin?: string;
  threshold?: number;

  once?: boolean;
}

export function useInView(ref: RefObject<Element | null>, opts: InViewOptions = {}): boolean {
  const { rootMargin = '0px', threshold = 0, once = false } = opts;
  const supported = typeof IntersectionObserver !== 'undefined';
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || !supported) return;
    const io = new IntersectionObserver(
      (entries) => {
        const last = entries[entries.length - 1];
        if (!last) return;
        if (last.isIntersecting) {
          setInView(true);
          if (once) io.disconnect();
        } else if (!once) {
          setInView(false);
        }
      },
      { rootMargin, threshold },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [ref, rootMargin, threshold, once, supported]);

  return !supported || inView;
}

export function useOnEnter(
  ref: RefObject<Element | null>,
  onEnter: () => void,
  opts: Omit<InViewOptions, 'once'> & { orAbove?: boolean } = {},
): void {
  const { rootMargin = '0px', threshold = 0, orAbove = false } = opts;
  const latest = useRef(onEnter);
  useEffect(() => {
    latest.current = onEnter;
  });

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === 'undefined') {
      const t = window.setTimeout(() => latest.current(), 0);
      return () => window.clearTimeout(t);
    }
    const io = new IntersectionObserver(
      (entries) => {

        if (entries.some((e) => e.isIntersecting || (orAbove && e.boundingClientRect.top < 0))) {
          io.disconnect();
          latest.current();
        }
      },
      { rootMargin, threshold },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [ref, rootMargin, threshold, orAbove]);
}
