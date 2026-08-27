"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import localFont from "next/font/local";
import { useEffect, useRef, useState } from "react";

const counterFont = localFont({
  src: "../fonts/helsinkixxl-black.otf",
  weight: "900",
  style: "normal",
  display: "swap",
});

const STAR_COUNT = 500;
const STAR_SPEED = 0.4;
const STAR_SPREAD = 2;
const STAR_FOCAL = 0.6;
const STAR_TWINKLE = 0.3;
const STAR_TRAIL = 0.3;
const STAR_SIZE = 0.5;
const FADE_IN_RANGE = 0.3;
const Z_NEAR = 0.12;
const Z_FAR = 0.98;
const OFFSCREEN_MARGIN = 50;

const COUNT_DURATION = 4_000;
const REDUCED_MOTION_DURATION = 800;
const COMPLETION_HOLD = 450;

interface Star {
  x: number;
  y: number;
  z: number;
  phase: number;
  twinkle: number;
  size: number;
}

function saturate(value: number) {
  return Math.max(0, Math.min(1, value));
}

function smoothstep(value: number) {
  return value * value * (3 - 2 * value);
}

function easeInOutQuint(value: number) {
  return value < 0.5
    ? 16 * value ** 5
    : 1 - (-2 * value + 2) ** 5 / 2;
}

function createStar(
  width: number,
  height: number,
  focalLength: number,
): Star {
  const z = Z_NEAR + Math.random() * (Z_FAR - Z_NEAR);
  const worldWidth = (width * z) / focalLength;
  const worldHeight = (height * z) / focalLength;

  return {
    x: (Math.random() - 0.5) * worldWidth * STAR_SPREAD,
    y: (Math.random() - 0.5) * worldHeight * STAR_SPREAD,
    z,
    phase: Math.random() * Math.PI * 2,
    twinkle: 0.5 + Math.random() * 1.5,
    size: STAR_SIZE * (0.6 + Math.random() * 0.8),
  };
}

function respawnStar(
  star: Star,
  width: number,
  height: number,
  focalLength: number,
) {
  const halfWidth = width / 2;
  const halfHeight = height / 2;
  const screenX =
    (Math.random() * 2 - 1) *
    (halfWidth * STAR_SPREAD + OFFSCREEN_MARGIN);
  const screenY =
    (Math.random() * 2 - 1) *
    (halfHeight * STAR_SPREAD + OFFSCREEN_MARGIN);

  star.z = Z_FAR;
  star.x = (screenX * star.z) / focalLength;
  star.y = (screenY * star.z) / focalLength;
  star.phase = Math.random() * Math.PI * 2;
  star.twinkle = 0.5 + Math.random() * 1.5;
  star.size = STAR_SIZE * (0.6 + Math.random() * 0.8);
}

