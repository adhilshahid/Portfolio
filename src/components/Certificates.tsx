'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { motion, useInView, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { Award, ExternalLink, X, ChevronLeft, ChevronRight, ShieldCheck, BadgeCheck } from 'lucide-react';

/* ─── Types ─────────────────────────────────────────────────── */
interface Certificate {
  id: number;
  title: string;
  issuer: string;
  date: string;
  image: string;
  category: 'cloud' | 'networking' | 'development' | 'security';
}

/* ─── Data ──────────────────────────────────────────────────── */
const certificates: Certificate[] = [
  {
    id: 1,
    title: 'AWS Certified Cloud Practitioner CLF-C02',
    issuer: 'Udemy',
    date: 'June 2026',
    image: '/Certificate/1.png',
    category: 'cloud',
  },
  {
    id: 2,
    title: 'AZ-104: Microsoft Azure Administrator',
    issuer: 'Koenig Solutions · Microsoft',
    date: 'April 2026',
    image: '/Certificate/2.png',
    category: 'cloud',
  },
  {
    id: 3,
    title: 'Cisco CCNA 200-301',
    issuer: 'Udemy',
    date: 'March 2026',
    image: '/Certificate/3.png',
    category: 'networking',
  },
  {
    id: 4,
    title: 'Cryptography & Network Security',
    issuer: 'NPTEL · IIT Kharagpur',
    date: 'Oct 2022',
    image: '/Certificate/4.jpg',
    category: 'security',
  },
  {
    id: 5,
    title: 'Infoblox Qualified DDI Professional (DDIP)',
    issuer: 'Infoblox',
    date: 'April 2026',
    image: '/Certificate/5.png',
    category: 'networking',
  },
  {
    id: 6,
    title: 'Fundamentals of Network Engineering',
    issuer: 'Udemy',
    date: 'Dec 2025',
    image: '/Certificate/6.png',
    category: 'networking',
  },
  {
    id: 7,
    title: 'Build Google Cloud Infrastructure for AWS Professionals',
    issuer: 'Google Cloud',
    date: 'May 2025',
    image: '/Certificate/7.png',
    category: 'cloud',
  },
  {
    id: 8,
    title: 'JavaScript & React JS Bootcamp',
    issuer: 'GDG Ranchi · ShapeAI',
    date: '2022',
    image: '/Certificate/8.png',
    category: 'development',
  },
  {
    id: 9,
    title: 'The Git & Github Bootcamp',
    issuer: 'Udemy',
    date: 'April 2026',
    image: '/Certificate/9.png',
    category: 'development',
  },
];

const categoryMeta: Record<string, { color: string; label: string }> = {
  cloud: { color: '#38BDF8', label: 'Cloud' },
  networking: { color: '#FF6B35', label: 'Networking' },
  development: { color: '#A78BFA', label: 'Development' },
  security: { color: '#FF0080', label: 'Security' },
};

/* ─── Floating Particle Background ──────────────────────────── */
function FloatingOrbs() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
      {[...Array(6)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full"
          style={{
            width: `${60 + i * 30}px`,
            height: `${60 + i * 30}px`,
            top: `${10 + i * 15}%`,
            left: `${5 + i * 16}%`,
            background: `radial-gradient(circle, ${i % 2 === 0 ? 'rgba(255,0,128,0.08)' : 'rgba(255,107,53,0.08)'} 0%, transparent 70%)`,
            filter: 'blur(20px)',
          }}
          animate={{
            y: [0, -20 - i * 5, 0],
            x: [0, 10 + i * 3, 0],
            scale: [1, 1.1, 1],
          }}
          transition={{
            duration: 6 + i * 1.5,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: i * 0.8,
          }}
        />
      ))}
    </div>
  );
}

