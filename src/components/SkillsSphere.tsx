'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { Bebas_Neue } from 'next/font/google';
import { motion, useInView } from 'framer-motion';

const bebasNeue = Bebas_Neue({
  weight: '400',
  subsets: ['latin'],
  display: 'swap',
});

export interface Skill {
  name: string;
  icon: string;
}

export const SKILLS: Skill[] = [
  { name: 'Aruba Networks', icon: '/svg/aruba.svg' },
  { name: 'Cisco', icon: '/svg/cisco.svg' },
  { name: 'Fortinet', icon: '/svg/fortinet.svg' },
  { name: 'Wireless', icon: '/svg/wireless.svg' },
  { name: 'Infoblox', icon: '/svg/infoblox.svg' },
  { name: 'UltraDNS', icon: '/svg/ultradns.svg' },
  { name: 'HPE ClearPass', icon: '/svg/clearpass.svg' },
  { name: 'Spectrum', icon: '/svg/spectrum.svg' },
  { name: 'AWS', icon: '/svg/aws.svg' },
  { name: 'Azure', icon: '/svg/azure.svg' },
  { name: 'Python', icon: '/svg/python.svg' },
  { name: 'Java', icon: '/svg/java.svg' },
  { name: 'JavaScript', icon: '/svg/javascript.svg' },
  { name: 'Node.js', icon: '/svg/nodejs.svg' },
  { name: 'MongoDB', icon: '/svg/mongodb.svg' },
  { name: 'MySQL', icon: '/svg/mysql.svg' },
  { name: 'Git', icon: '/svg/git.svg' },
  { name: 'GitHub', icon: '/svg/github.svg' },
  { name: 'ServiceNow', icon: '/svg/servicenow.svg' },
  { name: 'Splunk', icon: '/svg/splunk.svg' },
  { name: 'New Relic', icon: '/svg/newrelic.svg' },
];

interface Point {
  x: number;
  y: number;
  z: number;
}

/**
 * Fibonacci (golden-spiral) sphere point distribution.
 * Returns N unit-sphere points with excellent uniformity.
 */
const fibonacciSphere = (n: number): Point[] => {
  const points: Point[] = [];
  const goldenAngle = Math.PI * (3 - Math.sqrt(5));

  for (let i = 0; i < n; i++) {
    const y = 1 - (i / (n - 1)) * 2;
    const r = Math.sqrt(1 - y * y);
    const theta = goldenAngle * i;
    points.push({
      x: Math.cos(theta) * r,
      y,
      z: Math.sin(theta) * r,
    });
  }
  return points;
};

// Pre-compute the unit sphere positions once (module-level, zero cost on re-render)
const SPHERE_POINTS = fibonacciSphere(SKILLS.length);

