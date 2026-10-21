'use client';

import { useCallback, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useReducedMotionSafe } from './useReducedMotionSafe';
import { monoFont } from './fonts';

/* ─── Model ─────────────────────────────────────────────────── */
interface Stage {
  name: string;
  checks: string;
  result: string;
  ok: boolean;
}

interface Scenario {
  key: string;
  label: string;
  method: 'PUT' | 'DELETE';
  path: string;
  session: string;
  body?: string;
  stages: Stage[];
  response: { status: string; to?: string; flash: { kind: 'success' | 'error'; text: string } };
}

const OK = '#A78BFA';
const NO = '#FF3B3B';
const ID = '64f1c2…a9';

const SCENARIOS: Scenario[] = [
  {
    key: 'author',
    label: 'Author',
    method: 'DELETE',
    path: `/campgrounds/${ID}`,
    session: 'adhil',
    stages: [
      { name: 'isLoggedIn', checks: 'Passport session', result: 'adhil', ok: true },
      { name: 'isAuthor', checks: 'owner === req.user', result: 'owner', ok: true },
      { name: 'deleteCampground', checks: 'findByIdAndDelete', result: 'deleted', ok: true },
      { name: 'post hook', checks: 'cascade reviews', result: '3 reviews removed', ok: true },
    ],
    response: { status: '302', to: '/campgrounds', flash: { kind: 'success', text: 'Successfully deleted campground!' } },
  },
  {
    key: 'guest',
    label: 'Guest',
    method: 'PUT',
    path: `/campgrounds/${ID}`,
    session: 'none',
    stages: [
      { name: 'isLoggedIn', checks: 'Passport session', result: 'not signed in', ok: false },
      { name: 'isAuthor', checks: 'owner === req.user', result: '', ok: true },
      { name: 'validateCampground', checks: 'Joi schema', result: '', ok: true },
      { name: 'updateCampground', checks: 'findByIdAndUpdate', result: '', ok: true },
    ],
    response: { status: '302', to: '/login', flash: { kind: 'error', text: 'You must be signed in first!' } },
  },
  {
    key: 'other',
    label: 'Other user',
    method: 'PUT',
    path: `/campgrounds/${ID}`,
    session: 'sam',
    stages: [
      { name: 'isLoggedIn', checks: 'Passport session', result: 'sam', ok: true },
      { name: 'isAuthor', checks: 'owner === req.user', result: 'owner is adhil', ok: false },
      { name: 'validateCampground', checks: 'Joi schema', result: '', ok: true },
      { name: 'updateCampground', checks: 'findByIdAndUpdate', result: '', ok: true },
    ],
    response: {
      status: '302',
      to: `/campgrounds/${ID}`,
      flash: { kind: 'error', text: 'You do not have permission to do that!' },
    },
  },
  {
    key: 'invalid',
    label: 'Bad input',
    method: 'PUT',
    path: `/campgrounds/${ID}`,
    session: 'adhil',
    body: '{ campground: { price: -5, … } }',
    stages: [
      { name: 'isLoggedIn', checks: 'Passport session', result: 'adhil', ok: true },
      { name: 'isAuthor', checks: 'owner === req.user', result: 'owner', ok: true },
      { name: 'validateCampground', checks: 'Joi schema', result: 'price < 0', ok: false },
      { name: 'updateCampground', checks: 'findByIdAndUpdate', result: '', ok: true },
    ],
    response: {
      status: '400',
      flash: { kind: 'error', text: '"campground.price" must be greater than or equal to 0' },
    },
  },
];

const STEP_MS = 850;
const HOLD_MS = 3200;

type StageState = 'pending' | 'active' | 'pass' | 'fail' | 'skipped';

