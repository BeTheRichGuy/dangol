'use client';

import { useEffect } from 'react';

export const NIGHT_THEME_COLOR = '#141018';

export function NightTheme() {
  useEffect(() => {
    const found = Array.from(document.querySelectorAll<HTMLMetaElement>('meta[name="theme-color"]'));
    const saved = found.map((meta) => meta.getAttribute('content'));

    let created: HTMLMetaElement | null = null;
    if (found.length === 0) {
      created = document.createElement('meta');
      created.name = 'theme-color';
      document.head.appendChild(created);
      found.push(created);
      saved.push(null);
    }
    found.forEach((meta) => meta.setAttribute('content', NIGHT_THEME_COLOR));
    return () => {
      found.forEach((meta, i) => {
        const was = saved[i];
        if (was !== null && was !== undefined) meta.setAttribute('content', was);
      });
      created?.remove();
    };
  }, []);

  return null;
}