/* ─── Certificate Card ──────────────────────────────────────── */
function CertCard({
  cert,
  index,
  onOpen,
}: {
  cert: Certificate;
  index: number;
  onOpen: (idx: number) => void;
}) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-40px' });
  const { color, label } = categoryMeta[cert.category];
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [isHovering, setIsHovering] = useState(false);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setMousePos({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  }, []);

  return (
    <motion.div
      ref={ref}
      className="group relative rounded-2xl overflow-hidden cursor-pointer"
      initial={{ opacity: 0, y: 50, scale: 0.92 }}
      animate={isInView ? { opacity: 1, y: 0, scale: 1 } : {}}
      transition={{
        duration: 0.7,
        delay: index * 0.1,
        ease: [0.16, 1, 0.3, 1],
      }}
      onClick={() => onOpen(index)}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onOpen(index);
        }
      }}
      aria-label={`View certificate: ${cert.title}`}
    >
      {/* Spotlight follow effect */}
      {isHovering && (
        <div
          className="absolute inset-0 z-[1] pointer-events-none transition-opacity duration-300"
          style={{
            background: `radial-gradient(400px circle at ${mousePos.x}px ${mousePos.y}px, ${color}12, transparent 60%)`,
          }}
        />
      )}

      {/* Glass card body */}
      <div className="relative z-[2] bg-zinc-900/50 backdrop-blur-xl border border-zinc-800/60 rounded-2xl overflow-hidden transition-all duration-500 group-hover:border-zinc-700/60 group-hover:bg-zinc-900/70">

        {/* Top accent line */}
        <div
          className="h-[2px] w-full"
          style={{
            background: `linear-gradient(90deg, transparent 0%, ${color}80 50%, transparent 100%)`,
          }}
        />

        {/* Certificate Image */}
        <div className="relative w-full aspect-[4/3] overflow-hidden bg-zinc-950/80">
          <Image
            src={cert.image}
            alt={cert.title}
            fill
            sizes="(max-width: 640px) 90vw, (max-width: 1024px) 45vw, 30vw"
            className="object-cover object-top transition-all duration-700 ease-out group-hover:scale-[1.04]"
          />

          {/* Gradient vignette */}
          <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/90 via-transparent to-zinc-950/20 pointer-events-none" />

          {/* View badge on hover */}
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-500">
            <motion.span
              className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-white/95 px-4 py-2 rounded-full border border-white/20 backdrop-blur-xl"
              style={{ backgroundColor: `${color}25` }}
              initial={false}
              animate={isHovering ? { scale: 1, y: 0 } : { scale: 0.8, y: 10 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            >
              <ExternalLink className="w-3.5 h-3.5" />
              View
            </motion.span>
          </div>

          {/* Certificate number badge */}
          <div
            className="absolute top-3 right-3 w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-black border backdrop-blur-xl"
            style={{
              borderColor: `${color}40`,
              color,
              backgroundColor: `${color}10`,
            }}
          >
            {String(cert.id).padStart(2, '0')}
          </div>
        </div>

        {/* Info Section */}
        <div className="p-5 space-y-3">
          {/* Category + Date */}
          <div className="flex items-center justify-between">
            <span
              className="inline-flex items-center gap-1.5 text-[9px] font-black uppercase tracking-[0.15em] px-2.5 py-[5px] rounded-full border backdrop-blur-md"
              style={{
                borderColor: `${color}25`,
                color,
                backgroundColor: `${color}08`,
              }}
            >
              <ShieldCheck className="w-3 h-3" />
              {label}
            </span>
            <span className="text-[10px] text-zinc-500 font-mono tracking-wider">
              {cert.date}
            </span>
          </div>

          {/* Title */}
          <h4 className="text-[13px] md:text-sm font-bold text-zinc-100 leading-relaxed line-clamp-2 group-hover:text-white transition-colors duration-300">
            {cert.title}
          </h4>

          {/* Issuer */}
          <div className="flex items-center gap-2 pt-1 border-t border-zinc-800/40">
            <Award className="w-3.5 h-3.5 shrink-0" style={{ color: `${color}80` }} />
            <span className="text-[11px] text-zinc-500 font-medium">{cert.issuer}</span>
          </div>
        </div>
      </div>

      {/* Outer glow on hover */}
      <div
        className="absolute -inset-[1px] rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none -z-[1]"
        style={{
          boxShadow: `0 0 40px ${color}15, 0 0 80px ${color}08`,
        }}
      />
    </motion.div>
  );
}

