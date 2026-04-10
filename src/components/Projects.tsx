'use client';

import { motion } from 'framer-motion';
import { ArrowUpRight, Code2, ExternalLink } from 'lucide-react';

const PROJECTS = [
  {
    id: 1,
    title: 'Neon Nexus',
    description: 'A high-performance cyberpunk-themed e-commerce platform built with Next.js and WebGL.',
    tags: ['Next.js', 'Three.js', 'Tailwind'],
  },
  {
    id: 2,
    title: 'Aura UI',
    description: 'A deeply customizable component library focusing on fluid animations and accessible glassmorphism.',
    tags: ['React', 'Framer Motion', 'Radix'],
  },
  {
    id: 3,
    title: 'Quantum Ledger',
    description: 'A fintech dashboard rendering thousands of live data points at 60fps using Canvas APIs.',
    tags: ['TypeScript', 'Canvas', 'Zustand'],
  },
  {
    id: 4,
    title: 'Echoes of Earth',
    description: 'An interactive scrollytelling experience meant to raise awareness about global micro-climates.',
    tags: ['WebGL', 'GSAP', 'Next.js'],
  }
];

export default function Projects() {
  return (
    <section className="relative w-full bg-[#050505] py-32 px-6 md:px-12 lg:px-24">
      <div className="max-w-7xl mx-auto">
        <motion.div 
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          viewport={{ once: true, margin: "-100px" }}
          className="mb-20"
        >
          <h2 className="text-4xl md:text-6xl font-medium tracking-tight text-white mb-6">
            Selected Works
          </h2>
          <div className="h-px w-full bg-gradient-to-r from-zinc-800 to-transparent" />
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {PROJECTS.map((project, i) => (
            <motion.div
              key={project.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: i * 0.1, ease: 'easeOut' }}
              viewport={{ once: true }}
              className="group relative overflow-hidden rounded-2xl bg-zinc-900/40 backdrop-blur-md border border-white/10 p-8 hover:border-white/20 transition-colors duration-500"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              
              <div className="relative z-10 flex flex-col h-full">
                <div className="flex justify-between items-start mb-6">
                  <h3 className="text-2xl font-semibold text-white tracking-tight">
                    {project.title}
                  </h3>
                  <a href="#" className="p-2 rounded-full bg-white/5 hover:bg-white/10 text-white/70 hover:text-white transition-all transform group-hover:-translate-y-1 group-hover:translate-x-1 duration-300">
                    <ArrowUpRight className="w-5 h-5" />
                  </a>
                </div>
                
                <p className="text-zinc-400 mb-10 leading-relaxed font-light">
                  {project.description}
                </p>
                
                <div className="mt-auto flex items-center justify-between">
                  <div className="flex gap-2 flex-wrap">
                    {project.tags.map(tag => (
                      <span key={tag} className="text-xs font-mono tracking-wider px-3 py-1 bg-black/50 rounded-full border border-white/5 text-zinc-300">
                        {tag}
                      </span>
                    ))}
                  </div>
                  <div className="flex gap-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300 text-zinc-400">
                    <a href="#" className="hover:text-white transition-colors"><Code2 className="w-5 h-5"/></a>
                    <a href="#" className="hover:text-white transition-colors"><ExternalLink className="w-5 h-5"/></a>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
