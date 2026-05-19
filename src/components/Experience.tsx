'use client';

import { useRef, useState, useEffect } from 'react';
import { motion, useScroll, useTransform, useInView } from 'framer-motion';
import { Network, Code, MapPin, Calendar, Building2 } from 'lucide-react';

const experiences = [
  {
    id: 1,
    role: "Network Administrator",
    company: "Tata Consultancy Services",
    location: "Trivandrum, Kerala, India",
    date: "Dec 2023 - Present",
    color: "#FF0080", // Pink
    icon: <Network className="w-6 h-6" />,
    points: [
      "Managed and maintained LAN/WAN networks for 2000+ stores, ensuring 99% uptime and secure connectivity.",
      "Designed a real-time web-based network monitoring application integrating Aruba Central REST APIs with a Node.js/Express.js backend.",
      "Optimized VLAN configurations, DHCP services, and IPAM across multiple locations to improve security and scalability."
    ]
  },
  {
    id: 2,
    role: "Web Developer Intern",
    company: "Revertech IT Solutions",
    location: "Kochi, Kerala, India",
    date: "2022",
    color: "#FF6B35", // Orange
    icon: <Code className="w-6 h-6" />,
    points: [
      "Developed a full-stack event ticketing web application using Python, Flask, and MongoDB.",
      "Implemented secure authentication and a comprehensive order management system for real-time ticket tracking.",
      "Designed and integrated responsive UI components with full CRUD functionality using modern web technologies."
    ]
  }
];

const TimelineItem = ({ exp, index }: { exp: typeof experiences[0], index: number }) => {
  const isEven = index % 2 === 0;
  const itemRef = useRef(null);
  const isInView = useInView(itemRef, { once: true, margin: "-100px" });

  return (
    <div ref={itemRef} className="relative flex items-center justify-center w-full mb-24 last:mb-0">
      
      {/* Mobile/Default Layout (Single Column) hidden on md and up */}
      <div className="w-full md:hidden flex flex-col gap-6 pl-12 relative">
        <motion.div 
          className="absolute left-0 top-0 w-8 h-8 rounded-full z-10 flex items-center justify-center shadow-[0_0_15px_rgba(255,0,128,0.5)]"
          style={{ backgroundColor: exp.color, boxShadow: `0 0 20px ${exp.color}80` }}
          initial={{ scale: 0 }}
          animate={isInView ? { scale: 1 } : { scale: 0 }}
          transition={{ duration: 0.5, delay: 0.2, type: 'spring' }}
        >
          <div className="text-[#050505] scale-[0.5]">{exp.icon}</div>
        </motion.div>
        
        <Card exp={exp} isInView={isInView} delay={0.3} direction={1} />
      </div>

      {/* Desktop Layout (Alternating) */}
      <div className="hidden md:flex w-full items-center justify-between">
        {/* Left Side */}
        <div className={`w-[45%] flex ${isEven ? 'justify-end' : 'justify-start'}`}>
          {isEven && <Card exp={exp} isInView={isInView} delay={0.3} direction={-1} />}
        </div>

        {/* Center Node */}
        <div className="w-[10%] flex justify-center relative z-20">
          <motion.div 
            className="w-12 h-12 rounded-full flex items-center justify-center relative"
            style={{ backgroundColor: exp.color, boxShadow: `0 0 25px ${exp.color}90` }}
            initial={{ scale: 0 }}
            animate={isInView ? { scale: 1 } : { scale: 0 }}
            transition={{ duration: 0.5, delay: 0.2, type: 'spring' }}
          >
            <div className="absolute inset-0 rounded-full animate-ping opacity-20" style={{ backgroundColor: exp.color }}></div>
            <div className="text-[#050505] scale-[0.6]">{exp.icon}</div>
          </motion.div>
        </div>

        {/* Right Side */}
        <div className={`w-[45%] flex ${isEven ? 'justify-start' : 'justify-end'}`}>
          {!isEven && <Card exp={exp} isInView={isInView} delay={0.3} direction={1} />}
        </div>
      </div>
      
    </div>
  );
};

