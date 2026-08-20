"use client";

import React, { useEffect, useRef, useState } from "react";
import { motion, useMotionValue, useSpring, useAnimationFrame } from "framer-motion";

type CursorMode = "default" | "hover" | "text";

const ORB_SIZE = 56;

/** How strongly the orb is pulled toward a hovered element's centre. */
const MAGNET_PULL = 0.35;
/** Fixed hover size, so every interactive element grows the orb identically. */
const HOVER_SCALE = 1.6;
/** Slack around a hovered element's rect before the magnet lets go. */
const MAGNET_MARGIN = 8;
/** Cap on how far the magnet may pull the orb away from the real pointer. */
const MAX_MAGNET_OFFSET = 26;

const INTERACTIVE_SELECTOR = 'a, button, [role="button"], [data-cursor], .cursor-pointer';
// Only true text-entry fields shrink the orb, so it never covers what you're typing.
const TEXT_SELECTOR = 'input, textarea, select, [contenteditable="true"]';

const ORB_SPRING = { stiffness: 260, damping: 30, mass: 0.8 };
const INSTANT_SPRING = { stiffness: 2000, damping: 90, mass: 0.2 };

export const Cursor: React.FC = () => {
  const [enabled, setEnabled] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);

  // Raw pointer position, kept out of React state so nothing re-renders per frame.
  const pointer = useRef({ x: -200, y: -200 });
  const mode = useRef<CursorMode>("default");
  const hovered = useRef<Element | null>(null);
  const pressed = useRef(false);
  const inWindow = useRef(false);

  const orbX = useMotionValue(-200);
  const orbY = useMotionValue(-200);
  const orbScale = useMotionValue(1);
  const orbOpacity = useMotionValue(0);

  const softSpring = reducedMotion ? INSTANT_SPRING : ORB_SPRING;
  const springX = useSpring(orbX, softSpring);
  const springY = useSpring(orbY, softSpring);
  const springScale = useSpring(orbScale, reducedMotion ? INSTANT_SPRING : { stiffness: 320, damping: 26, mass: 0.7 });
  const springOrbOpacity = useSpring(orbOpacity, { stiffness: 220, damping: 32, mass: 0.6 });

  // Only take over the cursor on devices with a real pointing device.
  useEffect(() => {
    const fine = window.matchMedia("(hover: hover) and (pointer: fine)");
    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");

    const syncFine = () => setEnabled(fine.matches);
    const syncMotion = () => setReducedMotion(motionQuery.matches);

    syncFine();
    syncMotion();
    fine.addEventListener("change", syncFine);
    motionQuery.addEventListener("change", syncMotion);

    return () => {
      fine.removeEventListener("change", syncFine);
      motionQuery.removeEventListener("change", syncMotion);
    };
  }, []);

  useEffect(() => {
    if (!enabled) return;

    const resolveMode = (target: Element | null): CursorMode => {
      if (!target) return "default";
      const interactive = target.closest(INTERACTIVE_SELECTOR);
      if (interactive) {
        hovered.current = interactive;
        return "hover";
      }
      hovered.current = null;
      return target.closest(TEXT_SELECTOR) ? "text" : "default";
    };

    const show = () => {
      inWindow.current = true;
      orbOpacity.set(1);
    };

    const hide = () => {
      inWindow.current = false;
      orbOpacity.set(0);
    };

    const onMove = (e: PointerEvent) => {
      pointer.current.x = e.clientX;
      pointer.current.y = e.clientY;
      if (!inWindow.current) show();
    };

    const onOver = (e: Event) => {
      mode.current = resolveMode(e.target as Element | null);
    };

    const onDown = () => {
      pressed.current = true;
    };

    const onUp = () => {
      pressed.current = false;
    };

    const onLeave = (e: PointerEvent) => {
      // Some browsers emit pointerleave with a null relatedTarget while the pointer is
      // still inside the page, so confirm against the viewport bounds before hiding.
      const outside =
        e.clientX <= 0 ||
        e.clientY <= 0 ||
        e.clientX >= window.innerWidth ||
        e.clientY >= window.innerHeight;
      if (outside) hide();
    };

    document.addEventListener("pointermove", onMove, { passive: true });
    document.addEventListener("pointerover", onOver, { passive: true });
    document.addEventListener("pointerdown", onDown, { passive: true });
    document.addEventListener("pointerup", onUp, { passive: true });
    document.documentElement.addEventListener("pointerleave", onLeave, { passive: true });
    window.addEventListener("blur", hide);
    document.body.classList.add("custom-cursor-active");

    return () => {
      document.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerover", onOver);
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("pointerup", onUp);
      document.documentElement.removeEventListener("pointerleave", onLeave);
      window.removeEventListener("blur", hide);
      document.body.classList.remove("custom-cursor-active");
    };
  }, [enabled, orbOpacity]);

  // Rects are re-measured every frame so Lenis smooth scrolling can't desync the magnet.
  useAnimationFrame(() => {
    if (!enabled) return;

    const { x, y } = pointer.current;
    let targetX = x;
    let targetY = y;
    let scale = 1;

    if (mode.current === "hover" && hovered.current?.isConnected) {
      const rect = hovered.current.getBoundingClientRect();
      const inside =
        x >= rect.left - MAGNET_MARGIN &&
        x <= rect.right + MAGNET_MARGIN &&
        y >= rect.top - MAGNET_MARGIN &&
        y <= rect.bottom + MAGNET_MARGIN;

      if (inside) {
        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height / 2;
        let dx = (cx - x) * MAGNET_PULL;
        let dy = (cy - y) * MAGNET_PULL;
        // Large targets would otherwise drag the orb far from the real pointer.
        const dist = Math.hypot(dx, dy);
        if (dist > MAX_MAGNET_OFFSET) {
          const k = MAX_MAGNET_OFFSET / dist;
          dx *= k;
          dy *= k;
        }
        targetX = x + dx;
        targetY = y + dy;
        scale = HOVER_SCALE;
      } else {
        // Smooth scrolling can slide the target out from under a stationary pointer.
        mode.current = "default";
        hovered.current = null;
      }
    } else if (mode.current === "text") {
      scale = 0.5;
    }

    if (pressed.current) scale *= 0.82;

    orbX.set(targetX);
    orbY.set(targetY);
    orbScale.set(scale);
  });

  if (!enabled) return null;

  return (
    <motion.div
      aria-hidden="true"
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: ORB_SIZE,
        height: ORB_SIZE,
        marginLeft: -ORB_SIZE / 2,
        marginTop: -ORB_SIZE / 2,
        borderRadius: "50%",
        pointerEvents: "none",
        zIndex: 10000,
        willChange: "transform, opacity",
        x: springX,
        y: springY,
        scale: springScale,
        opacity: springOrbOpacity,
        background: "linear-gradient(135deg, #FF0080 0%, #FF3D6E 45%, #FF6B35 100%)",
        boxShadow:
          "0 0 26px 8px rgba(255, 0, 128, 0.55), 0 0 64px 20px rgba(255, 107, 53, 0.3)",
        // Difference blending inverts what's underneath; against the near-black theme the
        // accent gradient survives the inversion, so the circle glows pink→orange.
        mixBlendMode: "difference",
      }}
    />
  );
};

export default Cursor;
