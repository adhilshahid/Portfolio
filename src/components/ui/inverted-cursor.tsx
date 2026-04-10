"use client";

import React, { useState, useEffect, useRef } from "react";

export const Cursor: React.FC = () => {
  const cursorRef = useRef<HTMLDivElement>(null);
  const requestRef = useRef<number>();

  const positionRef = useRef({
    currentX: -100,
    currentY: -100,
    targetX: -100,
    targetY: -100
  });

  const [visible, setVisible] = useState(false);
  const [cursorState, setCursorState] = useState<'default' | 'hover' | 'text' | 'click' | 'disabled' | 'grab'>('default');
  const [size, setSize] = useState(40);

  // Glow configurations
  const glowStyles = {
    default: `
      0 0 16px 10px rgba(230, 194, 255, 0.85),
      0 0 20px 16px rgba(229, 194, 254, 0.55),
      0 0 24px 24px rgba(148, 123, 171, 0.25)
    `,
    hover: `
      0 0 16px 10px rgba(230, 194, 255, 0.95),
      0 0 20px 16px rgba(229, 194, 254, 0.65),
      0 0 24px 24px rgba(148, 123, 171, 0.35)
    `,
    text: `
      0 0 20px 12px rgba(230, 194, 255, 0.7),
      0 0 25px 20px rgba(229, 194, 254, 0.5),
      0 0 28px 28px rgba(148, 123, 171, 0.2)
    `,
    click: `
      0 0 12px 8px rgba(230, 194, 255, 0.9),
      0 0 16px 12px rgba(229, 194, 254, 0.6),
      0 0 20px 20px rgba(148, 123, 171, 0.3)
    `,
    disabled: `
      0 0 8px 5px rgba(230, 194, 255, 0.4),
      0 0 10px 8px rgba(229, 194, 254, 0.25),
      0 0 12px 12px rgba(148, 123, 171, 0.15)
    `,
    grab: `
      0 0 20px 12px rgba(230, 194, 255, 0.9),
      0 0 25px 20px rgba(229, 194, 254, 0.6),
      0 0 32px 32px rgba(148, 123, 171, 0.3)
    `
  };

  useEffect(() => {
    let isActive = true;

    // Smooth cursor follow with lerp
    const lerp = (start: number, end: number, factor: number) => {
      return start + (end - start) * factor;
    };

    const updateCursor = () => {
      if (!isActive || !cursorRef.current) return;

      const { currentX, currentY, targetX, targetY } = positionRef.current;

      const newX = lerp(currentX, targetX, 0.15);
      const newY = lerp(currentY, targetY, 0.15);

      positionRef.current.currentX = newX;
      positionRef.current.currentY = newY;

      // translate(-50%, -50%) centers it automatically without JS size offsets
      cursorRef.current.style.transform = `translate3d(${newX}px, ${newY}px, 0) translate(-50%, -50%)`;
      requestRef.current = requestAnimationFrame(updateCursor);
    };

    const handleMouseMove = (e: MouseEvent) => {
      positionRef.current.targetX = e.clientX;
      positionRef.current.targetY = e.clientY;
      if (!visible) setVisible(true);
    };

    const handleMouseEnter = () => setVisible(true);
    const handleMouseLeave = () => setVisible(false);

    let isClicking = false;

    // Detect hover on interactive elements
    const handleHover = (e: MouseEvent) => {
      if (isClicking) return; // Prioritize click state

      const target = e.target as HTMLElement;
      if (!target) return;

      // Check for disabled elements
      if (target.hasAttribute('disabled') || target.classList.contains('disabled')) {
        setCursorState('disabled');
        setSize(30);
        return;
      }

      // Check for draggable elements
      if (target.getAttribute('draggable') === 'true' || target.classList.contains('grab') || window.getComputedStyle(target).cursor === 'grab') {
        setCursorState('grab');
        setSize(48);
        return;
      }

      // Check for buttons, links, CTAs
      if (
        target.tagName === 'BUTTON' ||
        target.tagName === 'A' ||
        target.closest('a') !== null ||
        target.closest('button') !== null ||
        target.hasAttribute('data-cursor') ||
        target.classList.contains('cursor-pointer') ||
        window.getComputedStyle(target).cursor === 'pointer'
      ) {
        setCursorState('hover');
        setSize(70);
        return;
      }

      // Check for text/headings
      if (
        ['H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'P', 'SPAN', 'LI'].includes(target.tagName) ||
        target.classList.contains('text-hover') ||
        window.getComputedStyle(target).cursor === 'text'
      ) {
        setCursorState('text');
        setSize(70);
        return;
      }

      // Default state
      setCursorState('default');
      setSize(40);
    };

    // Handle click state
    const handleMouseDown = () => {
      isClicking = true;
      setCursorState('click');
      setSize(30);
    };

    const handleMouseUp = (e: MouseEvent) => {
      isClicking = false;
      // Re-trigger hover checks instantly after click
      handleHover(e);
    };

    // Add listeners
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseover', handleHover);
    document.addEventListener('mouseenter', handleMouseEnter);
    document.addEventListener('mouseleave', handleMouseLeave);
    document.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('mouseup', handleMouseUp);

    document.body.classList.add("custom-cursor-active");

    updateCursor();

    return () => {
      isActive = false;
      document.body.classList.remove("custom-cursor-active");
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseover', handleHover);
      document.removeEventListener('mouseenter', handleMouseEnter);
      document.removeEventListener('mouseleave', handleMouseLeave);
      document.removeEventListener('mousedown', handleMouseDown);
      document.removeEventListener('mouseup', handleMouseUp);
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, []); // Run only once

  const getOpacity = () => {
    if (!visible) return 0;
    if (cursorState === 'text') return 1;
    if (cursorState === 'disabled') return 0.4;
    return 1;
  };

  return (
    <div
      ref={cursorRef}
      className={`fixed top-0 left-0 pointer-events-none rounded-full mix-blend-difference z-50 ${cursorState === 'text' ? 'animate-pulse' : ''}`}
      style={{
        width: size,
        height: size,
        opacity: getOpacity(),
        backgroundColor: "#E6CEFF",
        boxShadow: glowStyles[cursorState],
        transition: 'width 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55), height 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55), opacity 0.3s ease-out, box-shadow 0.3s ease-out'
      }}
      aria-hidden="true"
    />
  );
}

export default Cursor;