export default function SkillsSphere() {
  const containerRef = useRef<HTMLDivElement>(null);
  const sphereRef = useRef<HTMLDivElement>(null);
  const tagRefs = useRef<(HTMLDivElement | null)[]>([]);
  const animFrameRef = useRef<number>(0);

  const sectionRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(sectionRef, { once: true, margin: '-80px' });

  // Rotation state (refs for 60fps perf — no React re-renders)
  const rotation = useRef({ x: 0, y: 0 });
  const velocity = useRef({ x: 0.003, y: 0.008 }); // auto-drift speeds
  const isDragging = useRef(false);
  const isHovering = useRef(false);
  const lastPointer = useRef({ x: 0, y: 0 });
  const dragVelocity = useRef({ x: 0, y: 0 });

  // Responsive radius
  const [radius, setRadius] = useState(260);
  const radiusRef = useRef(260);

  useEffect(() => {
    const update = () => {
      const w = window.innerWidth;
      const r = w < 480 ? 120 : w < 640 ? 150 : w < 1024 ? 200 : 260;
      setRadius(r);
      radiusRef.current = r;
    };
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  // ─── Animation Loop ───────────────────────────────────────
  useEffect(() => {
    const AUTO_SPEED_X = 0.003;
    const AUTO_SPEED_Y = 0.008;
    const DRAG_DECAY = 0.94;
    const HOVER_DECAY = 0.96;
    const RETURN_LERP = 0.03;

    const tick = () => {
      const v = velocity.current;
      const rot = rotation.current;

      if (isDragging.current) {
        // While dragging, apply accumulated drag velocity then decay
        v.x = dragVelocity.current.x;
        v.y = dragVelocity.current.y;
        dragVelocity.current.x *= 0.5;
        dragVelocity.current.y *= 0.5;
      } else if (isHovering.current) {
        // Hover: smoothly decelerate
        v.x *= HOVER_DECAY;
        v.y *= HOVER_DECAY;
      } else {
        // Idle: carry inertia and gradually return to auto-drift
        v.x = v.x * DRAG_DECAY + AUTO_SPEED_X * RETURN_LERP;
        v.y = v.y * DRAG_DECAY + AUTO_SPEED_Y * RETURN_LERP;
      }

      rot.x += v.x;
      rot.y += v.y;

      // Pre-compute trig
      const cx = Math.cos(rot.x);
      const sx = Math.sin(rot.x);
      const cy = Math.cos(rot.y);
      const sy = Math.sin(rot.y);
      const R = radiusRef.current;

      for (let i = 0; i < SPHERE_POINTS.length; i++) {
        const el = tagRefs.current[i];
        if (!el) continue;

        const p = SPHERE_POINTS[i];

        // Rotate around X-axis
        const y1 = p.y * cx - p.z * sx;
        const z1 = p.y * sx + p.z * cx;

        // Rotate around Y-axis
        const x2 = p.x * cy + z1 * sy;
        const z2 = -p.x * sy + z1 * cy;

        // Project to pixel space
        const px = x2 * R;
        const py = y1 * R;

        // Depth: normalize z2 from [-1, 1] to [0, 1]
        const depth = (z2 + 1) / 2;

        // Tags at the front are larger, brighter; tags at the back are smaller, faded
        const scale = 0.55 + depth * 0.6;
        const opacity = 0.12 + depth * 0.88;
        const blur = depth < 0.3 ? `blur(${(1 - depth * 3) * 2}px)` : 'blur(0px)';

        el.style.transform = `translate(-50%, -50%) translate3d(${px}px, ${py}px, 0px) scale(${scale})`;
        el.style.opacity = `${opacity}`;
        el.style.zIndex = `${Math.round(depth * 1000)}`;
        el.style.filter = blur;
      }

      animFrameRef.current = requestAnimationFrame(tick);
    };

    animFrameRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animFrameRef.current);
  }, []);

  // ─── Pointer Handlers ─────────────────────────────────────
  const onPointerDown = useCallback((e: React.PointerEvent) => {
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
    isDragging.current = true;
    lastPointer.current = { x: e.clientX, y: e.clientY };
    dragVelocity.current = { x: 0, y: 0 };
  }, []);

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    if (!isDragging.current) return;
    const dx = e.clientX - lastPointer.current.x;
    const dy = e.clientY - lastPointer.current.y;
    lastPointer.current = { x: e.clientX, y: e.clientY };

    const sensitivity = 0.006;
    dragVelocity.current.x = -dy * sensitivity;
    dragVelocity.current.y = dx * sensitivity;

    rotation.current.x += dragVelocity.current.x;
    rotation.current.y += dragVelocity.current.y;
  }, []);

  const onPointerUp = useCallback((e: React.PointerEvent) => {
    (e.target as HTMLElement).releasePointerCapture?.(e.pointerId);
    isDragging.current = false;
    // Transfer drag velocity to main velocity for inertia
    velocity.current.x = dragVelocity.current.x;
    velocity.current.y = dragVelocity.current.y;
  }, []);

  return (
    <section
      ref={sectionRef}
      id="skill"
      className="relative w-full bg-[#050505] flex flex-col items-center justify-center overflow-hidden py-24 md:py-32"
    >
      {/* Subtle grid background */}
      <div
        className="absolute inset-0 z-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: `
            linear-gradient(to right, #ffffff 1px, transparent 1px),
            linear-gradient(to bottom, #ffffff 1px, transparent 1px)
          `,
          backgroundSize: '4rem 4rem',
          maskImage: 'radial-gradient(ellipse 70% 70% at 50% 50%, #000 20%, transparent 100%)',
          WebkitMaskImage: 'radial-gradient(ellipse 70% 70% at 50% 50%, #000 20%, transparent 100%)',
        }}
      />

      {/* Ambient glow behind the sphere */}
      <div
        className="absolute pointer-events-none"
        style={{
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: radius * 2.2,
          height: radius * 2.2,
          background: 'radial-gradient(circle, rgba(139,0,0,0.18) 0%, rgba(139,0,0,0.06) 40%, transparent 70%)',
          filter: 'blur(40px)',
        }}
      />

      {/* Breathing accent glows matching Experience section */}
      <motion.div
        className="absolute top-[15%] right-[8%] w-[300px] md:w-[450px] h-[300px] md:h-[450px] bg-[#8B0000] rounded-full blur-[120px] mix-blend-screen pointer-events-none"
        animate={{ opacity: [0.06, 0.12, 0.06] }}
        transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
        style={{ willChange: 'opacity' }}
      />
      <motion.div
        className="absolute bottom-[15%] left-[8%] w-[300px] md:w-[450px] h-[300px] md:h-[450px] bg-[#fcc7b2] rounded-full blur-[120px] mix-blend-screen pointer-events-none"
        animate={{ opacity: [0.04, 0.09, 0.04] }}
        transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
        style={{ willChange: 'opacity' }}
      />

      <div className="container mx-auto px-6 max-w-6xl relative z-10 flex flex-col items-center">
        {/* Section Header — matches About/Experience style */}
        <motion.div
          className="text-center mb-12 md:mb-20"
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7, ease: 'easeOut' }}
        >
          <h2 className="text-sm uppercase tracking-[0.3em] text-zinc-500 font-semibold mb-6">
            Technical Expertise
          </h2>
          <h3 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FF0080] to-[#FF6B35]">
              Skills &amp; Tools
            </span>
          </h3>
          <p className="text-zinc-500 text-sm md:text-base max-w-md mx-auto mt-4">
            Drag to explore · Hover to slow down
          </p>
        </motion.div>

        {/* Sphere Interaction Area */}
        <div
          ref={containerRef}
          className="relative select-none touch-none"
          style={{
            width: radius * 2 + 120,
            height: radius * 2 + 60,
            cursor: 'grab',
            perspective: '800px',
          }}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          onPointerEnter={() => { isHovering.current = true; }}
          onPointerLeave={() => { isHovering.current = false; isDragging.current = false; }}
        >
          {/* ═══════ DECORATIVE HOLOGRAPHIC SPHERE ═══════ */}
          <div
            className="absolute pointer-events-none"
            style={{
              left: '50%',
              top: '50%',
              transform: 'translate(-50%, -50%)',
              width: radius * 2,
              height: radius * 2,
            }}
            aria-hidden="true"
          >
            {/* Pulsing energy core */}
            <div
              className="absolute rounded-full"
              style={{
                left: '50%',
                top: '50%',
                transform: 'translate(-50%, -50%)',
                width: radius * 0.15,
                height: radius * 0.15,
                background: 'radial-gradient(circle, rgba(255,0,128,0.6) 0%, rgba(139,0,0,0.3) 50%, transparent 70%)',
                boxShadow: '0 0 40px 15px rgba(255,0,128,0.15), 0 0 80px 30px rgba(139,0,0,0.08)',
                animation: 'sphereCorePulse 3s ease-in-out infinite',
              }}
            />

            {/* Orbital Ring 1 — Equator (horizontal) */}
            <div
              className="absolute rounded-full"
              style={{
                inset: 0,
                border: '1px solid rgba(139,0,0,0.25)',
                borderRadius: '50%',
                transform: 'rotateX(75deg)',
                animation: 'sphereRingSpin 25s linear infinite',
                boxShadow: '0 0 15px rgba(139,0,0,0.1), inset 0 0 15px rgba(139,0,0,0.05)',
              }}
            >
              {/* Orbiting dot on ring 1 */}
              <div style={{
                position: 'absolute',
                top: '-3px',
                left: '50%',
                width: 6,
                height: 6,
                borderRadius: '50%',
                background: '#FF0080',
                boxShadow: '0 0 12px 4px rgba(255,0,128,0.6)',
                animation: 'sphereDotOrbit 8s linear infinite',
              }} />
            </div>

            {/* Orbital Ring 2 — Tilted 60° */}
            <div
              className="absolute rounded-full"
              style={{
                inset: '4%',
                border: '1px solid rgba(255,107,53,0.2)',
                borderRadius: '50%',
                transform: 'rotateX(75deg) rotateY(60deg)',
                animation: 'sphereRingSpin 30s linear infinite reverse',
                boxShadow: '0 0 12px rgba(255,107,53,0.08)',
              }}
            >
              <div style={{
                position: 'absolute',
                top: '-3px',
                left: '50%',
                width: 5,
                height: 5,
                borderRadius: '50%',
                background: '#FF6B35',
                boxShadow: '0 0 10px 3px rgba(255,107,53,0.5)',
                animation: 'sphereDotOrbit 12s linear infinite reverse',
              }} />
            </div>

            {/* Orbital Ring 3 — Tilted -45° */}
            <div
              className="absolute rounded-full"
              style={{
                inset: '8%',
                border: '1px dashed rgba(252,199,178,0.12)',
                borderRadius: '50%',
                transform: 'rotateX(75deg) rotateY(-45deg)',
                animation: 'sphereRingSpin 35s linear infinite',
              }}
            />

            {/* Orbital Ring 4 — Near-vertical, meridian */}
            <div
              className="absolute rounded-full"
              style={{
                inset: '2%',
                border: '1px solid rgba(139,0,0,0.15)',
                borderRadius: '50%',
                transform: 'rotateX(75deg) rotateY(120deg)',
                animation: 'sphereRingSpin 22s linear infinite reverse',
              }}
            >
              <div style={{
                position: 'absolute',
                bottom: '-2px',
                left: '50%',
                width: 4,
                height: 4,
                borderRadius: '50%',
                background: '#fcc7b2',
                boxShadow: '0 0 8px 3px rgba(252,199,178,0.4)',
                animation: 'sphereDotOrbit 10s linear infinite',
              }} />
            </div>

            {/* Orbital Ring 5 — Small inner ring, fast */}
            <div
              className="absolute rounded-full"
              style={{
                inset: '25%',
                border: '1px solid rgba(255,0,128,0.15)',
                borderRadius: '50%',
                transform: 'rotateX(75deg) rotateY(30deg)',
                animation: 'sphereRingSpin 18s linear infinite',
                boxShadow: '0 0 8px rgba(255,0,128,0.06)',
              }}
            />

            {/* Scanline sweep — rotating radial wipe across the sphere */}
            <div
              className="absolute overflow-hidden rounded-full"
              style={{
                inset: 0,
                animation: 'sphereScanSpin 8s linear infinite',
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  top: 0,
                  left: '50%',
                  width: '50%',
                  height: '100%',
                  background: 'linear-gradient(to right, rgba(139,0,0,0.08) 0%, transparent 100%)',
                }}
              />
            </div>

            {/* Outer halo ring */}
            <div
              className="absolute rounded-full"
              style={{
                inset: '-4%',
                border: '1px solid rgba(139,0,0,0.08)',
                borderRadius: '50%',
                animation: 'sphereCorePulse 4s ease-in-out infinite 1s',
              }}
            />
          </div>

          {/* ═══════ SKILL TAGS ═══════ */}
          <div
            ref={sphereRef}
            style={{
              position: 'absolute',
              left: '50%',
              top: '50%',
              width: 0,
              height: 0,
              transformStyle: 'preserve-3d',
            }}
          >
            {SKILLS.map((skill, i) => (
              <div
                key={skill.name}
                ref={(el) => { tagRefs.current[i] = el; }}
                className="group"
                tabIndex={0}
                role="listitem"
                aria-label={skill.name}
                style={{
                  position: 'absolute',
                  left: 0,
                  top: 0,
                  width: 'max-content',
                  willChange: 'transform, opacity',
                  whiteSpace: 'nowrap',
                }}
              >
                <div
                  className="flex items-center gap-2 rounded-full px-3 py-1.5 sm:px-4 sm:py-2
                    bg-white/[0.04] backdrop-blur-sm
                    transition-all duration-300 ease-out
                    hover:bg-[#8B0000]/20 hover:shadow-[0_0_20px_rgba(139,0,0,0.35),inset_0_0_12px_rgba(139,0,0,0.08)]
                    focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8B0000]/70 focus-visible:ring-offset-2 focus-visible:ring-offset-[#050505]"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={skill.icon}
                    alt=""
                    aria-hidden="true"
                    className="w-5 h-5 sm:w-6 sm:h-6 object-contain pointer-events-none select-none
                      transition-transform duration-300 group-hover:scale-110"
                    draggable={false}
                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                  />
                  <span
                    className={`${bebasNeue.className} text-sm sm:text-base lg:text-lg tracking-widest text-[#FAF9F6]/90
                      transition-colors duration-300 group-hover:text-white`}
                  >
                    {skill.name}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Screen-reader-only accessible list (guaranteed hidden with inline styles) */}
      <div
        role="list"
        aria-label="Technical skills"
        style={{
          position: 'absolute',
          width: '1px',
          height: '1px',
          padding: 0,
          margin: '-1px',
          overflow: 'hidden',
          clip: 'rect(0, 0, 0, 0)',
          whiteSpace: 'nowrap',
          borderWidth: 0,
        }}
      >
        {SKILLS.map((skill) => (
          <div key={skill.name} role="listitem">{skill.name}</div>
        ))}
      </div>
    </section>
  );
}
