'use client';

import { useEffect, useRef } from 'react';
import { useScroll } from 'framer-motion';
import { useHeroScroll } from './ScrollContext';

export default function Overlay() {
  const heroProgress = useHeroScroll();
  const { scrollYProgress: globalProgress } = useScroll({
    offset: ["start start", "end end"]
  });
  const scrollYProgress = heroProgress ?? globalProgress;

  const ref1 = useRef<HTMLDivElement>(null);
  const ref2 = useRef<HTMLDivElement>(null);
  const ref3 = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const updateStyles = (p: number) => {
      // Text 1: 0.00 -> 0.30
      if (ref1.current) {
        let o1 = 0;
        if (p <= 0.05) o1 = p / 0.05;
        else if (p <= 0.22) o1 = 1;
        else if (p <= 0.30) o1 = 1 - (p - 0.22) / 0.08;
        else o1 = 0;
        const ty1 = 20 + (Math.min(p, 0.30) / 0.30) * (-50 - 20);
        ref1.current.style.opacity = String(o1);
        ref1.current.style.transform = `translate3d(0, ${ty1}px, 0)`;
      }

      // Text 2: 0.25 -> 0.55
      if (ref2.current) {
        let o2 = 0;
        if (p < 0.25) o2 = 0;
        else if (p <= 0.32) o2 = (p - 0.25) / 0.07;
        else if (p <= 0.48) o2 = 1;
        else if (p <= 0.55) o2 = 1 - (p - 0.48) / 0.07;
        else o2 = 0;
        const p2Norm = Math.max(0, Math.min(1, (p - 0.25) / 0.30));
        const ty2 = 50 + p2Norm * (-50 - 50);
        ref2.current.style.opacity = String(o2);
        ref2.current.style.transform = `translate3d(0, ${ty2}px, 0)`;
      }

      // Text 3: 0.48 -> 1.00
      if (ref3.current) {
        let o3 = 0;
        if (p < 0.48) o3 = 0;
        else if (p <= 0.56) o3 = (p - 0.48) / 0.08;
        else if (p <= 0.94) o3 = 1;
        else if (p <= 1.00) o3 = 1 - (p - 0.94) / 0.06;
        else o3 = 0;
        const p3Norm = Math.max(0, Math.min(1, (p - 0.48) / 0.52));
        const ty3 = 50 + p3Norm * (-50 - 50);
        ref3.current.style.opacity = String(o3);
        ref3.current.style.transform = `translate3d(0, ${ty3}px, 0)`;
      }
    };

    updateStyles(scrollYProgress.get());
    return scrollYProgress.on('change', updateStyles);
  }, [scrollYProgress]);

  return (
    <div className="pointer-events-none absolute inset-0 w-full h-full">
      {/* 0% Center */}
      <div 
        ref={ref1}
        style={{ opacity: 0, transform: 'translate3d(0, 20px, 0)', transition: 'none' }}
        className="absolute inset-0 flex items-center justify-center p-6 sm:p-12"
      >
        <h1 className="text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-black text-white tracking-tighter drop-shadow-2xl text-center">
          Wired by <span className="text-zinc-400">experience.</span>
        </h1>
      </div>

      {/* 30% Left */}
      <div 
        ref={ref2}
        style={{ opacity: 0, transform: 'translate3d(0, 50px, 0)', transition: 'none' }}
        className="absolute inset-0 flex items-center justify-start p-6 sm:p-12 md:p-24"
      >
        <h2 className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-white tracking-tight drop-shadow-xl max-w-2xl">
          Coded by <br/>
          <span className="italic font-light text-zinc-300">instinct.</span>
        </h2>
      </div>

      {/* 60% Right */}
      <div 
        ref={ref3}
        style={{ opacity: 0, transform: 'translate3d(0, 50px, 0)', transition: 'none' }}
        className="absolute inset-0 flex items-center justify-end p-6 sm:p-12 md:p-24"
      >
        <h2 className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-white tracking-tight drop-shadow-xl text-right max-w-2xl">
          Now architecting <br/>
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-zinc-200 to-zinc-400">
            the cloud.
          </span>
        </h2>
      </div>
    </div>
  );
}
