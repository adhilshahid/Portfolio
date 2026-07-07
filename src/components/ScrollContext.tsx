'use client';

import { createContext, useContext } from 'react';
import { MotionValue } from 'framer-motion';

const ScrollContext = createContext<MotionValue<number> | null>(null);

export const ScrollProvider = ScrollContext.Provider;

export function useHeroScroll() {
  return useContext(ScrollContext);
}
