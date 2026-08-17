'use client';

import React, { useEffect, useRef, useState, ReactNode } from 'react';
import { useScroll, useTransform, useMotionValueEvent } from 'framer-motion';
import { ScrollProvider } from './ScrollContext';

const FRAME_COUNT = 89;

interface ScrollyCanvasProps {
  children?: ReactNode;
}

export default function ScrollyCanvas({ children }: ScrollyCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null);
  
  // Track scroll progress purely within this container
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"]
  });
  
  const imagesRef = useRef<HTMLImageElement[]>([]);
  const [loaded, setLoaded] = useState(false);
  const rafIdRef = useRef<number | null>(null);
  const pendingIndexRef = useRef<number>(1);

  // Map 0-1 scroll progress to 1-89 frame index safely mapped
  const frameIndex = useTransform(scrollYProgress, [0, 1], [1, FRAME_COUNT]);

  const loadedCountRef = useRef(0);
  const [loadProgress, setLoadProgress] = useState(0);

  useEffect(() => {
    let isCanceled = false;

    // Pre-allocate slots so drawFrame can index by position immediately
    imagesRef.current = new Array(FRAME_COUNT);

    const loadOne = (i: number): Promise<void> => {
      return new Promise((resolve) => {
        const img = new Image();
        const paddedIndex = String(i).padStart(4, '0');
        img.src = `/sequence/${paddedIndex}.webp`;
        const done = () => {
          if (!isCanceled) {
            imagesRef.current[i - 1] = img;
            loadedCountRef.current += 1;
            setLoadProgress(Math.round((loadedCountRef.current / FRAME_COUNT) * 100));
          }
          resolve();
        };
        img.onload = done;
        img.onerror = done;
      });
    };

    const loadImages = async () => {
      // Phase 1: load 5 evenly-spaced keyframes first so scrubbing starts ASAP
      const keyframes = [1, 23, 45, 67, 89];
      await Promise.all(keyframes.map(loadOne));

      if (isCanceled) return;

      // Show canvas immediately after first keyframe — no more long wait
      setLoaded(true);
      drawFrame(1);

      // Phase 2: load the remaining frames in the background
      const rest = [];
      for (let i = 1; i <= FRAME_COUNT; i++) {
        if (!keyframes.includes(i)) rest.push(i);
      }
      await Promise.all(rest.map(loadOne));
    };

    loadImages();
    return () => {
      isCanceled = true;
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
      }
    };
  }, []);

  const drawFrame = (index: number) => {
    if (!canvasRef.current || !ctxRef.current) return;
    const canvas = canvasRef.current;
    const ctx = ctxRef.current;

    const adjustedIndex = Math.max(0, Math.min(index - 1, FRAME_COUNT - 1));
    let img = imagesRef.current[adjustedIndex];

    // If this frame slot isn't loaded yet (sparse array during Phase 2),
    // walk outward to find the nearest already-loaded frame
    if (!img || !img.complete || img.naturalWidth === 0) {
      for (let offset = 1; offset < FRAME_COUNT; offset++) {
        const lo = adjustedIndex - offset;
        const hi = adjustedIndex + offset;
        if (lo >= 0) {
          const candidate = imagesRef.current[lo];
          if (candidate && candidate.complete && candidate.naturalWidth > 0) { img = candidate; break; }
        }
        if (hi < FRAME_COUNT) {
          const candidate = imagesRef.current[hi];
          if (candidate && candidate.complete && candidate.naturalWidth > 0) { img = candidate; break; }
        }
      }
    }

    if (img && img.complete && img.naturalWidth > 0) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const ratio = Math.max(canvas.width / img.width, canvas.height / img.height);
      const newWidth = img.width * ratio;
      const newHeight = img.height * ratio;
      const offsetX = (canvas.width - newWidth) / 2;
      const offsetY = (canvas.height - newHeight) / 2;
      ctx.drawImage(img, offsetX, offsetY, newWidth, newHeight);
    }
  };

  const scheduleDraw = (index: number) => {
    pendingIndexRef.current = index;
    if (rafIdRef.current !== null) return;
    rafIdRef.current = requestAnimationFrame(() => {
      rafIdRef.current = null;
      drawFrame(pendingIndexRef.current);
    });
  };

  useMotionValueEvent(frameIndex, "change", (latest) => {
    if (loaded) {
      scheduleDraw(Math.floor(latest));
    }
  });

  useEffect(() => {
    const handleResize = () => {
      if (!canvasRef.current) return;
      canvasRef.current.width = window.innerWidth;
      canvasRef.current.height = window.innerHeight;
      ctxRef.current = canvasRef.current.getContext('2d');
      if (loaded) scheduleDraw(Math.floor(frameIndex.get()));
    };
    window.addEventListener('resize', handleResize);
    handleResize();
    return () => window.removeEventListener('resize', handleResize);
  }, [loaded]);

  return (
    <div ref={containerRef} className="relative h-[600vh] w-full bg-[#050505]">
      <div className="sticky top-0 left-0 h-screen w-full overflow-hidden">
        <canvas
          ref={canvasRef}
          className="block h-full w-full object-cover"
        />
        <div className="absolute inset-0 z-10">
          <ScrollProvider value={scrollYProgress}>
            {children}
          </ScrollProvider>
        </div>
        
        {!loaded && (
          <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-[#050505]/80 backdrop-blur-sm text-white/60 font-mono tracking-widest text-sm uppercase">
            <span className="mb-2 animate-pulse">Initializing Canvas Engine</span>
            <div className="h-0.5 w-48 bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-white transition-all duration-200 ease-out"
                style={{ width: `${loadProgress}%` }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
