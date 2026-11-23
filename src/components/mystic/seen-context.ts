'use client';

import { createContext, useContext } from 'react';

export const HostSeenContext = createContext<boolean | null>(null);

export function useHostSeen(): boolean | null {
  return useContext(HostSeenContext);
}
