'use client';

import { motion } from 'framer-motion';
import { useState } from 'react';

export default function NanoBanana() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="fixed bottom-8 right-8 z-50">
      <motion.div 
        className="relative flex items-center gap-4"
        animate={{ width: isOpen ? 'auto' : '56px' }}
        transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      >
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="hidden sm:flex bg-zinc-900/80 backdrop-blur-md border border-white/10 rounded-full px-6 py-3 items-center gap-4 shadow-2xl"
          >
            <span className="text-xs font-mono text-zinc-400">STATUS.</span>
            <span className="text-xs font-semibold tracking-wider text-green-400 flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
              ALL SYSTEMS ONLINE
            </span>
          </motion.div>
        )}

        <motion.button
          onClick={() => setIsOpen(!isOpen)}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="w-14 h-14 rounded-full bg-gradient-to-tr from-yellow-500 to-yellow-200 shadow-xl flex items-center justify-center border-2 border-[#050505] text-xl isolate relative overflow-hidden"
        >
          {/* subtle shine effect */}
          <div className="absolute inset-0 bg-gradient-to-b from-white/40 to-transparent mix-blend-overlay" />
          🍌
        </motion.button>
      </motion.div>
    </div>
  );
}
