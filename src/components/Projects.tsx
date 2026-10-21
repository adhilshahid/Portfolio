'use client';

import { useRef } from 'react';
import type { ReactNode } from 'react';
import { motion, useInView } from 'framer-motion';
import { ArrowUpRight } from 'lucide-react';
import EventMesh from './projects/EventMesh';
import CloudFlowPipeline from './projects/CloudFlowPipeline';
import ComplianceCheck from './projects/ComplianceCheck';
import RequestTrace from './projects/RequestTrace';
import { displayFont, monoFont } from './projects/fonts';

/* ─── Types ─────────────────────────────────────────────────── */
interface Project {
  slug: string;
  name: string;
  kicker: string;
  year?: string;
  summary: string;
  stack: string[];
  repo?: string;
  live?: string;
  /** Optional visual shown under the header (live demo, screenshot, …). */
  media?: ReactNode;
}

/* ─── Data ──────────────────────────────────────────────────── */
const projects: Project[] = [
  {
    slug: 'cloudflow-invoice-ai',
    name: 'CloudFlow Invoice AI',
    kicker: 'AWS · Serverless · AI',
    year: '2026',
    summary:
      'Event-driven AWS pipeline that reads invoices with AI, files them by vendor and tracks payments on a live dashboard. Failed files are retried, parked in a dead-letter queue and raise an alarm.',
    stack: ['Lambda', 'S3', 'SQS', 'SNS', 'CloudWatch', 'Python', 'OpenRouter'],
    repo: 'https://github.com/adhilshahid/CloudFlow-Invoice-AI',
    media: <CloudFlowPipeline />,
  },
  {
    slug: 'network-config-compliance',
    name: 'Network Config Compliance Automation',
    kicker: 'Network Automation · Python',
    summary:
      'Backs up Cisco SD-WAN and Aruba configs over SSH and the vManage API, normalises them per store, validates every interface against expected subnets, helpers, VRRP and security zones, and appends auditable PASS/FAIL rows to Excel.',
    stack: ['Python', 'Netmiko', 'vManage API', 'pandas', 'openpyxl', 'PowerShell'],
    media: <ComplianceCheck />,
  },
  {
    slug: 'campquest',
    name: 'CampQuest',
    kicker: 'Full-Stack · Node.js',
    summary:
      'Full-stack campground review app with RESTful routes, Passport authentication, author-only edit and delete, Joi validation, flash messages and cascading review cleanup in MongoDB.',
    stack: ['Node.js', 'Express', 'MongoDB', 'Mongoose', 'Passport', 'Joi', 'EJS', 'Bootstrap'],
    repo: 'https://github.com/adhilshahid/CampQuest',
    media: <RequestTrace />,
  },
];

/* ─── Bits ──────────────────────────────────────────────────── */
function GitHubMark() {
  return (
    <svg viewBox="0 0 16 16" className="h-4 w-4" fill="currentColor" aria-hidden="true">
      <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
    </svg>
  );
}

const linkClass =
  'group inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-sm font-medium text-zinc-200 transition-colors hover:border-[#FF0080]/50 hover:bg-[#FF0080]/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0A0A0D]';

function ProjectCase({ project }: { project: Project }) {
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });

  return (
    <motion.article
      ref={ref}
      aria-labelledby={`${project.slug}-title`}
      className="relative rounded-[24px] border border-white/[0.07] bg-[#0A0A0D]/85 p-4 shadow-[0_40px_120px_-40px_rgba(255,0,128,0.18)] backdrop-blur-sm sm:p-6 lg:p-7"
      initial={{ opacity: 0, y: 40 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
    >
      <header className="mb-5 grid gap-x-10 gap-y-4 lg:mb-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)]">
        <div>
          <p className={`${monoFont.className} mb-3 flex items-center gap-3 text-[11px] uppercase tracking-[0.2em] text-zinc-500`}>
            <span>{project.kicker}</span>
            {project.year && (
              <>
                <span className="h-px w-6 bg-zinc-700" aria-hidden="true" />
                <span>{project.year}</span>
              </>
            )}
          </p>
          <h3
            id={`${project.slug}-title`}
            className={`${displayFont.className} text-[2.25rem] leading-[0.95] text-white sm:text-5xl`}
          >
            {project.name}
          </h3>
        </div>

        <div className="lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:self-end">
          <p className="text-[14.5px] leading-relaxed text-zinc-400">{project.summary}</p>
          <ul className="mt-4 flex flex-wrap gap-1.5" aria-label="Tech stack">
            {project.stack.map((t) => (
              <li
                key={t}
                className={`${monoFont.className} rounded-full border border-white/[0.08] bg-white/[0.02] px-2.5 py-0.5 text-[11px] text-zinc-400`}
              >
                {t}
              </li>
            ))}
          </ul>
        </div>

        <div className="flex gap-2 lg:col-start-1 lg:row-start-2">
          {project.live && (
            <a
              href={project.live}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`${project.name} live site (opens in a new tab)`}
              className={linkClass}
            >
              Live
              <ArrowUpRight className="h-4 w-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" aria-hidden="true" />
            </a>
          )}
          {project.repo && (
            <a
              href={project.repo}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`${project.name} source code on GitHub (opens in a new tab)`}
              className={linkClass}
            >
              <GitHubMark />
              Source
              <ArrowUpRight className="h-4 w-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" aria-hidden="true" />
            </a>
          )}
        </div>
      </header>

      {project.media}
    </motion.article>
  );
}

/* ─── Section ───────────────────────────────────────────────── */
export default function Projects() {
  const headerRef = useRef<HTMLDivElement>(null);
  const inView = useInView(headerRef, { once: true, margin: '-60px' });

  return (
    <section
      id="project"
      className="relative flex w-full flex-col items-center justify-start overflow-hidden bg-[#050505] py-24 md:py-32"
    >
      <EventMesh />

      {/* Soft pool of light so the cards lift off the mesh */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-1/2 h-[520px] w-[min(1100px,90vw)] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-60 blur-[140px]"
        style={{
          background:
            'radial-gradient(closest-side, rgba(255,0,128,0.14), transparent), radial-gradient(closest-side at 75% 60%, rgba(56,189,248,0.10), transparent)',
        }}
      />

      <div className="container relative z-10 mx-auto max-w-6xl px-4 sm:px-6">
        <motion.div
          ref={headerRef}
          className="mb-12 text-center md:mb-16"
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7, ease: 'easeOut' }}
        >
          <h2 className="mb-6 text-sm font-semibold uppercase tracking-[0.3em] text-zinc-500">Selected Work</h2>
          <p className="mb-5 text-4xl font-bold md:text-5xl lg:text-6xl">
            <span className="bg-gradient-to-r from-[#FF0080] to-[#FF6B35] bg-clip-text text-transparent">Projects</span>
          </p>
          <p className="mx-auto max-w-lg text-sm leading-relaxed text-zinc-500 md:text-base">
            Cloud, network and web systems I&apos;ve designed and built end to end.
          </p>
        </motion.div>

        <div className="flex flex-col gap-8 md:gap-10">
          {projects.map((project) => (
            <ProjectCase key={project.slug} project={project} />
          ))}
        </div>
      </div>
    </section>
  );
}