const Card = ({ exp, isInView, delay, direction }: { exp: typeof experiences[0], isInView: boolean, delay: number, direction: number }) => {
  return (
    <motion.div 
      className="w-full bg-zinc-900/40 backdrop-blur-md border border-zinc-800/50 rounded-2xl p-8 hover:bg-zinc-900/60 transition-all duration-500 group relative overflow-hidden"
      initial={{ opacity: 0, x: 50 * direction }}
      animate={isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: 50 * direction }}
      transition={{ duration: 0.7, delay, ease: "easeOut" }}
    >
      {/* Top Gradient Accent */}
      <div className="absolute top-0 left-0 w-full h-1 opacity-50" style={{ background: `linear-gradient(90deg, transparent, ${exp.color}, transparent)` }} />
      
      <div className="flex flex-col gap-4">
        {/* Header Section */}
        <div className="flex flex-col gap-3 mb-1">
          {/* Badge & Location */}
          <div className="flex items-center justify-between">
            <div className="text-xs font-semibold uppercase tracking-wider px-3 py-1 rounded-full border backdrop-blur-md transition-colors duration-300 group-hover:bg-opacity-20" 
                 style={{ borderColor: `${exp.color}30`, color: exp.color, backgroundColor: `${exp.color}10` }}>
              {exp.date}
            </div>
            <div className="flex items-center gap-1.5 text-xs text-zinc-500 font-medium">
              <MapPin className="w-3.5 h-3.5" />
              <span>{exp.location}</span>
            </div>
          </div>
          
          {/* Title & Company */}
          <div className="mt-2">
            <div className="relative inline-block mb-1">
              <h4 className="relative z-10 text-2xl md:text-3xl font-extrabold tracking-tight mb-1 group-hover:drop-shadow-[0_0_10px_rgba(255,255,255,0.25)]">
                {/* Default white text */}
                <span className="text-white transition-opacity duration-500 group-hover:opacity-0">
                  {exp.role}
                </span>
                {/* Hover gradient text */}
                <span className="absolute left-0 top-0 text-transparent bg-clip-text opacity-0 transition-opacity duration-500 group-hover:opacity-100" 
                      style={{ backgroundImage: `linear-gradient(135deg, #ffffff 0%, ${exp.color} 100%)` }}>
                  {exp.role}
                </span>
              </h4>
              {/* Animated Glowing Underline */}
              <div 
                className="absolute -bottom-1 left-0 h-[2px] w-0 rounded-full opacity-0 transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:w-full group-hover:opacity-100"
                style={{ 
                  backgroundColor: exp.color,
                  boxShadow: `0 2px 15px 2px ${exp.color}80, 0 0 5px 1px ${exp.color}40`
                }}
              />
            </div>
            <div className="text-base md:text-lg font-medium text-zinc-400 flex items-center mt-1">
              <Building2 className="w-4 h-4 mr-2 opacity-80" style={{ color: exp.color }} />
              <span className="text-zinc-300">{exp.company}</span>
            </div>
          </div>
        </div>

        {/* Bullet Points */}
        <ul className="mt-4 space-y-3">
          {exp.points.map((point, i) => (
            <li key={i} className="text-zinc-400 leading-relaxed text-sm md:text-base flex items-start">
              <span className="mr-3 mt-1.5 w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: exp.color, opacity: 0.7 }} />
              {point}
            </li>
          ))}
        </ul>
      </div>
    </motion.div>
  );
};

