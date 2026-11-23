'use client';

import { createContext, useContext, useEffect, type RefObject } from 'react';
import { isFinePointer } from '../use-reduced-motion';

export const FlowReadyContext = createContext(false);

export function useFlowReady(): boolean {
  return useContext(FlowReadyContext);
}

export function useFocusWhenReady(ref: RefObject<HTMLElement | null>, enabled = true): void {
  const ready = useFlowReady();
  useEffect(() => {
    if (enabled && ready && isFinePointer()) ref.current?.focus();
  }, [enabled, ready, ref]);
}
