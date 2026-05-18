"use client";

import React, { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function Preloader() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    // Fade out after 3.5 seconds
    const timer = setTimeout(() => {
      setIsVisible(false);
    }, 3000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!isVisible) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let width = window.innerWidth;
    let height = window.innerHeight;
    canvas.width = width;
    canvas.height = height;

    let centerX = width / 2;
    let centerY = height / 2;

    const particles: any[] = [];
    const PARTICLE_COUNT = 1000;

    let mouse = { x: -1000, y: -1000 };
    let isMouseActive = false;

    const handleMouseMove = (e: MouseEvent) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
      isMouseActive = true;
    };

    const handleMouseLeave = () => {
      isMouseActive = false;
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseout", handleMouseLeave);

    const handleResize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width;
      canvas.height = height;
      centerX = width / 2;
      centerY = height / 2;
    };
    window.addEventListener("resize", handleResize);

    const baseRingRadius = Math.min(width, height) * 0.23;

    // Initialize particles
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      let angle;
      if (Math.random() > 0.4) {
        // Cluster around 3 main anchor points for uneven distribution
        const clusterCenter = (Math.floor(Math.random() * 3) * Math.PI * 2) / 3;
        // Use multiple randoms to approximate a Gaussian distribution around the center
        angle = clusterCenter + (Math.random() + Math.random() + Math.random() - 1.5) * 1.5;
      } else {
        // Scatter the remaining particles evenly
        angle = Math.random() * Math.PI * 2;
      }

      // Spread them slightly around the ring to determine the band width
      const radiusOffset = (Math.random() - 0.5) * 25;
      particles.push({
        angle,
        radius: baseRingRadius + radiusOffset,
        speed: 0.008 + Math.random() * 0.015,
        size: 0.1 + Math.random() * 0.8,
        x: centerX + Math.cos(angle) * (baseRingRadius + radiusOffset),
        y: centerY + Math.sin(angle) * (baseRingRadius + radiusOffset),
      });
    }

    const draw = () => {
      // Clear with slight opacity for trailing effect
      ctx.fillStyle = "rgba(5, 5, 5, 0.2)";
      ctx.fillRect(0, 0, width, height);

      particles.forEach((p) => {
        p.angle += p.speed;

        // Calculate where the particle should be on its orbit
        const baseX = centerX + Math.cos(p.angle) * p.radius;
        const baseY = centerY + Math.sin(p.angle) * p.radius;

        let targetX = baseX + (Math.random() - 0.5) * 4;
        let targetY = baseY + (Math.random() - 0.5) * 4;

        // If mouse is near, pull particles towards it
        if (isMouseActive) {
          const dx = mouse.x - baseX;
          const dy = mouse.y - baseY;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const interactionRadius = 250;

          if (dist < interactionRadius) {
            const force = (interactionRadius - dist) / interactionRadius;
            // Gentle pull towards mouse (reduced strength)
            targetX = baseX + dx * force * 0.35;
            targetY = baseY + dy * force * 0.35;
          }
        }

        // Smoothly interpolate current position to target position
        p.x += (targetX - p.x) * 0.08;
        p.y += (targetY - p.y) * 0.08;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(255, 255, 255, 0.85)";
        ctx.fill();
      });

      animationFrameId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseout", handleMouseLeave);
      window.removeEventListener("resize", handleResize);
    };
  }, [isVisible]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1, ease: "easeInOut" }}
          className="fixed inset-0 z-[9999] bg-[#050505] flex items-center justify-center overflow-hidden cursor-none pointer-events-auto"
        >
          <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />

          <div className="relative z-10 flex flex-col items-center justify-center pointer-events-none text-center select-none">
            <h1 className="text-sm md:text-lg font-bold tracking-[0.25em] text-white/90">
              ADHIL SHAHID N
            </h1>
            <p className="mt-2 text-[10px] md:text-xs tracking-[0.4em] text-white/50 uppercase font-light">
              Portfolio
            </p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
