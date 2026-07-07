"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

// ─── Easing helpers ──────────────────────────────────────────────────────────
function easeInOutCubic(t: number) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}
function easeOutExpo(t: number) {
  return t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
}
function easeInQuart(t: number) {
  return t * t * t * t;
}

// ─── 4-pointed lens flare star ───────────────────────────────────────────────
function drawStar(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  size: number,
  opacity: number,
  time: number
) {
  const rotation = time * 0.15; // slow spin
  const rays = 4;

  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(rotation);
  ctx.globalAlpha = Math.max(0, Math.min(1, opacity));

  // Draw elongated rays
  for (let i = 0; i < rays; i++) {
    const angle = (i / rays) * Math.PI * 2;
    ctx.save();
    ctx.rotate(angle);

    // Each ray is a thin tapered gradient
    const rayLength = size;
    const rayWidth = size * 0.04;
    const grad = ctx.createLinearGradient(0, 0, rayLength, 0);
    grad.addColorStop(0, "rgba(255, 255, 255, 0.9)");
    grad.addColorStop(0.3, "rgba(220, 235, 255, 0.5)");
    grad.addColorStop(0.7, "rgba(200, 220, 255, 0.15)");
    grad.addColorStop(1, "rgba(200, 220, 255, 0)");

    ctx.beginPath();
    ctx.moveTo(0, -rayWidth);
    ctx.lineTo(rayLength, 0);
    ctx.lineTo(0, rayWidth);
    ctx.closePath();
    ctx.fillStyle = grad;
    ctx.fill();

    // Mirror ray in opposite direction
    const grad2 = ctx.createLinearGradient(0, 0, -rayLength, 0);
    grad2.addColorStop(0, "rgba(255, 255, 255, 0.9)");
    grad2.addColorStop(0.3, "rgba(220, 235, 255, 0.5)");
    grad2.addColorStop(0.7, "rgba(200, 220, 255, 0.15)");
    grad2.addColorStop(1, "rgba(200, 220, 255, 0)");

    ctx.beginPath();
    ctx.moveTo(0, -rayWidth);
    ctx.lineTo(-rayLength, 0);
    ctx.lineTo(0, rayWidth);
    ctx.closePath();
    ctx.fillStyle = grad2;
    ctx.fill();

    ctx.restore();
  }

  // Bright center core
  const coreGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, size * 0.15);
  coreGrad.addColorStop(0, "rgba(255, 255, 255, 1)");
  coreGrad.addColorStop(0.5, "rgba(220, 235, 255, 0.4)");
  coreGrad.addColorStop(1, "rgba(200, 220, 255, 0)");
  ctx.beginPath();
  ctx.arc(0, 0, size * 0.15, 0, Math.PI * 2);
  ctx.fillStyle = coreGrad;
  ctx.fill();

  ctx.globalAlpha = 1;
  ctx.restore();
}

// ─── Interfaces ──────────────────────────────────────────────────────────────
interface Particle {
  // Scatter phase (initial random positions)
  scatterX: number;
  scatterY: number;
  // Ring formation target
  angle: number;
  radius: number;
  radiusOffset: number;
  // Runtime
  x: number;
  y: number;
  speed: number;
  size: number;
  opacity: number;
  // Implosion
  impVx: number;
  impVy: number;
}

// ─── Phases ──────────────────────────────────────────────────────────────────
const PHASE_SCATTER = 0;       // 0 → 0.8s   ambient floating particles
const PHASE_FORM = 1;          // 0.8 → 2.2s  converge into ring
const PHASE_ORBIT = 2;         // 2.2 → 3.6s  ring orbits, text appears
const PHASE_IMPLODE = 3;       // 3.6 → 4.4s  particles accelerate inward
const PHASE_FLASH = 4;         // 4.4 → 4.8s  white flash + exit

const TIMINGS = [800, 1400, 1400, 800, 400]; // duration of each phase in ms
const TOTAL_DURATION = TIMINGS.reduce((a, b) => a + b, 0); // 4800ms