export default function Experience() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isScrolling, setIsScrolling] = useState(false);
  
  useEffect(() => {
    let timeout: NodeJS.Timeout;
    const handleScroll = () => {
      setIsScrolling(true);
      clearTimeout(timeout);
      timeout = setTimeout(() => setIsScrolling(false), 150);
    };
    
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
      clearTimeout(timeout);
    };
  }, []);
  
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start center", "end center"]
  });

  // Scale the line height from 0 to 1 based on scroll
  const scaleY = useTransform(scrollYProgress, [0, 1], [0, 1]);

  return (
    <section 
      id="experience" 
      className="relative w-full min-h-screen bg-[#050505] flex flex-col items-center justify-start overflow-hidden py-24 md:py-32"
    >
      {/* Tech Grid Background */}
      <div 
        className="absolute inset-0 z-0 opacity-[0.04] pointer-events-none"
        style={{
          backgroundImage: `
            linear-gradient(to right, #ffffff 1px, transparent 1px),
            linear-gradient(to bottom, #ffffff 1px, transparent 1px)
          `,
          backgroundSize: '4rem 4rem',
          maskImage: 'radial-gradient(ellipse 80% 80% at 50% 50%, #000 20%, transparent 100%)',
          WebkitMaskImage: 'radial-gradient(ellipse 80% 80% at 50% 50%, #000 20%, transparent 100%)'
        }}
      />

      {/* Optimized Ambient Breathing Glows */}
      <motion.div 
        className="absolute top-[10%] right-[5%] w-[400px] md:w-[600px] h-[400px] md:h-[600px] bg-[#FF0080] rounded-full blur-[150px] mix-blend-screen pointer-events-none" 
        animate={{ opacity: [0.08, 0.15, 0.08] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        style={{ willChange: 'opacity' }}
      />
      <motion.div 
        className="absolute bottom-[10%] left-[5%] w-[400px] md:w-[600px] h-[400px] md:h-[600px] bg-[#FF6B35] rounded-full blur-[150px] mix-blend-screen pointer-events-none" 
        animate={{ opacity: [0.08, 0.15, 0.08] }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
        style={{ willChange: 'opacity' }}
      />

      <div className="container mx-auto px-6 max-w-6xl relative z-10">
        
        {/* Header */}
        <div className="text-center mb-20 md:mb-32">
          <h2 className="text-sm uppercase tracking-[0.3em] text-zinc-500 font-semibold mb-6">Career Path</h2>
          <h3 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-8">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FF0080] to-[#FF6B35]">
              Work Experience
            </span>
          </h3>
        </div>

        <div className="relative max-w-5xl mx-auto" ref={containerRef}>
          
          {/* The Glowing Animated Central Line */}
          <div className="absolute left-[16px] md:left-1/2 md:-translate-x-1/2 top-0 bottom-0 w-[2px] bg-zinc-800/50 z-0">
            {/* The Drawn Line */}
            <motion.div 
              className="absolute top-0 left-0 w-full origin-top bg-gradient-to-b from-[#FF0080] to-[#FF6B35] transition-[filter] duration-300"
              animate={{
                filter: isScrolling 
                  ? "drop-shadow(0 0 15px rgba(255,0,128,0.9)) drop-shadow(0 0 30px rgba(255,107,53,0.8))" 
                  : "drop-shadow(0 0 5px rgba(255,0,128,0.4))"
              }}
              style={{ scaleY, height: "100%" }}
            />
            {/* The Moving Spark */}
            <motion.div
              className="absolute left-1/2 -translate-x-1/2 w-2.5 h-2.5 bg-white rounded-full z-30"
              animate={isScrolling ? {
                opacity: [0.9, 0.6, 1, 0.7, 0.9],
                scale: [1, 1.1, 0.95, 1.05, 1],
                boxShadow: [
                  "0 0 15px 3px #FF0080, 0 0 30px 6px #FF6B35",
                  "0 0 10px 2px #FF0080, 0 0 20px 4px #FF6B35",
                  "0 0 20px 4px #FF0080, 0 0 40px 8px #FF6B35",
                ]
              } : {
                opacity: 0.8,
                scale: 1,
                boxShadow: "0 0 10px 2px #FF0080"
              }}
              transition={isScrolling ? { duration: 0.25, repeat: Infinity, ease: "linear" } : { duration: 0.5 }}
              style={{ 
                 top: useTransform(scrollYProgress, [0, 1], ["0%", "100%"]),
                 marginTop: "-5px"
              }}
            >
              <div className="w-full h-full bg-white rounded-full" />
            </motion.div>
          </div>

          {/* Timeline Items */}
          <div className="flex flex-col w-full relative z-10 pt-8 pb-16">
            {experiences.map((exp, index) => (
              <TimelineItem key={exp.id} exp={exp} index={index} />
            ))}
          </div>

        </div>
      </div>
    </section>
  );
}