/* ─── Lightbox ──────────────────────────────────────────────── */
function Lightbox({
  cert,
  onClose,
  onPrev,
  onNext,
  hasPrev,
  hasNext,
}: {
  cert: Certificate;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
  hasPrev: boolean;
  hasNext: boolean;
}) {
  const { color, label } = categoryMeta[cert.category];

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft' && hasPrev) onPrev();
      if (e.key === 'ArrowRight' && hasNext) onNext();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose, onPrev, onNext, hasPrev, hasNext]);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  return (
    <motion.div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Backdrop */}
      <motion.div
        className="absolute inset-0 bg-black/90 backdrop-blur-xl"
        onClick={onClose}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      />

      {/* Close */}
      <button
        onClick={onClose}
        className="absolute top-5 right-5 z-20 w-11 h-11 rounded-full bg-zinc-900/90 border border-zinc-700/60 flex items-center justify-center text-zinc-400 hover:text-white hover:border-zinc-600 transition-all duration-200 backdrop-blur-md"
        aria-label="Close lightbox"
      >
        <X className="w-5 h-5" />
      </button>

      {/* Navigation */}
      {hasPrev && (
        <button
          onClick={(e) => { e.stopPropagation(); onPrev(); }}
          className="absolute left-3 md:left-6 z-20 w-11 h-11 rounded-full bg-zinc-900/90 border border-zinc-700/60 flex items-center justify-center text-zinc-400 hover:text-white hover:border-zinc-600 transition-all duration-200 backdrop-blur-md"
          aria-label="Previous certificate"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
      )}
      {hasNext && (
        <button
          onClick={(e) => { e.stopPropagation(); onNext(); }}
          className="absolute right-3 md:right-6 z-20 w-11 h-11 rounded-full bg-zinc-900/90 border border-zinc-700/60 flex items-center justify-center text-zinc-400 hover:text-white hover:border-zinc-600 transition-all duration-200 backdrop-blur-md"
          aria-label="Next certificate"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      )}

      {/* Content */}
      <motion.div
        className="relative z-10 w-full max-w-4xl flex flex-col items-center gap-6"
        initial={{ scale: 0.9, y: 40, opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        exit={{ scale: 0.9, y: 40, opacity: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Image container */}
        <div className="relative w-full rounded-xl overflow-hidden border border-zinc-700/40 shadow-2xl bg-zinc-950">
          {/* Top glow */}
          <div
            className="absolute top-0 left-0 right-0 h-[3px] z-10"
            style={{
              background: `linear-gradient(90deg, transparent, ${color}, transparent)`,
            }}
          />
          <Image
            src={cert.image}
            alt={cert.title}
            width={1200}
            height={850}
            className="w-full h-auto object-contain"
            priority
          />
        </div>

        {/* Caption bar */}
        <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-6 bg-zinc-900/80 backdrop-blur-xl border border-zinc-800/50 rounded-full px-6 py-3">
          <span
            className="inline-flex items-center gap-1.5 text-[9px] font-black uppercase tracking-[0.15em] px-2.5 py-[4px] rounded-full border"
            style={{
              borderColor: `${color}30`,
              color,
              backgroundColor: `${color}10`,
            }}
          >
            <BadgeCheck className="w-3 h-3" />
            {label}
          </span>
          <h3 className="text-sm md:text-base font-bold text-white text-center leading-snug">
            {cert.title}
          </h3>
          <span className="text-xs text-zinc-500 font-medium whitespace-nowrap">
            {cert.issuer} · {cert.date}
          </span>
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ─── Stats Counter ─────────────────────────────────────────── */
function AnimatedCount({ value, label }: { value: number; label: string }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!isInView) return;
    let frame: number;
    const duration = 1500;
    const start = performance.now();

    const animate = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
      setCount(Math.round(eased * value));
      if (progress < 1) frame = requestAnimationFrame(animate);
    };

    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, [isInView, value]);

  return (
    <div ref={ref} className="text-center">
      <div className="text-3xl md:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white to-zinc-400">
        {count}
        <span className="text-[#FF0080]">+</span>
      </div>
      <div className="text-[10px] uppercase tracking-[0.2em] text-zinc-500 font-semibold mt-1">
        {label}
      </div>
    </div>
  );
}

