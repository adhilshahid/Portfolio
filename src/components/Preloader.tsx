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
  const rotation = time * 0.15;
  const rays = 4;

  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(rotation);
  ctx.globalAlpha = Math.max(0, Math.min(1, opacity));

  for (let i = 0; i < rays; i++) {
    const angle = (i / rays) * Math.PI * 2;
    ctx.save();
    ctx.rotate(angle);

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
  scatterX: number;
  scatterY: number;
  angle: number;
  radius: number;
  radiusOffset: number;
  x: number;
  y: number;
  speed: number;
  size: number;
  opacity: number;
  impVx: number;
  impVy: number;
}

// ─── Phases ──────────────────────────────────────────────────────────────────
const PHASE_SCATTER = 0;   // 0 → 0.8s   ambient floating
const PHASE_FORM = 1;      // 0.8 → 2.2s  converge into ring
const PHASE_ORBIT = 2;     // 2.2 → ∞     ring orbits, waits for ENTER
const PHASE_IMPLODE = 3;   // click + 0 → 0.8s   particles inward
const PHASE_STAR = 4;      // click + 0.8 → 1.2s  star enlarges

const INTRO_TIMINGS = [800, 1400]; // scatter + form durations
const EXIT_TIMINGS = [800, 500];   // implode + star durations
const EXIT_DURATION = EXIT_TIMINGS[0] + EXIT_TIMINGS[1];

