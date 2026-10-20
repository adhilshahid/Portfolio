'use client';

import { useCallback, useEffect, useId, useRef, useState, useSyncExternalStore } from 'react';
import {
  AnimatePresence,
  motion,
  useReducedMotion,
  useScroll,
  useTransform,
} from 'framer-motion';
import { useLenis } from 'lenis/react';

const HOPS = [
  { id: 'home', label: 'home' },
  { id: 'about', label: 'about' },
  { id: 'experience', label: 'experience' },
  { id: 'skill', label: 'skills' },
  { id: 'certification', label: 'certificates' },
  { id: 'contact', label: 'contact' },
] as const;

const LAST = HOPS.length - 1;
const SIZE = 64;
const C = SIZE / 2;
const R = 27;
const EASE_OUT: [number, number, number, number] = [0.16, 1, 0.3, 1];

/* ─── Kerala clock (minute resolution, client only) ─────────── */
const subscribeClock = (onChange: () => void) => {
  const id = window.setInterval(onChange, 15_000);
  return () => window.clearInterval(id);
};
const getMinute = () => Math.floor(Date.now() / 60_000);
const getServerMinute = () => null;
const timeFormatter = new Intl.DateTimeFormat('en-US', {
  timeZone: 'Asia/Kolkata',
  hour: 'numeric',
  minute: '2-digit',
});

const pad = (n: number) => String(n).padStart(2, '0');
// Server and client Math.cos/sin can differ in the last digit; round to keep hydration stable.
const round = (n: number) => Math.round(n * 1000) / 1000;

