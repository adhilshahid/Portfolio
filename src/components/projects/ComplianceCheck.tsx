'use client';

import { useCallback, useEffect, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { monoFont } from './fonts';

/* ─── Model ─────────────────────────────────────────────────── */
interface Check {
  label: string;
  detail: string;
  lines: number[];
  ok: boolean;
}

interface Sample {
  store: string;
  file: string;
  config: string[];
  /** First line that belongs to the next interface — where block extraction stops. */
  blockEnd: number;
  checks: Check[];
  issues?: string;
}

const PASS = '#38BDF8';
const FAIL = '#FF3B3B';
const STAGES = ['Capture', 'Normalise', 'Validate', 'Report', 'Review'];

const SAMPLES: Sample[] = [
  {
    store: 'SU-0417',
    file: '417_130_Date 20 10 2026 09 30.txt',
    config: [
      'location SU-0417',
      'interface GigabitEthernet0/0/1.3',
      ' encapsulation dot1Q 3',
      ' ip address 10.41.7.130 255.255.255.128',
      ' ip helper-address 10.0.0.11',
      ' ip helper-address 10.0.0.12',
      ' ip helper-address 10.0.8.11',
      ' ip helper-address 10.0.8.12',
      ' zone-member security SM_Inside2',
      ' vrrp 3 ip 10.41.7.129',
      'interface GigabitEthernet0/0/1.2',
    ],
    blockEnd: 10,
    checks: [
      { label: 'Store mapped', detail: '417 → 10.41.7', lines: [0], ok: true },
      { label: 'Encapsulation', detail: 'dot1Q 3', lines: [2], ok: true },
      { label: 'Subnet mask', detail: '/25', lines: [3], ok: true },
      { label: 'Interface IP', detail: '.130', lines: [3], ok: true },
      { label: 'Helper addresses', detail: '4 / 4', lines: [4, 5, 6, 7], ok: true },
      { label: 'Security zone', detail: 'SM_Inside2', lines: [8], ok: true },
      { label: 'VRRP IP', detail: '.129', lines: [9], ok: true },
    ],
  },
  {
    store: 'SU-0233',
    file: '233_131_Date 20 10 2026 09 30.txt',
    config: [
      'location SU-0233',
      'interface GigabitEthernet0/0/1.3',
      ' encapsulation dot1Q 3',
      ' ip address 10.23.3.131 255.255.255.128',
      ' ip helper-address 10.0.0.11',
      ' ip helper-address 10.0.0.12',
      ' ip helper-address 10.0.8.11',
      ' zone-member security SM_Inside2',
      ' vrrp 3 ip 10.23.3.1',
      'interface GigabitEthernet0/0/1.2',
    ],
    blockEnd: 9,
    checks: [
      { label: 'Store mapped', detail: '233 → 10.23.3', lines: [0], ok: true },
      { label: 'Encapsulation', detail: 'dot1Q 3', lines: [2], ok: true },
      { label: 'Subnet mask', detail: '/25', lines: [3], ok: true },
      { label: 'Interface IP', detail: '.131', lines: [3], ok: true },
      { label: 'Helper addresses', detail: '3 / 4', lines: [4, 5, 6], ok: false },
      { label: 'Security zone', detail: 'SM_Inside2', lines: [7], ok: true },
      { label: 'VRRP IP', detail: '.1 ≠ .129', lines: [8], ok: false },
    ],
    issues: 'helper-address 3/4 | VRRP 10.23.3.1 ≠ 10.23.3.129',
  },
];

const TICK_MS = 650;
const HOLD_MS = 3400;

/* ─── Demo ──────────────────────────────────────────────────── */
export default function ComplianceCheck() {
  const reduceMotion = useReducedMotion() ?? false;
  const [inView, setInView] = useState(false);
  const [sampleIdx, setSampleIdx] = useState(0);
  const [tick, setTick] = useState(-1);

  const sample = SAMPLES[sampleIdx];
  const total = sample.checks.length;
  const evaluated = reduceMotion ? total : Math.max(0, Math.min(tick + 1, total));
  const current = !reduceMotion && tick >= 0 && tick < total ? sample.checks[tick] : null;
  const done = evaluated === total;
  const passed = sample.checks.every((c) => c.ok);

  const select = useCallback((idx: number) => {
    setSampleIdx(idx);
    setTick(-1);
  }, []);

  // Checks tick through one at a time, then the next store is loaded
  useEffect(() => {
    if (!inView || reduceMotion) return;
    const timer = window.setTimeout(
      () => {
        if (tick < total) setTick(tick + 1);
        else select((sampleIdx + 1) % SAMPLES.length);
      },
      tick < total ? TICK_MS : HOLD_MS,
    );
    return () => window.clearTimeout(timer);
  }, [inView, reduceMotion, tick, total, sampleIdx, select]);

  const lineState = (i: number) => {
    if (current?.lines.includes(i)) return current.ok ? 'pass' : 'fail';
    return null;
  };

  const footer = done
    ? { glyph: passed ? '✓' : '✕', color: passed ? PASS : FAIL, text: `Row appended → compliance_report.xlsx · ${passed ? 'PASS' : 'FAIL'}` }
    : { glyph: '›', color: '#71717a', text: `Validating ${sample.store} · check ${Math.max(evaluated, 1)}/${total}` };

  return (
    <motion.div
      viewport={{ amount: 0.3 }}
      onViewportEnter={() => setInView(true)}
      onViewportLeave={() => setInView(false)}
      className={`${monoFont.className} relative overflow-hidden rounded-2xl border border-white/[0.07] bg-[#08080B]`}
    >
      {/* ── Stages + store picker ── */}
      <div className="flex flex-col gap-3 border-b border-white/[0.06] px-4 py-3 sm:flex-row sm:items-center sm:justify-between md:px-5">
        <ol className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[10.5px] uppercase tracking-[0.16em]" aria-label="Pipeline stages">
          {STAGES.map((s, i) => (
            <li key={s} className="flex items-center gap-2">
              {i > 0 && <span className="text-zinc-700" aria-hidden="true">›</span>}
              <span className={s === 'Validate' ? 'text-white' : 'text-zinc-600'} aria-current={s === 'Validate' ? 'step' : undefined}>
                {s}
              </span>
            </li>
          ))}
        </ol>
        <div className="flex gap-2" role="group" aria-label="Choose a store config to validate">
          {SAMPLES.map((s, i) => (
            <button
              key={s.store}
              type="button"
              onClick={() => select(i)}
              aria-pressed={i === sampleIdx}
              className="rounded-full border px-3 py-1 text-[11.5px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70 focus-visible:ring-offset-2 focus-visible:ring-offset-[#08080B]"
              style={{
                borderColor: i === sampleIdx ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.1)',
                background: i === sampleIdx ? 'rgba(255,255,255,0.06)' : 'transparent',
                color: i === sampleIdx ? '#ffffff' : '#a1a1aa',
              }}
            >
              {s.store}
            </button>
          ))}
        </div>
      </div>

      <div className="grid md:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]">
        {/* ── Captured config ── */}
        <div className="border-b border-white/[0.06] py-3 md:border-b-0 md:border-r">
          <p className="mb-2 px-4 text-[10.5px] text-zinc-600 md:px-5">{sample.file}</p>
          <pre className="overflow-x-auto text-[11.5px] leading-[1.75]" aria-label={`Captured config for ${sample.store}`}>
            {sample.config.map((line, i) => {
              const state = lineState(i);
              const outside = i >= sample.blockEnd;
              return (
                <div
                  key={`${sample.store}-${i}`}
                  className="flex px-4 transition-colors duration-200 md:px-5"
                  style={{
                    background: state === 'pass' ? `${PASS}14` : state === 'fail' ? `${FAIL}1A` : 'transparent',
                    boxShadow: state ? `inset 2px 0 0 ${state === 'pass' ? PASS : FAIL}` : 'none',
                  }}
                >
                  <span className="w-6 shrink-0 select-none text-zinc-700" aria-hidden="true">
                    {i + 1}
                  </span>
                  <span className={outside ? 'text-zinc-600' : state ? 'text-white' : 'text-zinc-400'}>{line}</span>
                  {outside && <span className="ml-3 hidden text-zinc-700 sm:inline">← block ends here</span>}
                </div>
              );
            })}
          </pre>
        </div>

        {/* ── Rule results ── */}
        <div className="flex flex-col px-4 py-3 md:px-5">
          <ul className="space-y-1 text-[12px]" aria-label="Compliance checks">
            {sample.checks.map((c, i) => {
              const shown = i < evaluated;
              return (
                <li key={`${sample.store}-${c.label}`} className="flex items-center gap-3 py-[3px]">
                  <span
                    className="w-3 shrink-0 text-center"
                    style={{ color: shown ? (c.ok ? PASS : FAIL) : '#3f3f46' }}
                    aria-hidden="true"
                  >
                    {shown ? (c.ok ? '✓' : '✕') : '·'}
                  </span>
                  <span className={shown ? 'text-zinc-300' : 'text-zinc-600'}>{c.label}</span>
                  <span className="ml-auto" style={{ color: shown ? (c.ok ? '#a1a1aa' : FAIL) : '#3f3f46' }}>
                    {shown ? c.detail : '—'}
                    <span className="sr-only">{shown ? (c.ok ? ' (pass)' : ' (fail)') : ' (pending)'}</span>
                  </span>
                </li>
              );
            })}
          </ul>

          <div className="mt-auto flex items-center gap-3 border-t border-white/[0.06] pt-3 text-[12px]">
            <span className="text-zinc-500">Overall</span>
            <AnimatePresence mode="wait" initial={false}>
              {done ? (
                <motion.span
                  key={`${sample.store}-result`}
                  initial={reduceMotion ? false : { opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  className="rounded-md px-2 py-0.5 text-[11px] font-semibold tracking-wider"
                  style={{
                    color: passed ? PASS : FAIL,
                    background: `${passed ? PASS : FAIL}1A`,
                    border: `1px solid ${passed ? PASS : FAIL}55`,
                  }}
                >
                  {passed ? 'PASS' : 'FAIL'}
                </motion.span>
              ) : (
                <motion.span key="pending" exit={{ opacity: 0 }} className="text-zinc-600">
                  running…
                </motion.span>
              )}
            </AnimatePresence>
          </div>
          {done && sample.issues && (
            <p className="mt-2 text-[11px] leading-relaxed text-zinc-500">
              <span className="text-zinc-600">Issues: </span>
              {sample.issues}
            </p>
          )}
        </div>
      </div>

      {/* ── Current event ── */}
      <div className="flex min-h-[44px] items-center gap-2.5 border-t border-white/[0.06] px-4 py-2.5 text-[12px] md:px-5">
        <span aria-hidden="true" className="w-3 shrink-0 text-center" style={{ color: footer.color }}>
          {footer.glyph}
        </span>
        <span className="truncate text-zinc-300">{footer.text}</span>
      </div>
    </motion.div>
  );
}
