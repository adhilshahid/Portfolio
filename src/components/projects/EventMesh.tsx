'use client';

import { useEffect, useRef } from 'react';

/**
 * Ambient "event bus" background: message packets travel along a dot lattice,
 * turning only at right angles and leaving fading trails, like traffic moving
 * through a queue-driven system.
 */

const CELL = 56;
const OFFSET = 1; // aligns packets with the CSS dot lattice (dots sit at 1px,1px)
const FADE = 0.075;

type Packet = {
  x: number;
  y: number;
  dx: number;
  dy: number;
  speed: number;
  color: string;
  toNode: number;
};

type Flash = { x: number; y: number; life: number; color: string };

function pickColor() {
  const r = Math.random();
  if (r < 0.6) return 'rgba(255,255,255,0.55)';
  if (r < 0.8) return '#FF0080';
  if (r < 0.93) return '#FF6B35';
  return '#38BDF8';
}

export default function EventMesh({ className = '' }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduceMotion) return;

    let width = 0;
    let height = 0;
    let packets: Packet[] = [];
    let flashes: Flash[] = [];
    let raf = 0;
    let last = 0;
    let running = false;
    let onScreen = false;

    const spawn = (anywhere: boolean): Packet => {
      const cols = Math.max(1, Math.floor(width / CELL));
      const rows = Math.max(1, Math.floor(height / CELL));
      const gy = Math.floor(Math.random() * rows);
      const gx = anywhere ? Math.floor(Math.random() * cols) : -1;
      return {
        x: gx * CELL + OFFSET,
        y: gy * CELL + OFFSET,
        dx: 1,
        dy: 0,
        speed: 45 + Math.random() * 90,
        color: pickColor(),
        toNode: CELL,
      };
    };

    const reset = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = rect.width;
      height = rect.height;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, width, height);
      const count = Math.min(70, Math.round((width * height) / (CELL * CELL * 14)));
      packets = Array.from({ length: count }, () => spawn(true));
      flashes = [];
    };

    const atNode = (p: Packet) => {
      const r = Math.random();
      if (r < 0.025) {
        flashes.push({ x: p.x, y: p.y, life: 1, color: p.color });
        Object.assign(p, spawn(false));
        return;
      }
      if (p.dx !== 0) {
        if (r < 0.2) {
          p.dy = Math.random() < 0.5 ? 1 : -1;
          p.dx = 0;
        }
      } else if (r < 0.5) {
        // Bias traffic back towards left-to-right flow
        p.dx = 1;
        p.dy = 0;
      }
    };

    const frame = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000 || 0);
      last = now;

      ctx.globalCompositeOperation = 'destination-out';
      ctx.fillStyle = `rgba(0,0,0,${FADE})`;
      ctx.fillRect(0, 0, width, height);
      ctx.globalCompositeOperation = 'lighter';

      ctx.lineCap = 'round';
      for (const p of packets) {
        let remaining = p.speed * dt;
        ctx.strokeStyle = p.color;
        ctx.lineWidth = 1.25;
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        while (remaining > 0) {
          const step = Math.min(remaining, p.toNode);
          p.x += p.dx * step;
          p.y += p.dy * step;
          p.toNode -= step;
          remaining -= step;
          ctx.lineTo(p.x, p.y);
          if (p.toNode <= 0) {
            p.toNode = CELL;
            const before = p.x;
            atNode(p);
            if (p.x !== before) {
              ctx.stroke();
              ctx.beginPath();
              ctx.moveTo(p.x, p.y);
            }
          }
        }
        ctx.stroke();

        ctx.fillStyle = p.color;
        ctx.fillRect(p.x - 1.25, p.y - 1.25, 2.5, 2.5);

        if (p.x > width + CELL || p.y < -CELL || p.y > height + CELL) {
          Object.assign(p, spawn(false));
        }
      }

      for (let i = flashes.length - 1; i >= 0; i--) {
        const f = flashes[i];
        f.life -= dt * 1.6;
        if (f.life <= 0) {
          flashes.splice(i, 1);
          continue;
        }
        const size = 4 + (1 - f.life) * 14;
        ctx.globalAlpha = f.life * 0.6;
        ctx.strokeStyle = f.color;
        ctx.lineWidth = 1;
        ctx.strokeRect(f.x - size / 2, f.y - size / 2, size, size);
        ctx.globalAlpha = 1;
      }

      raf = requestAnimationFrame(frame);
    };

    const start = () => {
      if (running || !onScreen || document.hidden) return;
      running = true;
      last = performance.now();
      raf = requestAnimationFrame(frame);
    };
    const stop = () => {
      running = false;
      cancelAnimationFrame(raf);
    };

    reset();

    const resizeObserver = new ResizeObserver(() => reset());
    resizeObserver.observe(canvas);

    const intersectionObserver = new IntersectionObserver(([entry]) => {
      onScreen = entry.isIntersecting;
      if (onScreen) start();
      else stop();
    });
    intersectionObserver.observe(canvas);

    const onVisibility = () => (document.hidden ? stop() : start());
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      stop();
      resizeObserver.disconnect();
      intersectionObserver.disconnect();
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, []);

  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none absolute inset-0 ${className}`}
      style={{
        maskImage:
          'linear-gradient(to bottom, transparent 0%, #000 14%, #000 86%, transparent 100%)',
        WebkitMaskImage:
          'linear-gradient(to bottom, transparent 0%, #000 14%, #000 86%, transparent 100%)',
      }}
    >
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.11) 1px, transparent 1.6px)',
          backgroundSize: `${CELL}px ${CELL}px`,
        }}
      />
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full opacity-70" />
    </div>
  );
}