export default function Preloader() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isVisible, setIsVisible] = useState(true);
  const [textVisible, setTextVisible] = useState(false);

  // Track mouse for interactive magnetic pull
  const mouseRef = useRef({ x: -9999, y: -9999, active: false });

  const handleMouseMove = useCallback((e: MouseEvent) => {
    mouseRef.current.x = e.clientX;
    mouseRef.current.y = e.clientY;
    mouseRef.current.active = true;
  }, []);

  const handleMouseLeave = useCallback(() => {
    mouseRef.current.active = false;
  }, []);

  // Phase-based timeline
  useEffect(() => {
    // Show text during orbit phase
    const textTimer = setTimeout(() => setTextVisible(true), TIMINGS[0] + TIMINGS[1] + 200);
    // Hide preloader
    const exitTimer = setTimeout(() => setIsVisible(false), TOTAL_DURATION);

    return () => {
      clearTimeout(textTimer);
      clearTimeout(exitTimer);
    };
  }, []);

  // Canvas animation
  useEffect(() => {
    if (!isVisible) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let width = window.innerWidth;
    let height = window.innerHeight;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.scale(dpr, dpr);

    let centerX = width / 2;
    let centerY = height / 2;

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseout", handleMouseLeave);

    const handleResize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.scale(dpr, dpr);
      centerX = width / 2;
      centerY = height / 2;
    };
    window.addEventListener("resize", handleResize);

    // ─── Create particles ────────────────────────────────────────────
    const PARTICLE_COUNT = 1200;
    const baseRingRadius = Math.min(width, height) * 0.22;
    const particles: Particle[] = [];

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      // Scattered starting positions (full screen, random)
      const scatterX = Math.random() * width;
      const scatterY = Math.random() * height;

      // Ring target — clustered distribution for organic feel
      let angle: number;
      if (Math.random() > 0.35) {
        const clusterCenter = (Math.floor(Math.random() * 4) * Math.PI * 2) / 4;
        angle = clusterCenter + (Math.random() + Math.random() + Math.random() - 1.5) * 1.2;
      } else {
        angle = Math.random() * Math.PI * 2;
      }
      const radiusOffset = (Math.random() - 0.5) * 30;

      particles.push({
        scatterX,
        scatterY,
        angle,
        radius: baseRingRadius,
        radiusOffset,
        x: scatterX,
        y: scatterY,
        speed: 0.006 + Math.random() * 0.014,
        size: 0.15 + Math.random() * 0.85,
        opacity: 0.3 + Math.random() * 0.7,
        impVx: 0,
        impVy: 0,
      });
    }

    // ─── Glow particles (larger, softer, fewer — for bloom) ─────────
    const GLOW_COUNT = 60;
    interface GlowParticle {
      angle: number;
      radius: number;
      speed: number;
      size: number;
      opacity: number;
      phase: number;
    }
    const glowParticles: GlowParticle[] = [];
    for (let i = 0; i < GLOW_COUNT; i++) {
      glowParticles.push({
        angle: Math.random() * Math.PI * 2,
        radius: baseRingRadius + (Math.random() - 0.5) * 50,
        speed: 0.003 + Math.random() * 0.008,
        size: 4 + Math.random() * 12,
        opacity: 0.02 + Math.random() * 0.06,
        phase: Math.random() * Math.PI * 2,
      });
    }

    const startTime = performance.now();

    // ─── Get current phase and local progress ────────────────────────
    function getPhase(elapsed: number): [number, number] {
      let acc = 0;
      for (let i = 0; i < TIMINGS.length; i++) {
        if (elapsed < acc + TIMINGS[i]) {
          return [i, (elapsed - acc) / TIMINGS[i]];
        }
        acc += TIMINGS[i];
      }
      return [PHASE_FLASH, 1];
    }

    // ─── Draw frame ──────────────────────────────────────────────────
    const draw = (now: number) => {
      const elapsed = now - startTime;
      const [phase, rawProgress] = getPhase(elapsed);

      // Clear with trail effect (shorter trail in later phases for crispness)
      const trailAlpha = phase >= PHASE_IMPLODE ? 0.4 : 0.15;
      ctx.fillStyle = `rgba(5, 5, 5, ${trailAlpha})`;
      ctx.fillRect(0, 0, width, height);

      const mouse = mouseRef.current;

      // ── Phase-specific particle logic ──────────────────────────────
      if (phase === PHASE_SCATTER) {
        // Ambient floating — particles drift slightly from scatter positions
        const drift = elapsed * 0.0003;
        particles.forEach((p, i) => {
          const noiseX = Math.sin(drift + i * 0.7) * 15;
          const noiseY = Math.cos(drift + i * 0.5) * 15;
          p.x += (p.scatterX + noiseX - p.x) * 0.03;
          p.y += (p.scatterY + noiseY - p.y) * 0.03;

          // Fade in
          const fadeIn = Math.min(1, elapsed / 600);
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size * 0.6, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(255, 255, 255, ${p.opacity * 0.5 * fadeIn})`;
          ctx.fill();
        });
      } else if (phase === PHASE_FORM) {
        // Converge from scatter positions to ring — beautiful swirl
        const t = easeInOutCubic(rawProgress);
        particles.forEach((p) => {
          // Spin angle slightly during formation for swirl effect
          const formAngle = p.angle + (1 - t) * 2;
          const ringX = centerX + Math.cos(formAngle) * (p.radius + p.radiusOffset);
          const ringY = centerY + Math.sin(formAngle) * (p.radius + p.radiusOffset);

          // Lerp from scatter to ring
          const targetX = p.scatterX + (ringX - p.scatterX) * t;
          const targetY = p.scatterY + (ringY - p.scatterY) * t;

          p.x += (targetX - p.x) * 0.12;
          p.y += (targetY - p.y) * 0.12;

          // Draw with increasing brightness
          const brightness = 0.5 + t * 0.5;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size * (0.6 + t * 0.4), 0, Math.PI * 2);
          ctx.fillStyle = `rgba(255, 255, 255, ${p.opacity * brightness})`;
          ctx.fill();
        });

        // Draw ring glow as it forms
        if (t > 0.4) {
          const glowOpacity = (t - 0.4) / 0.6;
          const gradient = ctx.createRadialGradient(
            centerX, centerY, baseRingRadius - 30,
            centerX, centerY, baseRingRadius + 40
          );
          gradient.addColorStop(0, `rgba(255, 255, 255, 0)`);
          gradient.addColorStop(0.5, `rgba(200, 220, 255, ${0.03 * glowOpacity})`);
          gradient.addColorStop(1, `rgba(255, 255, 255, 0)`);
          ctx.fillStyle = gradient;
          ctx.fillRect(0, 0, width, height);
        }
      } else if (phase === PHASE_ORBIT) {
        // Full ring — particles orbit, mouse interacts
        particles.forEach((p) => {
          p.angle += p.speed;

          const baseX = centerX + Math.cos(p.angle) * (p.radius + p.radiusOffset);
          const baseY = centerY + Math.sin(p.angle) * (p.radius + p.radiusOffset);

          let targetX = baseX + (Math.random() - 0.5) * 3;
          let targetY = baseY + (Math.random() - 0.5) * 3;

          // Mouse magnetic pull
          if (mouse.active) {
            const dx = mouse.x - baseX;
            const dy = mouse.y - baseY;
            const dist = Math.sqrt(dx * dx + dy * dy);
            const interactionRadius = 280;
            if (dist < interactionRadius) {
              const force = (interactionRadius - dist) / interactionRadius;
              targetX = baseX + dx * force * 0.4;
              targetY = baseY + dy * force * 0.4;
            }
          }

          p.x += (targetX - p.x) * 0.08;
          p.y += (targetY - p.y) * 0.08;

          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(255, 255, 255, ${p.opacity * 0.9})`;
          ctx.fill();
        });

        // Orbital glow particles (bloom layer)
        glowParticles.forEach((g) => {
          g.angle += g.speed;
          const gx = centerX + Math.cos(g.angle) * g.radius;
          const gy = centerY + Math.sin(g.angle) * g.radius;
          const pulse = 0.5 + 0.5 * Math.sin(elapsed * 0.002 + g.phase);

          ctx.beginPath();
          ctx.arc(gx, gy, g.size * pulse, 0, Math.PI * 2);
          const grad = ctx.createRadialGradient(gx, gy, 0, gx, gy, g.size * pulse);
          grad.addColorStop(0, `rgba(180, 200, 255, ${g.opacity * pulse})`);
          grad.addColorStop(1, `rgba(180, 200, 255, 0)`);
          ctx.fillStyle = grad;
          ctx.fill();
        });

        // Subtle ring glow
        const ringGlow = ctx.createRadialGradient(
          centerX, centerY, baseRingRadius - 40,
          centerX, centerY, baseRingRadius + 50
        );
        ringGlow.addColorStop(0, "rgba(255, 255, 255, 0)");
        ringGlow.addColorStop(0.45, "rgba(180, 200, 255, 0.015)");
        ringGlow.addColorStop(0.55, "rgba(200, 220, 255, 0.02)");
        ringGlow.addColorStop(1, "rgba(255, 255, 255, 0)");
        ctx.fillStyle = ringGlow;
        ctx.fillRect(0, 0, width, height);

        // Light streak that sweeps around the ring
        const streakAngle = (elapsed * 0.002) % (Math.PI * 2);
        const streakX = centerX + Math.cos(streakAngle) * baseRingRadius;
        const streakY = centerY + Math.sin(streakAngle) * baseRingRadius;
        const streakGrad = ctx.createRadialGradient(streakX, streakY, 0, streakX, streakY, 60);
        streakGrad.addColorStop(0, "rgba(255, 255, 255, 0.12)");
        streakGrad.addColorStop(0.3, "rgba(200, 220, 255, 0.06)");
        streakGrad.addColorStop(1, "rgba(255, 255, 255, 0)");
        ctx.fillStyle = streakGrad;
        ctx.fillRect(0, 0, width, height);

      } else if (phase === PHASE_IMPLODE) {
        // Particles accelerate toward center
        const t = easeInQuart(rawProgress);

        particles.forEach((p) => {
          // Accelerate toward center
          const dx = centerX - p.x;
          const dy = centerY - p.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist > 2) {
            const accel = 0.05 + t * 0.3;
            p.impVx += (dx / dist) * accel;
            p.impVy += (dy / dist) * accel;
            // Dampen slightly
            p.impVx *= 0.96;
            p.impVy *= 0.96;
          }

          p.x += p.impVx;
          p.y += p.impVy;

          // Shrink and brighten as they converge
          const shrink = Math.max(0.1, 1 - t * 0.7);
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size * shrink, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(255, 255, 255, ${Math.min(1, p.opacity + t * 0.4)})`;
          ctx.fill();
        });

        // ── Shining star forming at center ──
        const starSize = 5 + t * 40;
        const starOpacity = 0.1 + t * 0.6;
        drawStar(ctx, centerX, centerY, starSize, starOpacity, elapsed * 0.001);

      } else if (phase === PHASE_FLASH) {
        // Star enlarges and fills the screen, then fades
        const t = easeOutExpo(rawProgress);
        const maxDim = Math.max(width, height);

        // Particles fade away quickly
        if (t < 0.4) {
          const pFade = 1 - t / 0.4;
          particles.forEach((p) => {
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size * pFade, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(255, 255, 255, ${p.opacity * pFade * 0.3})`;
            ctx.fill();
          });
        }

        // Star grows large
        const starSize = 45 + t * maxDim * 0.8;
        const starOpacity = Math.max(0, 0.7 - t * 0.7);
        drawStar(ctx, centerX, centerY, starSize, starOpacity, elapsed * 0.001);

        // Soft halo behind the star
        const haloSize = t * maxDim * 0.5;
        const haloGrad = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, haloSize || 1);
        haloGrad.addColorStop(0, `rgba(220, 230, 255, ${0.15 * (1 - t)})`);
        haloGrad.addColorStop(0.5, `rgba(200, 215, 255, ${0.05 * (1 - t)})`);
        haloGrad.addColorStop(1, "rgba(200, 215, 255, 0)");
        ctx.fillStyle = haloGrad;
        ctx.fillRect(0, 0, width, height);
      }

      if (elapsed < TOTAL_DURATION) {
        animationFrameId = requestAnimationFrame(draw);
      }
    };

    animationFrameId = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseout", handleMouseLeave);
      window.removeEventListener("resize", handleResize);
    };
  }, [isVisible, handleMouseMove, handleMouseLeave]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="fixed inset-0 z-[9999] bg-[#050505] flex items-center justify-center overflow-hidden cursor-none pointer-events-auto"
        >
          <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />

          {/* ─── Center text ─────────────────────────────────────── */}
          <div className="relative z-10 flex flex-col items-center justify-center pointer-events-none text-center select-none">
            <motion.h1
              initial={{ opacity: 0, y: 12, letterSpacing: "0.15em" }}
              animate={textVisible ? { opacity: 1, y: 0, letterSpacing: "0.3em" } : {}}
              transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
              className="text-sm md:text-lg font-bold tracking-[0.25em] text-white/90"
            >
              ADHIL SHAHID N
            </motion.h1>

            {/* Thin decorative line */}
            <motion.div
              initial={{ scaleX: 0, opacity: 0 }}
              animate={textVisible ? { scaleX: 1, opacity: 1 } : {}}
              transition={{ duration: 1, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
              className="w-16 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent mt-3 origin-center"
            />

            <motion.p
              initial={{ opacity: 0, y: 8 }}
              animate={textVisible ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 1, delay: 0.5, ease: [0.22, 1, 0.36, 1] }}
              className="mt-3 text-[10px] md:text-xs tracking-[0.5em] text-white/40 uppercase font-light"
            >
              Portfolio
            </motion.p>
          </div>


        </motion.div>
      )}
    </AnimatePresence>
  );
}
