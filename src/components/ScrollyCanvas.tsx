'use client';

import React, { useEffect, useRef, useState, ReactNode } from 'react';
import { useScroll, useTransform, useMotionValueEvent } from 'framer-motion';

const FRAME_COUNT = 89;

interface ScrollyCanvasProps {
  children?: ReactNode;
}

export default function ScrollyCanvas({ children }: ScrollyCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // Track scroll progress purely within this container
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"]
  });
  
  const imagesRef = useRef<HTMLImageElement[]>([]);
  const [loaded, setLoaded] = useState(false);

  // Map 0-1 scroll progress to 1-89 frame index safely mapped
  const frameIndex = useTransform(scrollYProgress, [0, 1], [1, FRAME_COUNT]);

  useEffect(() => {
    let isCanceled = false;
    const loadImages = async () => {
      const promises = [];
      for (let i = 1; i <= FRAME_COUNT; i++) {
        const img = new Image();
        const paddedIndex = String(i).padStart(4, '0');
        img.src = `/sequence/${paddedIndex}.webp`;
        promises.push(
          new Promise((resolve) => {
            img.onload = () => resolve(img);
            // Ignore error for missing placeholder gracefully
            img.onerror = () => resolve(img);
          })
        );
        imagesRef.current.push(img);
      }
      await Promise.all(promises);
      if (!isCanceled) {
        setLoaded(true);
        drawFrame(1);
      }
    };

    loadImages();
    return () => { isCanceled = true; };
  }, []);

  const drawFrame = (index: number) => {
    if (!canvasRef.current || imagesRef.current.length === 0) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Use fallback array access gracefully
    const adjustedIndex = Math.max(0, Math.min(index - 1, FRAME_COUNT - 1));
    const img = imagesRef.current[adjustedIndex];
    if (img && img.complete && img.naturalWidth > 0) {
      // draw using cover strategy
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const ratio = Math.max(canvas.width / img.width, canvas.height / img.height);
      const newWidth = img.width * ratio;
      const newHeight = img.height * ratio;
      const offsetX = (canvas.width - newWidth) / 2;
      const offsetY = (canvas.height - newHeight) / 2;
      ctx.drawImage(img, offsetX, offsetY, newWidth, newHeight);
    }
  };

  useMotionValueEvent(frameIndex, "change", (latest) => {
    if (loaded) {
      drawFrame(Math.floor(latest));
    }
  });

  useEffect(() => {
    const handleResize = () => {
      if (!canvasRef.current) return;
      canvasRef.current.width = window.innerWidth;
      canvasRef.current.height = window.innerHeight;
      if (loaded) drawFrame(Math.floor(frameIndex.get()));
    };
    window.addEventListener('resize', handleResize);
    handleResize();
    return () => window.removeEventListener('resize', handleResize);
  }, [loaded]);

  return (
    <div ref={containerRef} className="relative h-[500vh] w-full bg-[#050505]">
      <div className="sticky top-0 left-0 h-screen w-full overflow-hidden">
        <canvas
          ref={canvasRef}
          className="block h-full w-full object-cover"
        />
        <div className="absolute inset-0 z-10">
          {children}
        </div>
        
        {!loaded && (
          <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-[#050505]/80 backdrop-blur-sm text-white/60 font-mono tracking-widest text-sm uppercase">
            <span className="mb-2 animate-pulse">Initializing Canvas Engine</span>
            <div className="h-0.5 w-48 bg-white/10 rounded-full overflow-hidden">
                <div className="h-full bg-white animate-pulse w-1/2"></div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
