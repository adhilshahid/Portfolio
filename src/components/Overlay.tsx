'use client';

import { motion, useScroll, useTransform } from 'framer-motion';
import { useHeroScroll } from './ScrollContext';

export default function Overlay() {
  const heroProgress = useHeroScroll();
  const { scrollYProgress: globalProgress } = useScroll({
    offset: ["start start", "end end"]
  });
  const scrollYProgress = heroProgress ?? globalProgress;

  // GPU-accelerated motion values (zero React re-renders on scroll)
  const o1 = useTransform(scrollYProgress, [0, 0.05, 0.2, 0.3], [0, 1, 1, 0]);
  const ty1 = useTransform(scrollYProgress, [0, 0.3], [20, -50]);

  const o2 = useTransform(scrollYProgress, [0, 0.28, 0.35, 0.5, 0.6], [0, 0, 1, 1, 0]);
  const ty2 = useTransform(scrollYProgress, [0, 0.28, 0.6], [50, 50, -50]);

  const o3 = useTransform(scrollYProgress, [0, 0.58, 0.65, 0.82, 0.92], [0, 0, 1, 1, 0]);
  const ty3 = useTransform(scrollYProgress, [0, 0.58, 0.92], [50, 50, -50]);

  return (
    <div className="pointer-events-none absolute inset-0 w-full h-full">
      {/* 0% Center */}
      <motion.div 
        style={{ opacity: o1, y: ty1 }}
        className="absolute inset-0 flex items-center justify-center p-8"
      >
        <h1 className="text-5xl md:text-7xl lg:text-8xl font-black text-white tracking-tighter drop-shadow-2xl text-center">
          Wired by <span className="text-zinc-400">experience.</span>
        </h1>
      </motion.div>

      {/* 30% Left */}
      <motion.div 
        style={{ opacity: o2, y: ty2 }}
        className="absolute inset-0 flex items-center justify-start p-8 md:p-24"
      >
        <h2 className="text-4xl md:text-6xl lg:text-7xl font-bold text-white tracking-tight drop-shadow-xl max-w-2xl">
          Coded by <br/>
          <span className="italic font-light text-zinc-300">instinct.</span>
        </h2>
      </motion.div>

      {/* 60% Right */}
      <motion.div 
        style={{ opacity: o3, y: ty3 }}
        className="absolute inset-0 flex items-center justify-end p-8 md:p-24"
      >
        <h2 className="text-4xl md:text-6xl lg:text-7xl font-bold text-white tracking-tight drop-shadow-xl text-right max-w-2xl">
          Now architecting <br/>
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-zinc-200 to-zinc-600">
            the cloud.
          </span>
        </h2>
      </motion.div>
    </div>
  );
}
