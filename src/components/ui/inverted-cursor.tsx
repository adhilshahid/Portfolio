"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";

type CursorMode = 'default' | 'hover' | 'text' | 'click' | 'disabled' | 'grab' | 'hidden';

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

// Number of trailing ghost orbs for the ribbon effect
const TRAIL_COUNT = 7;

export const Cursor: React.FC = () => {
  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);
  const trailRefs = useRef<(HTMLDivElement | null)[]>([]);
  const requestRef = useRef<number | null>(null);

  const pos = useRef({
    cx: -100, cy: -100,
    tx: -100, ty: -100,
    rx: -100, ry: -100,
    gx: -100, gy: -100,
  });

  // Each trail orb has its own position that lerps toward the previous one
  const trailPos = useRef<{ x: number; y: number }[]>(
    Array.from({ length: TRAIL_COUNT }, () => ({ x: -100, y: -100 }))
  );

  const velocity = useRef({ vx: 0, vy: 0 });

  const [visible, setVisible] = useState(false);
  const [mode, setMode] = useState<CursorMode>('default');
  const prevMode = useRef<CursorMode>('default');

  // Magnetic snap target
  const magnetTarget = useRef<{ x: number; y: number; w: number; h: number } | null>(null);

  // Click ripple
  const [ripples, setRipples] = useState<{ id: number; x: number; y: number }[]>([]);
  const rippleId = useRef(0);

  const spawnRipple = useCallback((x: number, y: number) => {
    const id = ++rippleId.current;
    setRipples(prev => [...prev, { id, x, y }]);
    setTimeout(() => {
      setRipples(prev => prev.filter(r => r.id !== id));
    }, 700);
  }, []);

  // ---------- animation loop ----------
  useEffect(() => {
    let active = true;

    const animate = () => {
      if (!active) return;

      const p = pos.current;
      const v = velocity.current;

      // Magnetic snapping
      let finalTx = p.tx;
      let finalTy = p.ty;
      if (mode === 'hover' && magnetTarget.current) {
        const mt = magnetTarget.current;
        finalTx = lerp(p.tx, mt.x + mt.w / 2, 0.12);
        finalTy = lerp(p.ty, mt.y + mt.h / 2, 0.12);
      }

      const prevCx = p.cx;
      const prevCy = p.cy;

      // Dot — fast follow
      p.cx = lerp(p.cx, finalTx, 0.18);
      p.cy = lerp(p.cy, finalTy, 0.18);

      v.vx = p.cx - prevCx;
      v.vy = p.cy - prevCy;

      // Ring — medium lag
      p.rx = lerp(p.rx, finalTx, 0.065);
      p.ry = lerp(p.ry, finalTy, 0.065);

      // Glow — slowest
      p.gx = lerp(p.gx, finalTx, 0.04);
      p.gy = lerp(p.gy, finalTy, 0.04);

      // Velocity-based stretch
      const speed = Math.sqrt(v.vx * v.vx + v.vy * v.vy);
      const angle = Math.atan2(v.vy, v.vx) * (180 / Math.PI);
      const dotStretch = Math.min(speed * 0.04, 0.4);
      const ringStretch = Math.min(speed * 0.02, 0.2);

      // --- Heartbeat pulse for text mode ---
      // Double-beat pattern: two quick pulses then rest (like a real heartbeat)
      let heartbeatDotScale = 1;
      let heartbeatRingScale = 1;
      if (mode === 'text') {
        const t = (performance.now() % 1400) / 1400; // 1.4s cycle
        if (t < 0.14) {
          // First beat up
          const p2 = t / 0.14;
          heartbeatDotScale = 1 + 0.3 * Math.sin(p2 * Math.PI);
          heartbeatRingScale = 1 + 0.15 * Math.sin(p2 * Math.PI);
        } else if (t < 0.28) {
          // First beat down
          const p2 = (t - 0.14) / 0.14;
          heartbeatDotScale = 1 + 0.3 * Math.sin((1 - p2) * Math.PI) * 0.3;
          heartbeatRingScale = 1 + 0.15 * Math.sin((1 - p2) * Math.PI) * 0.3;
        } else if (t < 0.42) {
          // Second beat up (stronger)
          const p2 = (t - 0.28) / 0.14;
          heartbeatDotScale = 1 + 0.45 * Math.sin(p2 * Math.PI);
          heartbeatRingScale = 1 + 0.2 * Math.sin(p2 * Math.PI);
        } else if (t < 0.56) {
          // Second beat down
          const p2 = (t - 0.42) / 0.14;
          heartbeatDotScale = 1 + 0.45 * Math.sin((1 - p2) * Math.PI) * 0.2;
          heartbeatRingScale = 1 + 0.2 * Math.sin((1 - p2) * Math.PI) * 0.2;
        }
        // 56-100% = rest (scale stays 1)
      }

      // Apply dot
      if (dotRef.current) {
        if (mode === 'text') {
          dotRef.current.style.transform = `translate3d(${p.cx}px, ${p.cy}px, 0) translate(-50%, -50%) scale(${heartbeatDotScale})`;
        } else {
          dotRef.current.style.transform = `translate3d(${p.cx}px, ${p.cy}px, 0) translate(-50%, -50%) rotate(${angle}deg) scale(${1 + dotStretch}, ${1 - dotStretch * 0.5})`;
        }
      }

      // Apply ring
      if (ringRef.current) {
        if (mode === 'text') {
          ringRef.current.style.transform = `translate3d(${p.rx}px, ${p.ry}px, 0) translate(-50%, -50%) scale(${heartbeatRingScale})`;
        } else {
          ringRef.current.style.transform = `translate3d(${p.rx}px, ${p.ry}px, 0) translate(-50%, -50%) rotate(${angle}deg) scale(${1 + ringStretch}, ${1 - ringStretch * 0.3})`;
        }
      }

      // Apply glow
      if (glowRef.current) {
        glowRef.current.style.transform = `translate3d(${p.gx}px, ${p.gy}px, 0) translate(-50%, -50%)`;
      }

      // --- Trail ribbon: each orb chases the one ahead of it ---
      const trail = trailPos.current;
      for (let i = 0; i < TRAIL_COUNT; i++) {
        // Orb 0 chases the dot, orb 1 chases orb 0, etc.
        const leader = i === 0 ? { x: p.cx, y: p.cy } : trail[i - 1];
        // Progressively slower lerp for each orb (more lag = smoother ribbon)
        const factor = 0.18 - i * 0.018;
        trail[i].x = lerp(trail[i].x, leader.x, Math.max(factor, 0.03));
        trail[i].y = lerp(trail[i].y, leader.y, Math.max(factor, 0.03));

        const el = trailRefs.current[i];
        if (el) {
          el.style.transform = `translate3d(${trail[i].x}px, ${trail[i].y}px, 0) translate(-50%, -50%)`;
        }
      }

      requestRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      active = false;
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [mode]);

  // ---------- event handlers ----------
  useEffect(() => {
    let clicking = false;

    const onMove = (e: MouseEvent) => {
      pos.current.tx = e.clientX;
      pos.current.ty = e.clientY;
      if (!visible) setVisible(true);
    };

    const onEnter = () => setVisible(true);
    const onLeave = () => setVisible(false);

    const detectMode = (e: MouseEvent) => {
      if (clicking) return;
      const target = e.target as HTMLElement;
      if (!target) return;

      if (target.hasAttribute('disabled') || target.classList.contains('disabled')) {
        setMode('disabled');
        magnetTarget.current = null;
        return;
      }

      if (
        target.getAttribute('draggable') === 'true' ||
        target.classList.contains('grab') ||
        window.getComputedStyle(target).cursor === 'grab'
      ) {
        setMode('grab');
        magnetTarget.current = null;
        return;
      }

      const interactive = target.tagName === 'BUTTON' ||
        target.tagName === 'A' ||
        target.closest('a') !== null ||
        target.closest('button') !== null ||
        target.hasAttribute('data-cursor') ||
        target.classList.contains('cursor-pointer') ||
        window.getComputedStyle(target).cursor === 'pointer';

      if (interactive) {
        setMode('hover');
        const el = target.closest('a') || target.closest('button') || target;
        const rect = el.getBoundingClientRect();
        magnetTarget.current = { x: rect.left, y: rect.top, w: rect.width, h: rect.height };
        return;
      }

      if (
        ['H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'P', 'SPAN', 'LI', 'LABEL'].includes(target.tagName) ||
        target.classList.contains('text-hover') ||
        window.getComputedStyle(target).cursor === 'text'
      ) {
        setMode('text');
        magnetTarget.current = null;
        return;
      }

      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
        setMode('text');
        magnetTarget.current = null;
        return;
      }

      setMode('default');
      magnetTarget.current = null;
    };

    const onDown = (e: MouseEvent) => {
      clicking = true;
      prevMode.current = mode;
      setMode('click');
      spawnRipple(e.clientX, e.clientY);
    };

    const onUp = (e: MouseEvent) => {
      clicking = false;
      detectMode(e);
    };

    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseover', detectMode);
    document.addEventListener('mouseenter', onEnter);
    document.addEventListener('mouseleave', onLeave);
    document.addEventListener('mousedown', onDown);
    document.addEventListener('mouseup', onUp);
    document.body.classList.add('custom-cursor-active');

    return () => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseover', detectMode);
      document.removeEventListener('mouseenter', onEnter);
      document.removeEventListener('mouseleave', onLeave);
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('mouseup', onUp);
      document.body.classList.remove('custom-cursor-active');
    };
  }, [visible, mode, spawnRipple]);

  // ---------- styles ----------
  const isTrailVisible = mode !== 'text' && mode !== 'click';

  const getDotStyle = (): React.CSSProperties => {
    const base: React.CSSProperties = {
      position: 'fixed',
      top: 0,
      left: 0,
      pointerEvents: 'none',
      zIndex: 10002,
      borderRadius: '50%',
      transition: 'width 0.45s cubic-bezier(0.34, 1.56, 0.64, 1), height 0.45s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.3s ease, border-radius 0.45s cubic-bezier(0.34, 1.56, 0.64, 1), background 0.3s ease, box-shadow 0.4s ease',
      opacity: visible ? 1 : 0,
    };

    switch (mode) {
      case 'default':
        return {
          ...base,
          width: 16,
          height: 16,
          background: 'linear-gradient(135deg, #FF0080, #FF6B35)',
          boxShadow: '0 0 20px 6px rgba(255, 0, 128, 0.5), 0 0 50px 12px rgba(255, 107, 53, 0.2)',
        };
      case 'hover':
        return {
          ...base,
          width: 24,
          height: 24,
          background: 'linear-gradient(135deg, #FF0080, #FF6B35)',
          boxShadow: '0 0 30px 10px rgba(255, 0, 128, 0.6), 0 0 70px 25px rgba(255, 107, 53, 0.3)',
        };
      case 'text':
        return {
          ...base,
          width: 20,
          height: 20,
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #FF0080, #FF6B35)',
          boxShadow: '0 0 20px 8px rgba(255, 0, 128, 0.5), 0 0 50px 14px rgba(255, 107, 53, 0.2)',
        };
      case 'click':
        return {
          ...base,
          width: 10,
          height: 10,
          background: '#fff',
          boxShadow: '0 0 40px 16px rgba(255, 255, 255, 0.4), 0 0 80px 30px rgba(255, 0, 128, 0.35)',
        };
      case 'disabled':
        return {
          ...base,
          width: 14,
          height: 14,
          background: 'rgba(120, 120, 120, 0.5)',
          boxShadow: '0 0 10px 3px rgba(120, 120, 120, 0.2)',
          opacity: visible ? 0.4 : 0,
        };
      case 'grab':
        return {
          ...base,
          width: 20,
          height: 20,
          background: 'linear-gradient(135deg, #FF0080, #FF6B35)',
          boxShadow: '0 0 24px 8px rgba(255, 0, 128, 0.5)',
        };
      default:
        return base;
    }
  };

  const getRingStyle = (): React.CSSProperties => {
    const base: React.CSSProperties = {
      position: 'fixed',
      top: 0,
      left: 0,
      pointerEvents: 'none',
      zIndex: 10001,
      borderStyle: 'solid',
      boxSizing: 'border-box',
      transition: 'width 0.55s cubic-bezier(0.34, 1.56, 0.64, 1), height 0.55s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.35s ease, border-radius 0.55s cubic-bezier(0.34, 1.56, 0.64, 1), border-color 0.35s ease, border-width 0.3s ease, background 0.45s ease, box-shadow 0.45s ease',
      opacity: visible ? 1 : 0,
      background: 'transparent',
    };

    switch (mode) {
      case 'default':
        return {
          ...base,
          width: 64,
          height: 64,
          borderRadius: '50%',
          borderWidth: 1.5,
          borderColor: 'rgba(255, 0, 128, 0.3)',
          boxShadow: '0 0 25px 4px rgba(255, 0, 128, 0.1), inset 0 0 25px 4px rgba(255, 107, 53, 0.06)',
        };
      case 'hover':
        return {
          ...base,
          width: 90,
          height: 90,
          borderRadius: '50%',
          borderWidth: 2,
          borderColor: 'rgba(255, 0, 128, 0.5)',
          background: 'radial-gradient(circle, rgba(255, 0, 128, 0.08) 0%, transparent 70%)',
          boxShadow: '0 0 40px 12px rgba(255, 0, 128, 0.18), inset 0 0 30px 8px rgba(255, 107, 53, 0.1)',
        };
      case 'text':
        return {
          ...base,
          width: 60,
          height: 60,
          borderRadius: '50%',
          borderWidth: 1.5,
          borderColor: 'rgba(255, 0, 128, 0.25)',
          background: 'radial-gradient(circle, rgba(255, 0, 128, 0.06) 0%, transparent 70%)',
          boxShadow: '0 0 30px 8px rgba(255, 0, 128, 0.1), inset 0 0 20px 4px rgba(255, 107, 53, 0.06)',
        };
      case 'click':
        return {
          ...base,
          width: 40,
          height: 40,
          borderRadius: '50%',
          borderWidth: 2.5,
          borderColor: 'rgba(255, 255, 255, 0.9)',
          boxShadow: '0 0 50px 16px rgba(255, 0, 128, 0.3), 0 0 100px 30px rgba(255, 107, 53, 0.12)',
        };
      case 'disabled':
        return {
          ...base,
          width: 50,
          height: 50,
          borderRadius: '50%',
          borderWidth: 1,
          borderColor: 'rgba(120, 120, 120, 0.25)',
          opacity: visible ? 0.3 : 0,
        };
      case 'grab':
        return {
          ...base,
          width: 72,
          height: 72,
          borderRadius: '50%',
          borderWidth: 2,
          borderColor: 'rgba(255, 107, 53, 0.45)',
          borderStyle: 'dashed',
          boxShadow: '0 0 30px 8px rgba(255, 107, 53, 0.15)',
        };
      default:
        return base;
    }
  };

  const getGlowStyle = (): React.CSSProperties => {
    const base: React.CSSProperties = {
      position: 'fixed',
      top: 0,
      left: 0,
      pointerEvents: 'none',
      zIndex: 9999,
      borderRadius: '50%',
      transition: 'width 0.6s ease, height 0.6s ease, opacity 0.5s ease, background 0.5s ease',
      opacity: visible ? 1 : 0,
    };

    switch (mode) {
      case 'default':
        return { ...base, width: 180, height: 180, background: 'radial-gradient(circle, rgba(255, 0, 128, 0.06) 0%, rgba(255, 107, 53, 0.03) 40%, transparent 70%)' };
      case 'hover':
        return { ...base, width: 240, height: 240, background: 'radial-gradient(circle, rgba(255, 0, 128, 0.1) 0%, rgba(255, 107, 53, 0.05) 40%, transparent 70%)' };
      case 'text':
        return { ...base, width: 120, height: 120, background: 'radial-gradient(circle, rgba(255, 0, 128, 0.05) 0%, transparent 70%)' };
      case 'click':
        return { ...base, width: 300, height: 300, background: 'radial-gradient(circle, rgba(255, 255, 255, 0.08) 0%, rgba(255, 0, 128, 0.06) 30%, transparent 65%)' };
      default:
        return { ...base, width: 160, height: 160, background: 'radial-gradient(circle, rgba(255, 0, 128, 0.04) 0%, transparent 70%)' };
    }
  };

  return (
    <>
      {/* Smooth comet trail — ghost orbs chasing each other */}
      {Array.from({ length: TRAIL_COUNT }).map((_, i) => {
        const t = (i + 1) / TRAIL_COUNT; // 0→1 from head to tail
        const size = lerp(12, 3, t);
        const opacity = isTrailVisible && visible ? lerp(0.35, 0.02, t) : 0;
        // Gradient hue shifts from pink to orange along the tail
        const pinkAmt = Math.round(lerp(255, 200, t));
        const orangeR = 255;
        const orangeG = Math.round(lerp(0, 107, t));
        const orangeB = Math.round(lerp(128, 53, t));

        return (
          <div
            key={i}
            ref={el => { trailRefs.current[i] = el; }}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              width: size,
              height: size,
              borderRadius: '50%',
              pointerEvents: 'none',
              zIndex: 10000 - i,
              background: `rgba(${orangeR}, ${orangeG}, ${orangeB}, ${opacity})`,
              boxShadow: `0 0 ${lerp(16, 4, t)}px ${lerp(6, 1, t)}px rgba(${pinkAmt}, 0, ${orangeB}, ${opacity * 0.6})`,
              opacity: 1, // opacity is baked into the rgba
              transition: 'width 0.4s ease, height 0.4s ease, background 0.3s ease, box-shadow 0.3s ease',
              willChange: 'transform',
            }}
            aria-hidden="true"
          />
        );
      })}

      {/* Click ripple rings */}
      {ripples.map(r => (
        <div
          key={r.id}
          className="cursor-ripple"
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            transform: `translate3d(${r.x}px, ${r.y}px, 0) translate(-50%, -50%)`,
            pointerEvents: 'none',
            zIndex: 10003,
          }}
          aria-hidden="true"
        />
      ))}

      {/* Ambient glow orb */}
      <div
        ref={glowRef}
        style={getGlowStyle()}
        aria-hidden="true"
      />

      {/* Outer ring */}
      <div
        ref={ringRef}

        style={getRingStyle()}
        aria-hidden="true"
      />

      {/* Inner dot */}
      <div
        ref={dotRef}

        style={getDotStyle()}
        aria-hidden="true"
      />
    </>
  );
};

export default Cursor;