export default function Preloader() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isVisible, setIsVisible] = useState(true);
  const [textVisible, setTextVisible] = useState(false);
  const [buttonVisible, setButtonVisible] = useState(false);
  const [exiting, setExiting] = useState(false);

  // Shared ref so the canvas draw loop can read exit state
  const exitStartRef = useRef<number | null>(null);

  const mouseRef = useRef({ x: -9999, y: -9999, active: false });

  const handleMouseMove = useCallback((e: MouseEvent) => {
    mouseRef.current.x = e.clientX;
    mouseRef.current.y = e.clientY;
    mouseRef.current.active = true;
  }, []);

  const handleMouseLeave = useCallback(() => {
    mouseRef.current.active = false;
  }, []);

  // Show text + button after intro phases finish
  useEffect(() => {
    const introEnd = INTRO_TIMINGS[0] + INTRO_TIMINGS[1];
    const textTimer = setTimeout(() => setTextVisible(true), introEnd + 100);
    const btnTimer = setTimeout(() => setButtonVisible(true), introEnd + 1000);
    return () => {
      clearTimeout(textTimer);
      clearTimeout(btnTimer);
    };
  }, []);

  // Handle ENTER click
  const handleEnter = useCallback(() => {
    if (exiting) return;
    setExiting(true);
    setButtonVisible(false);
    setTextVisible(false);
    exitStartRef.current = performance.now();

    // Remove preloader after exit animation
    setTimeout(() => setIsVisible(false), EXIT_DURATION + 600);
  }, [exiting]);

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
    const baseRingRadius = Math.min(width, height) * 0.28;
    const particles: Particle[] = [];

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const scatterX = Math.random() * width;
      const scatterY = Math.random() * height;

      let angle: number;
      if (Math.random() > 0.35) {
        const clusterCenter = (Math.floor(Math.random() * 4) * Math.PI * 2) / 4;
        angle = clusterCenter + (Math.random() + Math.random() + Math.random() - 1.5) * 1.2;
      } else {
        angle = Math.random() * Math.PI * 2;
      }
      const radiusOffset = (Math.random() - 0.5) * 30;

      particles.push({
        scatterX, scatterY, angle,
        radius: baseRingRadius, radiusOffset,
        x: scatterX, y: scatterY,
        speed: 0.006 + Math.random() * 0.014,
        size: 0.15 + Math.random() * 0.85,
        opacity: 0.3 + Math.random() * 0.7,
        impVx: 0, impVy: 0,
      });
    }

    // ─── Glow particles ──────────────────────────────────────────────
    const GLOW_COUNT = 60;
    interface GlowParticle {
      angle: number; radius: number; speed: number;
      size: number; opacity: number; phase: number;
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

    // ─── Get current phase ───────────────────────────────────────────
    function getPhase(elapsed: number, now: number): [number, number] {
      // If exiting, compute exit phases
      const exitStart = exitStartRef.current;
      if (exitStart !== null) {
        const exitElapsed = now - exitStart;
        if (exitElapsed < EXIT_TIMINGS[0]) {
          return [PHASE_IMPLODE, exitElapsed / EXIT_TIMINGS[0]];
        } else {
          const starElapsed = exitElapsed - EXIT_TIMINGS[0];
          return [PHASE_STAR, Math.min(1, starElapsed / EXIT_TIMINGS[1])];
        }
      }

      // Intro phases
      if (elapsed < INTRO_TIMINGS[0]) {
        return [PHASE_SCATTER, elapsed / INTRO_TIMINGS[0]];
      }
      const formElapsed = elapsed - INTRO_TIMINGS[0];
      if (formElapsed < INTRO_TIMINGS[1]) {
        return [PHASE_FORM, formElapsed / INTRO_TIMINGS[1]];
      }
      // Stay in orbit forever
      return [PHASE_ORBIT, 0];
    }

    // ─── Draw frame ──────────────────────────────────────────────────
    const draw = (now: number) => {
      const elapsed = now - startTime;
      const [phase, rawProgress] = getPhase(elapsed, now);

      const trailAlpha = phase >= PHASE_IMPLODE ? 0.4 : 0.15;
      ctx.fillStyle = `rgba(5, 5, 5, ${trailAlpha})`;
      ctx.fillRect(0, 0, width, height);

      const mouse = mouseRef.current;

      if (phase === PHASE_SCATTER) {
        const drift = elapsed * 0.0003;
        particles.forEach((p, i) => {
          const noiseX = Math.sin(drift + i * 0.7) * 15;
          const noiseY = Math.cos(drift + i * 0.5) * 15;
          p.x += (p.scatterX + noiseX - p.x) * 0.03;
          p.y += (p.scatterY + noiseY - p.y) * 0.03;

          const fadeIn = Math.min(1, elapsed / 600);
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size * 0.6, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(255, 255, 255, ${p.opacity * 0.5 * fadeIn})`;
          ctx.fill();
        });

      } else if (phase === PHASE_FORM) {
        const t = easeInOutCubic(rawProgress);
        particles.forEach((p) => {
          const formAngle = p.angle + (1 - t) * 2;
          const ringX = centerX + Math.cos(formAngle) * (p.radius + p.radiusOffset);
          const ringY = centerY + Math.sin(formAngle) * (p.radius + p.radiusOffset);
          const targetX = p.scatterX + (ringX - p.scatterX) * t;
          const targetY = p.scatterY + (ringY - p.scatterY) * t;
          p.x += (targetX - p.x) * 0.12;
          p.y += (targetY - p.y) * 0.12;

          const brightness = 0.5 + t * 0.5;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size * (0.6 + t * 0.4), 0, Math.PI * 2);
          ctx.fillStyle = `rgba(255, 255, 255, ${p.opacity * brightness})`;
          ctx.fill();
        });

        if (t > 0.4) {
          const glowOpacity = (t - 0.4) / 0.6;
          const gradient = ctx.createRadialGradient(
            centerX, centerY, baseRingRadius - 30,
            centerX, centerY, baseRingRadius + 40
          );
          gradient.addColorStop(0, "rgba(255, 255, 255, 0)");
          gradient.addColorStop(0.5, `rgba(200, 220, 255, ${0.03 * glowOpacity})`);
          gradient.addColorStop(1, "rgba(255, 255, 255, 0)");
          ctx.fillStyle = gradient;
          ctx.fillRect(0, 0, width, height);
        }

      } else if (phase === PHASE_ORBIT) {
        particles.forEach((p) => {
          p.angle += p.speed;
          const baseX = centerX + Math.cos(p.angle) * (p.radius + p.radiusOffset);
          const baseY = centerY + Math.sin(p.angle) * (p.radius + p.radiusOffset);
          let targetX = baseX + (Math.random() - 0.5) * 3;
          let targetY = baseY + (Math.random() - 0.5) * 3;

          if (mouse.active) {
            const dx = mouse.x - baseX;
            const dy = mouse.y - baseY;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < 280) {
              const force = (280 - dist) / 280;
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

        glowParticles.forEach((g) => {
          g.angle += g.speed;
          const gx = centerX + Math.cos(g.angle) * g.radius;
          const gy = centerY + Math.sin(g.angle) * g.radius;
          const pulse = 0.5 + 0.5 * Math.sin(elapsed * 0.002 + g.phase);
          ctx.beginPath();
          ctx.arc(gx, gy, g.size * pulse, 0, Math.PI * 2);
          const grad = ctx.createRadialGradient(gx, gy, 0, gx, gy, g.size * pulse);
          grad.addColorStop(0, `rgba(180, 200, 255, ${g.opacity * pulse})`);
          grad.addColorStop(1, "rgba(180, 200, 255, 0)");
          ctx.fillStyle = grad;
          ctx.fill();
        });

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
        const t = easeInQuart(rawProgress);
        particles.forEach((p) => {
          const dx = centerX - p.x;
          const dy = centerY - p.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist > 2) {
            const accel = 0.05 + t * 0.3;
            p.impVx += (dx / dist) * accel;
            p.impVy += (dy / dist) * accel;
            p.impVx *= 0.96;
            p.impVy *= 0.96;
          }
          p.x += p.impVx;
          p.y += p.impVy;

          const shrink = Math.max(0.1, 1 - t * 0.7);
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size * shrink, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(255, 255, 255, ${Math.min(1, p.opacity + t * 0.4)})`;
          ctx.fill();
        });

        const starSize = 5 + t * 40;
        const starOpacity = 0.1 + t * 0.6;
        drawStar(ctx, centerX, centerY, starSize, starOpacity, elapsed * 0.001);

      } else if (phase === PHASE_STAR) {
        const t = easeOutExpo(rawProgress);
        const maxDim = Math.max(width, height);

        if (t < 0.4) {
          const pFade = 1 - t / 0.4;
          particles.forEach((p) => {
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size * pFade, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(255, 255, 255, ${p.opacity * pFade * 0.3})`;
            ctx.fill();
          });
        }

        const starSize = 45 + t * maxDim * 0.8;
        const starOpacity = Math.max(0, 0.7 - t * 0.7);
        drawStar(ctx, centerX, centerY, starSize, starOpacity, elapsed * 0.001);

        const haloSize = t * maxDim * 0.5;
        const haloGrad = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, haloSize || 1);
        haloGrad.addColorStop(0, `rgba(220, 230, 255, ${0.15 * (1 - t)})`);
        haloGrad.addColorStop(0.5, `rgba(200, 215, 255, ${0.05 * (1 - t)})`);
        haloGrad.addColorStop(1, "rgba(200, 215, 255, 0)");
        ctx.fillStyle = haloGrad;
        ctx.fillRect(0, 0, width, height);
      }

      animationFrameId = requestAnimationFrame(draw);
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

          {/* ─── Center content (text + button as one centered group) ── */}
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center text-center select-none pointer-events-none -translate-y-5">
            <motion.h1
              initial={{ opacity: 0, y: 18, filter: "blur(8px)", letterSpacing: "0.1em" }}
              animate={textVisible
                ? { opacity: 1, y: 0, filter: "blur(0px)", letterSpacing: "0.3em" }
                : { opacity: 0, y: -10, filter: "blur(6px)" }
              }
              transition={{ duration: 1.6, ease: [0.16, 1, 0.3, 1] }}
              className="text-sm md:text-lg font-bold tracking-[0.25em] text-white/90"
            >
              ADHIL SHAHID N
            </motion.h1>

            <motion.div
              initial={{ scaleX: 0, opacity: 0 }}
              animate={textVisible ? { scaleX: 1, opacity: 1 } : { scaleX: 0, opacity: 0 }}
              transition={{ duration: 1.4, delay: textVisible ? 0.5 : 0, ease: [0.16, 1, 0.3, 1] }}
              className="w-16 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent mt-3 origin-center"
            />

            <motion.p
              initial={{ opacity: 0, y: 12, filter: "blur(6px)" }}
              animate={textVisible
                ? { opacity: 1, y: 0, filter: "blur(0px)" }
                : { opacity: 0, y: -8, filter: "blur(6px)" }
              }
              transition={{ duration: 1.4, delay: textVisible ? 0.8 : 0, ease: [0.16, 1, 0.3, 1] }}
              className="mt-3 text-[10px] md:text-xs tracking-[0.5em] text-white/40 uppercase font-light"
            >
              Portfolio
            </motion.p>

            {/* ─── ENTER Button (absolute, won't displace text) ──── */}
            <AnimatePresence>
              {buttonVisible && (
                <motion.button
                  initial={{ opacity: 0, y: 24, scale: 0.92, filter: "blur(8px)" }}
                  animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
                  exit={{ opacity: 0, y: -10, scale: 0.95, filter: "blur(4px)" }}
                  transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
                  onClick={handleEnter}
                  className="enter-btn group absolute left-1/2 -translate-x-1/2 top-[calc(50%+50px)] px-10 py-3 rounded-full border border-white/[0.12] bg-white/[0.04] backdrop-blur-sm overflow-hidden pointer-events-auto transition-all duration-500 hover:border-white/25 hover:bg-white/[0.08] hover:shadow-[0_0_30px_rgba(255,255,255,0.06)] active:scale-95"
                >
                  {/* Shimmer sweep on hover */}
                  <span className="absolute inset-0 rounded-full overflow-hidden pointer-events-none">
                    <span className="absolute top-0 left-0 w-[200%] h-full bg-gradient-to-r from-transparent via-white/[0.07] to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out" />
                  </span>

                  {/* Top edge highlight */}
                  <span className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none" />

                  {/* Text */}
                  <span className="relative z-10 text-[11px] md:text-xs font-medium tracking-[0.35em] text-white/70 group-hover:text-white/90 transition-colors duration-500 uppercase">
                    Enter
                  </span>

                  {/* Subtle bottom glow on hover */}
                  <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1/2 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
                </motion.button>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