export default function TraceRoute() {
  const lenis = useLenis();
  const reduceMotion = useReducedMotion();
  const gradientId = useId();
  const panelId = useId();

  const [open, setOpen] = useState(false);
  const [current, setCurrent] = useState(0);
  // Where each section sits along the page, as a 0–1 fraction of total scroll.
  const [stops, setStops] = useState<number[]>(() => HOPS.map((_, i) => i / LAST));

  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const topsRef = useRef<number[]>([]);

  const { scrollYProgress } = useScroll();
  const packetRotate = useTransform(scrollYProgress, [0, 1], [0, 360]);

  const minute = useSyncExternalStore(subscribeClock, getMinute, getServerMinute);
  const localTime = minute === null ? null : timeFormatter.format(new Date(minute * 60_000));

  /* Track section positions + the hop currently in view */
  useEffect(() => {
    const locate = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      if (window.scrollY >= max - 2) {
        setCurrent(LAST);
        return;
      }
      const probe = window.scrollY + window.innerHeight * 0.4;
      let idx = 0;
      topsRef.current.forEach((top, i) => {
        if (top <= probe) idx = i;
      });
      setCurrent(idx);
    };

    const measure = () => {
      const max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
      const tops = HOPS.map(({ id }) => {
        if (id === 'home') return 0;
        const el = document.getElementById(id);
        return el ? el.getBoundingClientRect().top + window.scrollY : Infinity;
      });
      topsRef.current = tops;
      setStops(tops.map((top) => Math.min(1, top / max)));
      locate();
    };

    const frame = requestAnimationFrame(measure);
    const resizeObserver = new ResizeObserver(measure);
    resizeObserver.observe(document.body);
    window.addEventListener('scroll', locate, { passive: true });

    return () => {
      cancelAnimationFrame(frame);
      resizeObserver.disconnect();
      window.removeEventListener('scroll', locate);
    };
  }, []);

  /* Close on outside click / Escape */
  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false);
        buttonRef.current?.focus();
      }
    };
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  const goTo = useCallback(
    (index: number) => {
      const { id } = HOPS[index];
      const target = id === 'home' ? 0 : document.getElementById(id);
      if (target === null) return;
      if (lenis) {
        lenis.scrollTo(target, { duration: 1.4 });
      } else if (target === 0) {
        window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
      } else {
        target.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth' });
      }
      setOpen(false);
    },
    [lenis, reduceMotion],
  );

  return (
    <div
      ref={rootRef}
      className="fixed bottom-[124px] right-4 z-50 sm:right-6 lg:bottom-[43px] lg:right-10"
    >
      {/* ─── Dial ─────────────────────────────────────────────── */}
      <motion.button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls={panelId}
        aria-label={`Route: hop ${current + 1} of ${HOPS.length}, ${HOPS[current].label}. Open section map`}
        whileHover={reduceMotion ? undefined : { scale: 1.06 }}
        whileTap={reduceMotion ? undefined : { scale: 0.94 }}
        transition={{ type: 'spring', stiffness: 420, damping: 24 }}
        className="group relative block rounded-full outline-none focus-visible:ring-2 focus-visible:ring-[#FF6B35] focus-visible:ring-offset-2 focus-visible:ring-offset-[#050505]"
        style={{ width: SIZE, height: SIZE }}
      >
        {/* Glass body */}
        <span className="absolute inset-0 rounded-full border border-white/15 bg-white/[0.06] shadow-[inset_0_1.5px_0_rgba(255,255,255,0.3),0_12px_32px_-8px_rgba(0,0,0,0.7)] backdrop-blur-xl" />

        {/* Ring, hop nodes and scroll progress */}
        <svg
          viewBox={`0 0 ${SIZE} ${SIZE}`}
          className="absolute inset-0 -rotate-90 overflow-visible"
          aria-hidden="true"
        >
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#FF0080" />
              <stop offset="100%" stopColor="#FF6B35" />
            </linearGradient>
          </defs>
          <circle cx={C} cy={C} r={R} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth={2} />
          <motion.circle
            cx={C}
            cy={C}
            r={R}
            fill="none"
            stroke={`url(#${gradientId})`}
            strokeWidth={2}
            strokeLinecap="round"
            style={{ pathLength: scrollYProgress }}
          />
          {stops.map((stop, i) => {
            const angle = stop * Math.PI * 2;
            const reached = i <= current;
            return (
              <circle
                key={HOPS[i].id}
                cx={round(C + R * Math.cos(angle))}
                cy={round(C + R * Math.sin(angle))}
                r={2.25}
                fill={reached ? '#ffffff' : '#050505'}
                stroke={reached ? '#ffffff' : 'rgba(255,255,255,0.35)'}
                strokeWidth={1}
                className="transition-[fill,stroke] duration-500"
              />
            );
          })}
        </svg>

        {/* The packet travelling the route */}
        <motion.span
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          style={{ rotate: packetRotate }}
        >
          <span
            className="absolute left-1/2 h-[7px] w-[7px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#FF6B35] shadow-[0_0_10px_2px_rgba(255,0,128,0.75)]"
            style={{ top: C - R }}
          />
        </motion.span>

        {/* Hop counter */}
        <span className="relative flex h-full w-full flex-col items-center justify-center leading-none">
          <span className="font-mono text-[15px] font-semibold tabular-nums tracking-tight text-white">
            {pad(current + 1)}
          </span>
          <span className="mt-1 font-mono text-[8px] uppercase tracking-[0.2em] text-white/45">
            /{pad(HOPS.length)}
          </span>
        </span>
      </motion.button>

      {/* ─── Route panel ──────────────────────────────────────── */}
      <AnimatePresence>
        {open && (
          <motion.div
            id={panelId}
            role="region"
            aria-label="Section map"
            initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 10, scale: 0.96 }}
            animate={reduceMotion ? { opacity: 1 } : { opacity: 1, y: 0, scale: 1 }}
            exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 8, scale: 0.97 }}
            transition={{ duration: 0.28, ease: EASE_OUT }}
            style={{ transformOrigin: 'bottom right' }}
            className="absolute bottom-full right-0 mb-3 w-[min(264px,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-white/12 bg-[#0b0b0d]/85 p-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.12),0_24px_60px_-12px_rgba(0,0,0,0.85)] backdrop-blur-2xl"
          >
            <div className="flex items-center justify-between px-2 pb-2 pt-1.5 font-mono text-[11px]">
              <span className="text-white/80">
                <span className="text-[#FF0080]">$</span> traceroute adhil
                <span className="ml-0.5 inline-block h-3 w-[6px] translate-y-[2px] bg-white/70 motion-safe:animate-pulse" />
              </span>
              <span className="text-white/35">{HOPS.length} hops</span>
            </div>

            <nav aria-label="Page sections" className="relative border-t border-white/[0.07] pt-1.5">
              {/* Route line: dim track, lit up to the current hop */}
              <span
                aria-hidden="true"
                className="absolute left-[41px] top-[22px] bottom-[16px] w-px bg-white/10"
              >
                <motion.span
                  className="absolute inset-x-0 top-0 origin-top bg-gradient-to-b from-[#FF0080] to-[#FF6B35]"
                  initial={false}
                  animate={{ height: `${(current / LAST) * 100}%` }}
                  transition={{ duration: reduceMotion ? 0 : 0.5, ease: EASE_OUT }}
                />
              </span>

              <ol>
                {HOPS.map((hop, i) => {
                  const here = i === current;
                  const passed = i < current;
                  return (
                    <li key={hop.id}>
                      <button
                        type="button"
                        onClick={() => goTo(i)}
                        aria-current={here ? 'location' : undefined}
                        className="group/hop flex w-full items-center gap-3 rounded-lg px-2 py-[7px] text-left font-mono outline-none transition-colors hover:bg-white/[0.05] focus-visible:bg-white/[0.07] focus-visible:ring-1 focus-visible:ring-[#FF6B35]/70"
                      >
                        <span className="w-4 text-right text-[10px] tabular-nums text-white/30">
                          {i + 1}
                        </span>
                        <span className="relative z-[1] flex h-3 w-3 items-center justify-center">
                          {here && (
                            <span className="absolute inset-0 rounded-full bg-[#FF0080]/60 motion-safe:animate-ping" />
                          )}
                          <span
                            className={`relative block rounded-full transition-all duration-300 ${
                              here
                                ? 'h-2.5 w-2.5 bg-gradient-to-br from-[#FF0080] to-[#FF6B35]'
                                : passed
                                  ? 'h-[7px] w-[7px] bg-white/80'
                                  : 'h-[7px] w-[7px] border border-white/30 bg-[#0b0b0d] group-hover/hop:border-white/60'
                            }`}
                          />
                        </span>
                        <span
                          className={`text-[12px] transition-colors ${
                            here
                              ? 'text-white'
                              : passed
                                ? 'text-white/60 group-hover/hop:text-white'
                                : 'text-white/40 group-hover/hop:text-white/80'
                          }`}
                        >
                          {hop.label}
                        </span>
                        {here && (
                          <span className="ml-auto text-[10px] text-[#FF6B35]">you are here</span>
                        )}
                      </button>
                    </li>
                  );
                })}
              </ol>
            </nav>

            <div className="mt-1.5 flex items-center justify-between border-t border-white/[0.07] px-2 pb-1 pt-2.5 font-mono text-[10px] text-white/40">
              <span>origin · Kerala, IN</span>
              <span className="tabular-nums text-white/60">{localTime ? `${localTime} IST` : '—'}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
