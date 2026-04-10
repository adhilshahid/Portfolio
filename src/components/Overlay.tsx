'use client';

import { motion, useScroll, useTransform } from 'framer-motion';

export default function Overlay() {
  const { scrollYProgress } = useScroll({
    offset: ["start start", "end end"]
  });

  // Scale map so 0-1 is distributed across the 500vh:
  // 0% -> "Wired by experience." (center)
  // 30% -> "Coded by instinct." (left)
  // 60% -> "Now architecting the cloud." (right)

  // First text fades in immediately and out around 20%
  const opacity1 = useTransform(scrollYProgress, [0, 0.1, 0.2, 0.25], [0, 1, 1, 0]);
  const y1 = useTransform(scrollYProgress, [0, 0.25], [20, -50]);

  // Second text fades in at 25%, fully visible at 30%, fades out by 45%
  const opacity2 = useTransform(scrollYProgress, [0.25, 0.3, 0.4, 0.45], [0, 1, 1, 0]);
  const y2 = useTransform(scrollYProgress, [0.25, 0.45], [50, -50]);

  // Third text fades in at 50%, fully visible at 60%, fades out by 75%
  const opacity3 = useTransform(scrollYProgress, [0.5, 0.6, 0.7, 0.8], [0, 1, 1, 0]);
  const y3 = useTransform(scrollYProgress, [0.5, 0.8], [50, -50]);

  return (
    <div className="pointer-events-none absolute inset-0 w-full h-full">
      {/* 0% Center */}
      <motion.div 
        style={{ opacity: opacity1, y: y1 }}
        className="absolute inset-0 flex items-center justify-center p-8"
      >
        <h1 className="text-5xl md:text-7xl lg:text-8xl font-black text-white tracking-tighter drop-shadow-2xl text-center">
          Wired by <span className="text-zinc-400">experience.</span>
        </h1>
      </motion.div>

      {/* 30% Left */}
      <motion.div 
        style={{ opacity: opacity2, y: y2 }}
        className="absolute inset-0 flex items-center justify-start p-8 md:p-24"
      >
        <h2 className="text-4xl md:text-6xl lg:text-7xl font-bold text-white tracking-tight drop-shadow-xl max-w-2xl">
          Coded by <br/>
          <span className="italic font-light text-zinc-300">instinct.</span>
        </h2>
      </motion.div>

      {/* 60% Right */}
      <motion.div 
        style={{ opacity: opacity3, y: y3 }}
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