/* ─── Demo ──────────────────────────────────────────────────── */
export default function RequestTrace() {
  const reduceMotion = useReducedMotionSafe();
  const [inView, setInView] = useState(false);
  const [idx, setIdx] = useState(0);
  const [tick, setTick] = useState(0);

  const scenario = SCENARIOS[idx];
  const failAt = scenario.stages.findIndex((s) => !s.ok);
  const lastStage = failAt === -1 ? scenario.stages.length - 1 : failAt;
  // tick n = n stages evaluated; the response appears one tick after the last stage that ran
  const responseTick = lastStage + 2;
  const t = reduceMotion ? responseTick : tick;
  const done = t >= responseTick;

  const select = useCallback((i: number) => {
    setIdx(i);
    setTick(0);
  }, []);

  useEffect(() => {
    if (!inView || reduceMotion) return;
    const timer = window.setTimeout(
      () => (done ? select((idx + 1) % SCENARIOS.length) : setTick(tick + 1)),
      done ? HOLD_MS : STEP_MS,
    );
    return () => window.clearTimeout(timer);
  }, [inView, reduceMotion, done, idx, tick, select]);

  const stateOf = (i: number): StageState => {
    const evaluated = Math.min(t, lastStage + 1);
    if (i < evaluated) return scenario.stages[i].ok ? 'pass' : 'fail';
    if (i > lastStage) return done ? 'skipped' : 'pending';
    return i === evaluated && !done ? 'active' : 'pending';
  };

  const rejected = failAt !== -1;
  const status = !done
    ? { label: 'In flight', color: '#a1a1aa' }
    : rejected
      ? { label: 'Rejected', color: NO }
      : { label: 'Handled', color: OK };

  const footer = done
    ? rejected
      ? { glyph: '✕', color: NO, text: `Stopped at ${scenario.stages[failAt].name} · nothing reached the database` }
      : { glyph: '✓', color: OK, text: 'Campground and its reviews removed in one request' }
    : { glyph: '›', color: '#71717a', text: t <= lastStage ? `Running ${scenario.stages[t].name}…` : 'Sending response…' };

  return (
    <motion.div
      viewport={{ amount: 0.3 }}
      onViewportEnter={() => setInView(true)}
      onViewportLeave={() => setInView(false)}
      className={`${monoFont.className} relative overflow-hidden rounded-2xl border border-white/[0.07] bg-[#08080B]`}
    >
      {/* ── Controls ── */}
      <div className="flex flex-col gap-3 border-b border-white/[0.06] px-4 py-3 sm:flex-row sm:items-center sm:justify-between md:px-5">
        <p className="flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-zinc-500">
          <span
            className="h-1.5 w-1.5 rounded-full"
            style={{ background: status.color, boxShadow: `0 0 8px ${status.color}` }}
            aria-hidden="true"
          />
          Request trace
          <span className="normal-case tracking-normal" style={{ color: status.color }}>
            · {status.label}
          </span>
        </p>
        <div className="flex flex-wrap gap-2" role="group" aria-label="Choose who sends the request">
          {SCENARIOS.map((s, i) => (
            <button
              key={s.key}
              type="button"
              onClick={() => select(i)}
              aria-pressed={i === idx}
              className="rounded-full border px-3 py-1 text-[11.5px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70 focus-visible:ring-offset-2 focus-visible:ring-offset-[#08080B]"
              style={{
                borderColor: i === idx ? `${OK}80` : 'rgba(255,255,255,0.1)',
                background: i === idx ? `${OK}1A` : 'transparent',
                color: i === idx ? '#ffffff' : '#a1a1aa',
              }}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 py-4 md:px-5 md:py-5">
        {/* ── Request ── */}
        <div className="mb-4 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[12px]">
          <span
            className="rounded-md px-2 py-0.5 text-[11px] font-semibold"
            style={{
              color: scenario.method === 'DELETE' ? '#FF6B35' : '#38BDF8',
              background: scenario.method === 'DELETE' ? '#FF6B351A' : '#38BDF81A',
            }}
          >
            {scenario.method}
          </span>
          <span className="text-white">{scenario.path}</span>
          <span className="text-zinc-500">
            session <span className={scenario.session === 'none' ? 'text-zinc-600' : 'text-zinc-300'}>{scenario.session}</span>
          </span>
          {scenario.body && <span className="text-zinc-500">body <span className="text-zinc-300">{scenario.body}</span></span>}
        </div>

        {/* ── Middleware chain ── */}
        <ol className="grid gap-2 md:grid-cols-4 md:gap-3" aria-label="Middleware chain">
          {scenario.stages.map((s, i) => {
            const state = stateOf(i);
            const color = state === 'pass' ? OK : state === 'fail' ? NO : state === 'active' ? '#ffffff' : null;
            return (
              <li
                key={`${scenario.key}-${s.name}`}
                className="relative flex items-center gap-3 rounded-xl border px-3 py-2.5 transition-all duration-300 md:block md:px-4 md:py-3"
                style={{
                  borderColor: color ? `${color}${state === 'active' ? '40' : '66'}` : 'rgba(255,255,255,0.07)',
                  background: state === 'fail' ? `${NO}12` : state === 'pass' ? `${OK}0D` : '#0C0C10',
                  opacity: state === 'skipped' ? 0.35 : 1,
                  boxShadow: state === 'active' ? `0 0 0 1px ${OK}55, 0 0 18px ${OK}33` : 'none',
                }}
              >
                {i > 0 && (
                  <span
                    aria-hidden="true"
                    className="absolute -left-3 top-1/2 hidden h-px w-3 md:block"
                    style={{ background: state === 'pending' || state === 'skipped' ? '#2A2A31' : `${OK}88` }}
                  />
                )}
                <div className="flex min-w-0 flex-1 items-center justify-between gap-2 md:mb-1">
                  <span
                    className={`truncate text-[12.5px] ${state === 'skipped' ? 'line-through' : ''}`}
                    style={{ color: state === 'pending' || state === 'skipped' ? '#a1a1aa' : '#ffffff' }}
                  >
                    {s.name}
                  </span>
                  <span aria-hidden="true" className="shrink-0 text-[12px]" style={{ color: color ?? '#3f3f46' }}>
                    {state === 'pass' ? '✓' : state === 'fail' ? '✕' : state === 'skipped' ? '–' : '·'}
                  </span>
                </div>
                <p
                  className="shrink-0 text-right text-[11px] md:text-left"
                  style={{ color: state === 'fail' ? NO : state === 'pass' ? '#a1a1aa' : '#52525b' }}
                >
                  {state === 'pass' || state === 'fail' ? s.result : state === 'skipped' ? 'never ran' : s.checks}
                  <span className="sr-only">
                    {state === 'pass' ? ' (passed)' : state === 'fail' ? ' (rejected)' : state === 'skipped' ? ' (skipped)' : ''}
                  </span>
                </p>
              </li>
            );
          })}
        </ol>

        {/* ── Response ── */}
        <div className="mt-4 flex min-h-[38px] flex-wrap items-center gap-x-4 gap-y-2 text-[12px]">
          <span className="text-zinc-500">Response</span>
          {done ? (
              <motion.div
                key={`${scenario.key}-res`}
                className="flex flex-wrap items-center gap-x-4 gap-y-2"
                initial={reduceMotion ? false : { opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25 }}
              >
                <span className="text-white">
                  {scenario.response.status}
                  {scenario.response.to && <span className="text-zinc-400"> → {scenario.response.to}</span>}
                </span>
                <span
                  className="rounded-md px-2.5 py-1 font-sans text-[12px]"
                  style={{
                    color: scenario.response.flash.kind === 'success' ? '#86efac' : '#fca5a5',
                    background: scenario.response.flash.kind === 'success' ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)',
                    border: `1px solid ${scenario.response.flash.kind === 'success' ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)'}`,
                  }}
                >
                  {scenario.response.flash.text}
                </span>
              </motion.div>
            ) : (
              <span className="text-zinc-600">waiting…</span>
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
