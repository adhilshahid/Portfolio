'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, useInView, useSpring, useTransform } from 'framer-motion';
import { Server, Network, Cloud, Activity, ArrowRight, Share2, Terminal } from 'lucide-react';

// Canvas Particle Network Background
const ParticleNetwork = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let particlesArray: Particle[] = [];
    let animationFrameId: number;

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = canvas.parentElement?.clientHeight || window.innerHeight;
    };

    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();

    class Particle {
      x: number;
      y: number;
      size: number;
      speedX: number;
      speedY: number;
      color: string;

      constructor() {
        this.x = Math.random() * canvas!.width;
        this.y = Math.random() * canvas!.height;
        this.size = Math.random() * 2 + 0.5;
        this.speedX = Math.random() * 1 - 0.5;
        this.speedY = Math.random() * 1 - 0.5;
        
        // Calculate color based on X position to simulate transition (#FF0080 -> #FF6B35)
        this.color = this.getColor(this.x);
      }

      getColor(x: number) {
        const ratio = Math.max(0, Math.min(1, x / canvas!.width));
        // Simple RGB interpolation between FF0080 (255, 0, 128) and FF6B35 (255, 107, 53)
        const r = 255;
        const g = Math.floor(0 + ratio * (107 - 0));
        const b = Math.floor(128 + ratio * (53 - 128));
        return `rgba(${r}, ${g}, ${b}, 0.5)`;
      }

      update() {
        if (!canvas) return;
        this.x += this.speedX;
        this.y += this.speedY;

        // Bounce
        if (this.x > canvas.width || this.x < 0) this.speedX = -this.speedX;
        if (this.y > canvas.height || this.y < 0) this.speedY = -this.speedY;

        // Re-calculate color based on new position
        this.color = this.getColor(this.x);
      }

      draw() {
        if (!ctx) return;
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    const init = () => {
      particlesArray = [];
      const numberOfParticles = (canvas.width * canvas.height) / 12000;
      for (let i = 0; i < numberOfParticles; i++) {
        particlesArray.push(new Particle());
      }
    };

    const connect = () => {
      let opacity = 1;
      for (let a = 0; a < particlesArray.length; a++) {
        for (let b = a; b < particlesArray.length; b++) {
          const dx = particlesArray[a].x - particlesArray[b].x;
          const dy = particlesArray[a].y - particlesArray[b].y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance < 120) {
            opacity = 1 - distance / 120;
            // Use average color of the two particles for the line
            const ratio = (particlesArray[a].x + particlesArray[b].x) / 2 / canvas.width;
            const r = 255;
            const g = Math.floor(0 + ratio * 107);
            const bVal = Math.floor(128 + ratio * (53 - 128));
            
            ctx!.strokeStyle = `rgba(${r}, ${g}, ${bVal}, ${opacity * 0.15})`;
            ctx!.lineWidth = 1;
            ctx!.beginPath();
            ctx!.moveTo(particlesArray[a].x, particlesArray[a].y);
            ctx!.lineTo(particlesArray[b].x, particlesArray[b].y);
            ctx!.stroke();
          }
        }
      }
    };

    const animate = () => {
      if (!ctx || !canvas) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (let i = 0; i < particlesArray.length; i++) {
        particlesArray[i].update();
        particlesArray[i].draw();
      }
      connect();
      animationFrameId = requestAnimationFrame(animate);
    };

    init();
    animate();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute top-0 left-0 w-full h-full pointer-events-none opacity-40 z-0"
    />
  );
};

// Animated Number Component
const AnimatedNumber = ({ value, duration = 2, suffix = '' }: { value: number, duration?: number, suffix?: string }) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const springValue = useSpring(0, {
    duration: duration * 1000,
    bounce: 0,
  });
  const [displayValue, setDisplayValue] = useState("0");

  useEffect(() => {
    if (isInView) {
      springValue.set(value);
    }
  }, [isInView, springValue, value]);

  useEffect(() => {
    return springValue.on("change", (latest) => {
      setDisplayValue(Math.floor(latest).toString());
    });
  }, [springValue]);

  return (
    <div ref={ref} className="font-bold text-5xl md:text-6xl text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]">
      {displayValue}{suffix}
    </div>
  );
};