export default function Preloader() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [progress, setProgress] = useState(0);
  const [isVisible, setIsVisible] = useState(true);
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    if (!isVisible) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const context = canvas.getContext("2d");
    if (!context) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    let animationFrameId = 0;
    let width = 1;
    let height = 1;
    let stars: Star[] = [];
    let lastProgress = -1;
    let lastTime = performance.now();
    const startTime = lastTime;
    const countDuration = prefersReducedMotion
      ? REDUCED_MOTION_DURATION
      : COUNT_DURATION;

    const resize = () => {
      width = Math.max(1, window.innerWidth);
      height = Math.max(1, window.innerHeight);
      const devicePixelRatio = Math.min(window.devicePixelRatio || 1, 2);

      canvas.width = Math.floor(width * devicePixelRatio);
      canvas.height = Math.floor(height * devicePixelRatio);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      context.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
      context.fillStyle = "#000000";
      context.fillRect(0, 0, width, height);

      const focalLength = Math.max(1, Math.min(width, height) * STAR_FOCAL);
      stars = Array.from({ length: STAR_COUNT }, () =>
        createStar(width, height, focalLength),
      );
    };

    const drawFrame = (now: number, deltaTime: number) => {
      const centerX = width / 2;
      const centerY = height / 2;
      const focalLength = Math.max(1, Math.min(width, height) * STAR_FOCAL);
      const depthSpan = Z_FAR - Z_NEAR;
      const fadeRange = Math.max(
        0.05,
        Math.min(FADE_IN_RANGE, depthSpan),
      );
      const inverseFadeRange = 1 / fadeRange;
      const twinkleTime = now * 0.0015;
      const speedFactor = prefersReducedMotion
        ? 0
        : deltaTime * STAR_SPEED * -0.7;

      context.globalCompositeOperation = "source-over";
      context.fillStyle = `rgba(0, 0, 0, ${1 - STAR_TRAIL})`;
      context.fillRect(0, 0, width, height);

      for (const star of stars) {
        star.z += speedFactor;

        if (star.z <= Z_NEAR) {
          respawnStar(star, width, height, focalLength);
          continue;
        }

        const inverseZ = 1 / star.z;
        const screenX = star.x * focalLength * inverseZ + centerX;
        const screenY = star.y * focalLength * inverseZ + centerY;

        if (
          screenX < -OFFSCREEN_MARGIN ||
          screenX > width + OFFSCREEN_MARGIN ||
          screenY < -OFFSCREEN_MARGIN ||
          screenY > height + OFFSCREEN_MARGIN
        ) {
          respawnStar(star, width, height, focalLength);
          continue;
        }

        const twinkle = saturate(
          0.65 +
            STAR_TWINKLE *
              0.35 *
              Math.sin(star.phase + twinkleTime * star.twinkle),
        );
        const farFade = (Z_FAR - star.z) * inverseFadeRange;
        const nearFade = (star.z - Z_NEAR) * inverseFadeRange;
        const visibility =
          smoothstep(saturate(farFade)) * smoothstep(saturate(nearFade));
        const size = star.size * inverseZ * visibility;
        const alpha = Math.min(1, 0.15 + twinkle * 0.9) * visibility;

        if (size < 0.1 || alpha < 0.01) continue;

        context.fillStyle = `rgba(255, 255, 255, ${alpha})`;
        if (size < 2) {
          context.fillRect(screenX, screenY, size, size);
        } else {
          context.beginPath();
          context.arc(screenX, screenY, size * 0.5, 0, Math.PI * 2);
          context.fill();
        }
      }
    };

    const animate = (now: number) => {
      const deltaTime = Math.min(0.05, (now - lastTime) / 1_000);
      const elapsed = now - startTime;
      lastTime = now;

      drawFrame(now, deltaTime);

      const rawProgress = saturate(elapsed / countDuration);
      const nextProgress = Math.min(
        100,
        Math.floor(easeInOutQuint(rawProgress) * 101),
      );

      if (nextProgress !== lastProgress) {
        lastProgress = nextProgress;
        setProgress(nextProgress);
      }

      if (elapsed >= countDuration + COMPLETION_HOLD) {
        setIsVisible(false);
        return;
      }

      animationFrameId = requestAnimationFrame(animate);
    };

    resize();
    window.addEventListener("resize", resize);
    animationFrameId = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("resize", resize);
      document.body.style.overflow = previousOverflow;
    };
  }, [isVisible, prefersReducedMotion]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{
            duration: prefersReducedMotion ? 0.2 : 0.8,
            ease: [0.22, 1, 0.36, 1],
          }}
          role="progressbar"
          aria-label="Loading portfolio"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={progress}
          className="fixed inset-0 z-[9999] flex items-center justify-center overflow-hidden bg-black pointer-events-auto"
        >
          <canvas
            ref={canvasRef}
            aria-hidden="true"
            className="absolute inset-0 h-full w-full"
          />

          <motion.span
            aria-hidden="true"
            initial={{ opacity: 0, scale: 0.94, filter: "blur(10px)" }}
            animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
            transition={{
              duration: prefersReducedMotion ? 0.15 : 0.9,
              ease: [0.16, 1, 0.3, 1],
            }}
            className={`${counterFont.className} relative z-10 min-w-[3ch] select-none bg-[linear-gradient(110deg,#ffffff_10%,#dcfaff_38%,#f7f8f8_64%,#ffd9d2_100%)] bg-clip-text text-center text-[clamp(6rem,22vw,18rem)] font-black leading-none tracking-[0.01em] text-transparent tabular-nums drop-shadow-[0_0_28px_rgba(255,255,255,0.08)]`}
          >
            {String(progress).padStart(2, "0")}
          </motion.span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
