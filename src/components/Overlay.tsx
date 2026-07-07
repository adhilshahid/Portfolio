'use client';

import { motion, useScroll, useTransform, useMotionValueEvent } from 'framer-motion';
import { useHeroScroll } from './ScrollContext';
import { useState } from 'react';

export default function Overlay() {
  const heroProgress = useHeroScroll();
  const { scrollYProgress: globalProgress } = useScroll({
    offset: ["start start", "end end"]
  });
  const scrollYProgress = heroProgress ?? globalProgress;

  // State-driven opacity for all three texts (avoids useTransform issues)
  const [o1, setO1] = useState(0);
  const [o2, setO2] = useState(0);
  const [o3, setO3] = useState(0);
  const [ty1, setTy1] = useState(20);
  const [ty2, setTy2] = useState(50);
  const [ty3, setTy3] = useState(50);

  useMotionValueEvent(scrollYProgress, "change", (p) => {
    // Text 1: 0-30%
    if (p <= 0.05) setO1(p / 0.05);
    else if (p <= 0.2) setO1(1);
    else if (p <= 0.3) setO1(1 - (p - 0.2) / 0.1);
    else setO1(0);
    setTy1(20 + (p / 0.3) * (-50 - 20));

    // Text 2: 28-60%
    if (p < 0.28) setO2(0);
    else if (p <= 0.35) setO2((p - 0.28) / 0.07);
    else if (p <= 0.5) setO2(1);
    else if (p <= 0.6) setO2(1 - (p - 0.5) / 0.1);
    else setO2(0);
    setTy2(50 + ((Math.max(0, p - 0.28)) / 0.32) * (-50 - 50));

    // Text 3: 58-92%
    if (p < 0.58) setO3(0);
    else if (p <= 0.65) setO3((p - 0.58) / 0.07);
    else if (p <= 0.82) setO3(1);
    else if (p <= 0.92) setO3(1 - (p - 0.82) / 0.1);
    else setO3(0);
    setTy3(50 + ((Math.max(0, p - 0.58)) / 0.34) * (-50 - 50));
  });

  return (
    <div className="pointer-events-none absolute inset-0 w-full h-full">
      {/* 0% Center */}
      <div 
        style={{ opacity: o1, transform: `translateY(${ty1}px)`, transition: 'none' }}
        className="absolute inset-0 flex items-center justify-center p-8"
      >
        <h1 className="text-5xl md:text-7xl lg:text-8xl font-black text-white tracking-tighter drop-shadow-2xl text-center">
          Wired by <span className="text-zinc-400">experience.</span>
        </h1>
      </div>

      {/* 30% Left */}
      <div 
        style={{ opacity: o2, transform: `translateY(${ty2}px)`, transition: 'none' }}
        className="absolute inset-0 flex items-center justify-start p-8 md:p-24"
      >
        <h2 className="text-4xl md:text-6xl lg:text-7xl font-bold text-white tracking-tight drop-shadow-xl max-w-2xl">
          Coded by <br/>
          <span className="italic font-light text-zinc-300">instinct.</span>
        </h2>
      </div>

      {/* 60% Right */}
      <div 
        style={{ opacity: o3, transform: `translateY(${ty3}px)`, transition: 'none' }}
        className="absolute inset-0 flex items-center justify-end p-8 md:p-24"
      >
        <h2 className="text-4xl md:text-6xl lg:text-7xl font-bold text-white tracking-tight drop-shadow-xl text-right max-w-2xl">
          Now architecting <br/>
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-zinc-200 to-zinc-600">
            the cloud.
          </span>
        </h2>
      </div>
    </div>
  );
}
