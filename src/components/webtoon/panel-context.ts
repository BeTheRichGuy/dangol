'use client';

import { createContext, useContext } from 'react';

export const SeenContext = createContext(false);

export const MouthContext = createContext<number | null>(null);

export function usePanelSeen(): boolean {
  return useContext(SeenContext);
}

export function usePanelMouth(): number | null {
  return useContext(MouthContext);
}