export default function About() {
  const containerRef = useRef(null);
  const isInView = useInView(containerRef, { once: true, margin: "-100px" });

  const staggerChildren = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
      },
    },
  };

  const slideUp = {
    hidden: { opacity: 0, y: 50 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.7, ease: "easeOut" }
    },
  };

  return (
    <section 
      id="about" 
      ref={containerRef}
      className="relative w-full min-h-screen bg-[#050505] flex items-center justify-center overflow-hidden py-24 md:py-32"
    >
      <ParticleNetwork />
      
      {/* Subtle background gradients for depth */}
      <div className="absolute top-1/4 left-0 w-[500px] h-[500px] bg-[#FF0080] rounded-full blur-[150px] opacity-10 pointer-events-none mix-blend-screen" />
      <div className="absolute bottom-1/4 right-0 w-[500px] h-[500px] bg-[#FF6B35] rounded-full blur-[150px] opacity-10 pointer-events-none mix-blend-screen" />

      <div className="container mx-auto px-6 max-w-6xl relative z-10">
        <motion.div 
          className="max-w-4xl mx-auto"
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          variants={staggerChildren}
        >
          {/* Header */}
          <motion.div variants={slideUp} className="text-center mb-16">
            <h2 className="text-sm uppercase tracking-[0.3em] text-zinc-500 font-semibold mb-6">About Me</h2>
            <h3 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-8">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FF0080] to-[#FF6B35]">
                Network engineer going cloud-native
              </span>
            </h3>
            <p className="text-lg md:text-xl text-zinc-300/80 leading-relaxed max-w-3xl mx-auto">
              Managed enterprise networks at scale - 2000+ stores, 99% uptime as a Network Administrator - LAN/WAN, VLANs, DHCP, Firewalls. Now I'm taking that infrastructure instinct into the cloud - pursuing AWS/Azure certifications, building cloud-native projects, and combining my networking foundation with DevOps and automation skills.
            </p>
          </motion.div>

          {/* Journey Timeline */}
          <motion.div variants={slideUp} className="flex flex-col md:flex-row items-center justify-between gap-6 md:gap-4 mb-24">
            
            {/* Left Card: Network Era */}
            <div className="flex-1 w-full bg-zinc-900/40 backdrop-blur-md border border-zinc-800/50 rounded-2xl p-8 hover:bg-zinc-900/60 transition-all duration-500 group relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-zinc-700 to-[#FF0080] opacity-50" />
              <div className="flex items-center gap-4 mb-6 text-[#FF0080]">
                <div className="p-3 bg-[#FF0080]/10 rounded-xl group-hover:scale-110 transition-transform duration-300">
                  <Server className="w-6 h-6" />
                </div>
                <div className="p-3 bg-[#FF0080]/10 rounded-xl group-hover:scale-110 transition-transform duration-300 delay-75">
                  <Network className="w-6 h-6" />
                </div>
              </div>
              <h4 className="text-xl font-bold text-white mb-2">Network Era</h4>
              <p className="text-sm text-zinc-400 leading-relaxed">
                Enterprise Networks, LAN/WAN, VLANs, DHCP, Firewalls
              </p>
            </div>

            {/* Center Path */}
            <div className="hidden md:flex flex-col items-center justify-center relative w-24">
              <div className="w-full h-[2px] bg-gradient-to-r from-[#FF0080] to-[#FF6B35] relative">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 p-2 bg-[#050505] rounded-full border border-zinc-800">
                  <ArrowRight className="w-5 h-5 text-white animate-pulse" />
                </div>
              </div>
            </div>

            <div className="md:hidden flex justify-center w-full py-2">
              <ArrowRight className="w-6 h-6 text-white rotate-90 opacity-50" />
            </div>

            {/* Right Card: Cloud Era */}
            <div className="flex-1 w-full bg-zinc-900/40 backdrop-blur-md border border-zinc-800/50 rounded-2xl p-8 hover:bg-zinc-900/60 transition-all duration-500 group relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#FF6B35] to-zinc-700 opacity-50" />
              <div className="flex items-center gap-4 mb-6 text-[#FF6B35]">
                <div className="p-3 bg-[#FF6B35]/10 rounded-xl group-hover:scale-110 transition-transform duration-300">
                  <Cloud className="w-6 h-6" />
                </div>
                <div className="p-3 bg-[#FF6B35]/10 rounded-xl group-hover:scale-110 transition-transform duration-300 delay-75">
                  <Terminal className="w-6 h-6" />
                </div>
              </div>
              <h4 className="text-xl font-bold text-white mb-2">Cloud Era</h4>
              <p className="text-sm text-zinc-400 leading-relaxed">
                AWS, Azure, DevOps, Automation, Infrastructure as Code
              </p>
            </div>

          </motion.div>

          {/* Stats section */}
          <motion.div variants={slideUp} className="grid grid-cols-1 md:grid-cols-2 gap-12 max-w-2xl mx-auto">
            <div className="text-center p-6 relative">
              <div className="mb-2">
                <AnimatedNumber value={2000} duration={2} suffix="+" />
              </div>
              <div className="text-sm uppercase tracking-widest text-[#FF0080] font-semibold mt-4">
                Stores Managed
              </div>
            </div>
            
            <div className="text-center p-6 relative">
              <div className="mb-2">
                <AnimatedNumber value={99} duration={2} suffix="%" />
              </div>
              <div className="text-sm uppercase tracking-widest text-[#FF6B35] font-semibold mt-4">
                Network Uptime
              </div>
            </div>
          </motion.div>

        </motion.div>
      </div>
    </section>
  );
}