/* ─── Main Section ──────────────────────────────────────────── */
export default function Certificates() {
  const sectionRef = useRef(null);
  const isInView = useInView(sectionRef, { once: true, margin: '-80px' });
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const openLightbox = useCallback((idx: number) => setLightboxIndex(idx), []);
  const closeLightbox = useCallback(() => setLightboxIndex(null), []);
  const goPrev = useCallback(
    () => setLightboxIndex((prev) => (prev !== null && prev > 0 ? prev - 1 : prev)),
    []
  );
  const goNext = useCallback(
    () =>
      setLightboxIndex((prev) =>
        prev !== null && prev < certificates.length - 1 ? prev + 1 : prev
      ),
    []
  );

  // Unique category count
  const uniqueCategories = new Set(certificates.map((c) => c.category)).size;

  return (
    <>
      <section
        ref={sectionRef}
        id="certification"
        className="relative w-full bg-[#050505] flex flex-col items-center justify-start overflow-hidden py-24 md:py-32"
      >
        {/* Grid background */}
        <div
          className="absolute inset-0 z-0 opacity-[0.03] pointer-events-none"
          style={{
            backgroundImage: `
              linear-gradient(to right, #ffffff 1px, transparent 1px),
              linear-gradient(to bottom, #ffffff 1px, transparent 1px)
            `,
            backgroundSize: '4rem 4rem',
            maskImage:
              'radial-gradient(ellipse 80% 80% at 50% 50%, #000 20%, transparent 100%)',
            WebkitMaskImage:
              'radial-gradient(ellipse 80% 80% at 50% 50%, #000 20%, transparent 100%)',
          }}
        />

        {/* Breathing ambient glows */}
        <motion.div
          className="absolute top-[10%] left-[5%] w-[300px] md:w-[500px] h-[300px] md:h-[500px] bg-[#FF0080] rounded-full blur-[160px] mix-blend-screen pointer-events-none"
          animate={{ opacity: [0.05, 0.12, 0.05] }}
          transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
          style={{ willChange: 'opacity' }}
        />
        <motion.div
          className="absolute bottom-[10%] right-[5%] w-[300px] md:w-[500px] h-[300px] md:h-[500px] bg-[#FF6B35] rounded-full blur-[160px] mix-blend-screen pointer-events-none"
          animate={{ opacity: [0.05, 0.12, 0.05] }}
          transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut', delay: 1.5 }}
          style={{ willChange: 'opacity' }}
        />
        <motion.div
          className="absolute top-[60%] left-[50%] w-[200px] md:w-[350px] h-[200px] md:h-[350px] bg-[#38BDF8] rounded-full blur-[140px] mix-blend-screen pointer-events-none"
          animate={{ opacity: [0.03, 0.07, 0.03] }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut', delay: 3 }}
          style={{ willChange: 'opacity' }}
        />

        <FloatingOrbs />

        <div className="container mx-auto px-6 max-w-7xl relative z-10">
          {/* ── Section Header ── */}
          <motion.div
            className="text-center mb-16 md:mb-20"
            initial={{ opacity: 0, y: 30 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.7, ease: 'easeOut' }}
          >
            <motion.div
              className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.3em] text-zinc-500 mb-6 border border-zinc-800/50 rounded-full px-4 py-1.5 bg-zinc-900/30 backdrop-blur-md"
              initial={{ opacity: 0, y: 10 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <BadgeCheck className="w-3.5 h-3.5 text-[#FF0080]" />
              Credentials Earned
            </motion.div>

            <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-5">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FF0080] via-[#FF4060] to-[#FF6B35]">
                Certifications
              </span>
            </h2>
            <p className="text-zinc-500 text-sm md:text-base max-w-lg mx-auto leading-relaxed">
              Credentials that validate expertise across cloud, networking, security, and development.
            </p>
          </motion.div>

          {/* ── Stats Row ── */}
          <motion.div
            className="flex items-center justify-center gap-10 md:gap-16 mb-16 md:mb-20"
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <AnimatedCount value={certificates.length} label="Certificates" />
            <div className="w-px h-10 bg-zinc-800" />
            <AnimatedCount value={uniqueCategories} label="Domains" />
            <div className="w-px h-10 bg-zinc-800" />
            <AnimatedCount value={6} label="Platforms" />
          </motion.div>

          {/* ── Certificate Grid ── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-7">
            {certificates.map((cert, idx) => (
              <CertCard
                key={cert.id}
                cert={cert}
                index={idx}
                onOpen={openLightbox}
              />
            ))}
          </div>
        </div>
      </section>

      {/* ── Lightbox ── */}
      <AnimatePresence>
        {lightboxIndex !== null && (
          <Lightbox
            key={certificates[lightboxIndex].id}
            cert={certificates[lightboxIndex]}
            onClose={closeLightbox}
            onPrev={goPrev}
            onNext={goNext}
            hasPrev={lightboxIndex > 0}
            hasNext={lightboxIndex < certificates.length - 1}
          />
        )}
      </AnimatePresence>
    </>
  );
}
