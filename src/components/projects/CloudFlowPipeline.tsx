'use client';

import { useCallback, useEffect, useId, useMemo, useState, useSyncExternalStore } from 'react';
import type { ReactNode } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { FileWarning, FileText } from 'lucide-react';
import { monoFont } from './fonts';

/* ─── Model ─────────────────────────────────────────────────── */
type NodeId = 'upload' | 's3in' | 'sqs' | 'lambda' | 'ai' | 'store' | 'dash' | 'sns' | 'dlq' | 'alarm';
type PathId =
  | 'upload-s3in'
  | 's3in-sqs'
  | 'sqs-lambda'
  | 'lambda-ai'
  | 'lambda-store'
  | 'lambda-dash'
  | 'lambda-sns'
  | 'sqs-dlq'
  | 'dlq-alarm'
  | 'alarm-sns';
type RouteSeg = PathId | `-${PathId}`;
type Tone = 'ok' | 'ai' | 'fail';
type Scenario = 'ok' | 'fail';
type Pt = [number, number];

const TONE: Record<Tone, string> = {
  ok: '#FF0080',
  ai: '#38BDF8',
  fail: '#FF3B3B',
};

const NODE_META: Record<NodeId, { title: string; sub: string }> = {
  upload: { title: 'Upload', sub: 'PDF · TXT · JSON' },
  s3in: { title: 'S3', sub: 'uploads/' },
  sqs: { title: 'SQS', sub: 'event queue' },
  lambda: { title: 'Lambda', sub: 'file processor' },
  ai: { title: 'OpenRouter', sub: 'gemini-2.5-flash' },
  store: { title: 'S3', sub: 'filed by vendor' },
  dash: { title: 'Dashboard', sub: 'live billing' },
  sns: { title: 'SNS', sub: 'email alert' },
  dlq: { title: 'DLQ', sub: 'dead-letter queue' },
  alarm: { title: 'CloudWatch', sub: 'alarm' },
};

interface Layout {
  viewBox: Pt;
  nodeW: number;
  nodeH: number;
  title: number;
  sub: number;
  widths?: Partial<Record<NodeId, number>>;
  nodes: Record<NodeId, Pt>;
  paths: Record<PathId, Pt[]>;
  /** Where the AI's extracted fields are pinned (top-left corner); omitted when there is no room. */
  receipt?: { at: Pt; width: number };
}

const WIDE: Layout = {
  viewBox: [930, 345],
  nodeW: 116,
  nodeH: 56,
  title: 14,
  sub: 11,
  widths: { upload: 128, ai: 140, dlq: 140, store: 140 },
  nodes: {
    upload: [80, 180],
    s3in: [230, 180],
    sqs: [380, 180],
    lambda: [540, 180],
    ai: [540, 52],
    store: [840, 62],
    dash: [840, 180],
    sns: [840, 298],
    dlq: [380, 298],
    alarm: [580, 298],
  },
  paths: {
    'upload-s3in': [[80, 180], [230, 180]],
    's3in-sqs': [[230, 180], [380, 180]],
    'sqs-lambda': [[380, 180], [540, 180]],
    'lambda-ai': [[540, 180], [540, 52]],
    'lambda-store': [[540, 180], [700, 180], [700, 62], [840, 62]],
    'lambda-dash': [[540, 180], [840, 180]],
    'lambda-sns': [[540, 180], [700, 180], [700, 298], [840, 298]],
    'sqs-dlq': [[380, 180], [380, 298]],
    'dlq-alarm': [[380, 298], [580, 298]],
    'alarm-sns': [[580, 298], [840, 298]],
  },
  receipt: { at: [150, 10], width: 290 },
};

const NARROW: Layout = {
  viewBox: [360, 500],
  nodeW: 100,
  nodeH: 48,
  title: 12,
  sub: 9.5,
  widths: { ai: 112, dlq: 112, alarm: 112 },
  nodes: {
    upload: [70, 36],
    s3in: [70, 128],
    sqs: [70, 220],
    lambda: [70, 312],
    ai: [283, 312],
    dlq: [283, 220],
    alarm: [283, 128],
    store: [70, 460],
    dash: [180, 460],
    sns: [290, 460],
  },
  paths: {
    'upload-s3in': [[70, 36], [70, 128]],
    's3in-sqs': [[70, 128], [70, 220]],
    'sqs-lambda': [[70, 220], [70, 312]],
    'lambda-ai': [[70, 312], [283, 312]],
    'lambda-store': [[70, 312], [70, 460]],
    'lambda-dash': [[70, 312], [70, 388], [180, 388], [180, 460]],
    'lambda-sns': [[70, 312], [70, 388], [290, 388], [290, 460]],
    'sqs-dlq': [[70, 220], [283, 220]],
    'dlq-alarm': [[283, 220], [283, 128]],
    'alarm-sns': [[283, 128], [350, 128], [350, 460], [290, 460]],
  },
};

interface Step {
  ms: number;
  packets: { route: RouteSeg[]; tone: Tone }[];
  active: NodeId[];
  error?: NodeId[];
  note: { text: string; tone: Tone | 'muted' };
  fields?: [string, string][];
}

const SCENARIOS: Record<Scenario, Step[]> = {
  ok: [
    {
      ms: 1100,
      packets: [{ route: ['upload-s3in'], tone: 'ok' }],
      active: ['upload', 's3in'],
      note: { text: 'PUT uploads/northwind-inv-2291.pdf', tone: 'muted' },
    },
    {
      ms: 1000,
      packets: [{ route: ['s3in-sqs'], tone: 'ok' }],
      active: ['s3in', 'sqs'],
      note: { text: 'S3 event → message queued in SQS', tone: 'muted' },
    },
    {
      ms: 1100,
      packets: [{ route: ['sqs-lambda'], tone: 'ok' }],
      active: ['sqs', 'lambda'],
      note: { text: 'Lambda invoked · reading PDF text', tone: 'muted' },
    },
    {
      ms: 1100,
      packets: [{ route: ['lambda-ai'], tone: 'ai' }],
      active: ['lambda', 'ai'],
      note: { text: 'Asking gemini-2.5-flash to classify it', tone: 'ai' },
    },
    {
      ms: 1900,
      packets: [{ route: ['-lambda-ai'], tone: 'ai' }],
      active: ['ai', 'lambda'],
      note: { text: 'Invoice · Northwind Freight · $4,820.00', tone: 'ai' },
      fields: [
        ['vendor', 'Northwind Freight'],
        ['total', '$4,820.00'],
        ['due_date', '2026-11-15'],
        ['action', 'Schedule payment'],
      ],
    },
    {
      ms: 1500,
      packets: [
        { route: ['lambda-store'], tone: 'ok' },
        { route: ['lambda-dash'], tone: 'ok' },
        { route: ['lambda-sns'], tone: 'ok' },
      ],
      active: ['lambda', 'store', 'dash', 'sns'],
      note: { text: 'Filed by vendor · dashboard updated · email sent', tone: 'ok' },
    },
  ],
  fail: [
    {
      ms: 1100,
      packets: [{ route: ['upload-s3in'], tone: 'fail' }],
      active: ['upload', 's3in'],
      note: { text: 'PUT uploads/scan_0093.pdf', tone: 'muted' },
    },
    {
      ms: 1000,
      packets: [{ route: ['s3in-sqs'], tone: 'fail' }],
      active: ['s3in', 'sqs'],
      note: { text: 'S3 event → message queued in SQS', tone: 'muted' },
    },
    {
      ms: 1100,
      packets: [{ route: ['sqs-lambda'], tone: 'fail' }],
      active: ['sqs', 'lambda'],
      error: ['lambda'],
      note: { text: 'Attempt 1/3 · PDF text extraction failed', tone: 'fail' },
    },
    {
      ms: 1500,
      packets: [{ route: ['-sqs-lambda', 'sqs-lambda'], tone: 'fail' }],
      active: ['sqs', 'lambda'],
      error: ['lambda'],
      note: { text: 'Attempt 2/3 · failed', tone: 'fail' },
    },
    {
      ms: 1500,
      packets: [{ route: ['-sqs-lambda', 'sqs-lambda'], tone: 'fail' }],
      active: ['sqs', 'lambda'],
      error: ['lambda'],
      note: { text: 'Attempt 3/3 · failed', tone: 'fail' },
    },
    {
      ms: 1500,
      packets: [{ route: ['-sqs-lambda', 'sqs-dlq'], tone: 'fail' }],
      active: ['sqs', 'dlq'],
      error: ['dlq'],
      note: { text: 'Parked in the dead-letter queue', tone: 'fail' },
    },
    {
      ms: 1200,
      packets: [{ route: ['dlq-alarm'], tone: 'fail' }],
      active: ['dlq', 'alarm'],
      error: ['alarm'],
      note: { text: 'CloudWatch alarm · messages in DLQ > 0', tone: 'fail' },
    },
    {
      ms: 1300,
      packets: [{ route: ['alarm-sns'], tone: 'fail' }],
      active: ['alarm', 'sns'],
      error: ['sns'],
      note: { text: 'Email alert · Document Processing Failed', tone: 'fail' },
    },
  ],
};

const HOLD_MS = 3600;
const TRAVEL_SHARE = 0.72;

const GLYPH: Record<Tone | 'muted', { char: string; color: string }> = {
  muted: { char: '›', color: '#71717a' },
  ok: { char: '✓', color: TONE.ok },
  ai: { char: '◆', color: TONE.ai },
  fail: { char: '✕', color: TONE.fail },
};

/* ─── Helpers ───────────────────────────────────────────────── */
function resolveRoute(layout: Layout, route: RouteSeg[]): Pt[] {
  const points: Pt[] = [];
  for (const seg of route) {
    const reversed = seg.startsWith('-');
    const id = (reversed ? seg.slice(1) : seg) as PathId;
    const pts = reversed ? [...layout.paths[id]].reverse() : layout.paths[id];
    for (const p of pts) {
      const prev = points[points.length - 1];
      if (!prev || prev[0] !== p[0] || prev[1] !== p[1]) points.push(p);
    }
  }
  return points;
}

function subscribeWide(callback: () => void) {
  const query = window.matchMedia('(min-width: 768px)');
  query.addEventListener('change', callback);
  return () => query.removeEventListener('change', callback);
}

function useIsWide() {
  return useSyncExternalStore(
    subscribeWide,
    () => window.matchMedia('(min-width: 768px)').matches,
    () => true,
  );
}

/* ─── Packet ────────────────────────────────────────────────── */
function Packet({
  points,
  tone,
  duration,
  instant,
  glowId,
}: {
  points: Pt[];
  tone: Tone;
  duration: number;
  instant: boolean;
  glowId: string;
}) {
  const xs = points.map((p) => p[0]);
  const ys = points.map((p) => p[1]);
  const end = points[points.length - 1];

  const lengths = points.slice(1).map((p, i) => Math.hypot(p[0] - points[i][0], p[1] - points[i][1]));
  const total = lengths.reduce((a, b) => a + b, 0) || 1;
  let acc = 0;
  const times = [0, ...lengths.map((l) => (acc += l) / total)];

  const color = TONE[tone];

  if (instant) {
    return <circle cx={end[0]} cy={end[1]} r={5} fill={color} filter={`url(#${glowId})`} />;
  }

  return (
    <g filter={`url(#${glowId})`}>
      {[
        { r: 2.5, opacity: 0.3, delay: 0.09, fill: color },
        { r: 3.5, opacity: 0.55, delay: 0.045, fill: color },
        { r: 4.5, opacity: 1, delay: 0, fill: '#ffffff' },
      ].map((c, i) => (
        <motion.circle
          key={i}
          r={c.r}
          fill={c.fill}
          stroke={i === 2 ? color : undefined}
          strokeWidth={i === 2 ? 2 : undefined}
          opacity={c.opacity}
          initial={{ cx: xs[0], cy: ys[0] }}
          animate={{ cx: xs, cy: ys }}
          transition={{ duration, times, ease: 'linear', delay: c.delay }}
        />
      ))}
    </g>
  );
}

/* ─── Demo ──────────────────────────────────────────────────── */
export default function CloudFlowPipeline() {
  const [inView, setInView] = useState(false);
  const reduceMotion = useReducedMotion() ?? false;
  const isWide = useIsWide();
  const layout = isWide ? WIDE : NARROW;
  const uid = useId().replace(/:/g, '');
  const glowId = `pkt-glow-${uid}`;

  const [run, setRun] = useState<{ id: number; scenario: Scenario } | null>(null);
  const [step, setStep] = useState(0);
  const [finished, setFinished] = useState(false);

  const start = useCallback((scenario: Scenario) => {
    setRun((prev) => ({ id: (prev?.id ?? 0) + 1, scenario }));
    setStep(0);
    setFinished(false);
  }, []);

  // The first run starts when the demo scrolls into view; the clocks below pause while it is off-screen
  const handleEnter = useCallback(() => {
    setInView(true);
    if (!run) start('ok');
  }, [run, start]);

  // Step clock
  useEffect(() => {
    if (!run || !inView || finished) return;
    const steps = SCENARIOS[run.scenario];
    const timer = window.setTimeout(() => {
      if (step < steps.length - 1) setStep(step + 1);
      else setFinished(true);
    }, steps[step].ms);
    return () => window.clearTimeout(timer);
  }, [run, step, inView, finished]);

  // Autoplay alternates scenarios; reduced-motion users drive it manually
  useEffect(() => {
    if (!run || !finished || !inView || reduceMotion) return;
    const timer = window.setTimeout(() => start(run.scenario === 'ok' ? 'fail' : 'ok'), HOLD_MS);
    return () => window.clearTimeout(timer);
  }, [run, finished, inView, reduceMotion, start]);

  const derived = useMemo(() => {
    const visited = new Map<NodeId, Tone>();
    const errors = new Set<NodeId>();
    const traversed = new Map<PathId, Tone>();
    let fields: [string, string][] | null = null;
    if (!run) return { visited, errors, traversed, fields, current: null as Step | null };

    const steps = SCENARIOS[run.scenario].slice(0, step + 1);
    for (const s of steps) {
      const tone = s.packets[0]?.tone ?? 'ok';
      s.active.forEach((n) => visited.set(n, tone));
      s.error?.forEach((n) => errors.add(n));
      s.packets.forEach((p) =>
        p.route.forEach((seg) => traversed.set((seg.startsWith('-') ? seg.slice(1) : seg) as PathId, p.tone)),
      );
      if (s.fields) fields = s.fields;
    }
    return { visited, errors, traversed, fields, current: steps[steps.length - 1] };
  }, [run, step]);

  const status = !run
    ? { label: 'Standby', color: '#71717a' }
    : !finished
      ? { label: 'Processing', color: run.scenario === 'ok' ? TONE.ok : TONE.fail }
      : run.scenario === 'ok'
        ? { label: 'Filed', color: TONE.ok }
        : { label: 'Alert sent', color: TONE.fail };

  const [vbW, vbH] = layout.viewBox;
  const activeNodes = new Set(derived.current?.active ?? []);
  const note = derived.current?.note ?? { text: 'Waiting for an upload…', tone: 'muted' as const };
  const glyph = GLYPH[note.tone];

  return (
    <motion.div
      viewport={{ amount: 0.3 }}
      onViewportEnter={handleEnter}
      onViewportLeave={() => setInView(false)}
      className="relative overflow-hidden rounded-2xl border border-white/[0.07] bg-[#08080B]"
    >
      {/* ── Controls ── */}
      <div className="flex flex-col gap-3 border-b border-white/[0.06] px-4 py-3 sm:flex-row sm:items-center sm:justify-between md:px-5">
        <p className={`${monoFont.className} flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-zinc-500`}>
          <span
            className={`h-1.5 w-1.5 rounded-full ${run && !finished && !reduceMotion ? 'animate-pulse' : ''}`}
            style={{ background: status.color, boxShadow: `0 0 8px ${status.color}` }}
            aria-hidden="true"
          />
          Live pipeline
          <span className="normal-case tracking-normal" style={{ color: status.color }}>
            · {status.label}
          </span>
        </p>
        <div className="flex gap-2" role="group" aria-label="Choose a file to send through the pipeline">
          <ScenarioButton
            active={run?.scenario === 'ok'}
            tone="ok"
            onClick={() => start('ok')}
            icon={<FileText className="h-3.5 w-3.5" aria-hidden="true" />}
          >
            Valid invoice
          </ScenarioButton>
          <ScenarioButton
            active={run?.scenario === 'fail'}
            tone="fail"
            onClick={() => start('fail')}
            icon={<FileWarning className="h-3.5 w-3.5" aria-hidden="true" />}
          >
            Corrupted file
          </ScenarioButton>
        </div>
      </div>

      {/* ── Diagram ── */}
      <svg
        viewBox={`0 0 ${vbW} ${vbH}`}
        className="block h-auto w-full px-2 py-3 md:px-4 md:py-4"
        role="img"
        aria-label="Architecture: an uploaded file lands in S3, is queued in SQS and processed by a Lambda function that asks OpenRouter AI to classify it, then files it by vendor in S3, updates the dashboard and sends an SNS email. Files that fail three times move to a dead-letter queue, which triggers a CloudWatch alarm and an SNS alert."
      >
        <defs>
          <filter id={glowId} x="-200%" y="-200%" width="500%" height="500%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Conduits */}
        {(Object.keys(layout.paths) as PathId[]).map((id) => {
          const points = layout.paths[id].map((p) => p.join(',')).join(' ');
          const tone = derived.traversed.get(id);
          return (
            <g key={id}>
              <polyline
                points={points}
                fill="none"
                stroke="#2A2A31"
                strokeWidth={1.5}
                strokeDasharray="2 6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              {tone && (
                <polyline
                  points={points}
                  fill="none"
                  stroke={TONE[tone]}
                  strokeOpacity={0.45}
                  strokeWidth={1.5}
                  strokeLinejoin="round"
                />
              )}
            </g>
          );
        })}

        {/* What the AI pulled out of the document */}
        <AnimatePresence>
          {layout.receipt && derived.fields && run && (
            <motion.g
              key={`receipt-${run.id}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: reduceMotion ? 0 : 0.4 }}
            >
              <ReceiptCard
                at={layout.receipt.at}
                width={layout.receipt.width}
                fields={derived.fields}
                anchorX={layout.nodes.ai[0] - (layout.widths?.ai ?? layout.nodeW) / 2}
                anchorY={layout.nodes.ai[1]}
              />
            </motion.g>
          )}
        </AnimatePresence>

        {/* Packets in flight */}
        {run &&
          derived.current?.packets.map((p, i) => (
            <Packet
              key={`${run.id}-${step}-${i}-${isWide ? 'w' : 'n'}`}
              points={resolveRoute(layout, p.route)}
              tone={p.tone}
              duration={(derived.current!.ms * TRAVEL_SHARE) / 1000}
              instant={reduceMotion}
              glowId={glowId}
            />
          ))}

        {/* Services */}
        {(Object.keys(layout.nodes) as NodeId[]).map((id) => {
          const [cx, cy] = layout.nodes[id];
          const w = layout.widths?.[id] ?? layout.nodeW;
          const h = layout.nodeH;
          const isError = derived.errors.has(id);
          const visitTone = derived.visited.get(id);
          const isActive = activeNodes.has(id) && !finished;
          const color = isError ? TONE.fail : visitTone ? TONE[visitTone] : null;
          return (
            <g key={id} transform={`translate(${cx - w / 2} ${cy - h / 2})`}>
              <rect width={w} height={h} rx={10} fill="#0C0C10" />
              <rect
                width={w}
                height={h}
                rx={10}
                fill={isActive && color ? `${color}14` : 'transparent'}
                stroke={color ?? '#2A2A31'}
                strokeOpacity={color ? (isActive ? 1 : 0.55) : 1}
                strokeWidth={isActive ? 1.5 : 1}
                style={{
                  transition: 'stroke 300ms, fill 300ms, stroke-opacity 300ms, filter 300ms',
                  filter: isActive && color ? `drop-shadow(0 0 10px ${color}66)` : 'none',
                }}
              />
              <text
                x={w / 2}
                y={h / 2 - layout.sub * 0.45}
                textAnchor="middle"
                fill={isActive ? '#ffffff' : '#d4d4d8'}
                fontSize={layout.title}
                fontWeight={600}
              >
                {NODE_META[id].title}
              </text>
              <text
                x={w / 2}
                y={h / 2 + layout.sub * 1.25}
                textAnchor="middle"
                fill={isError ? TONE.fail : '#71717a'}
                fontSize={layout.sub}
                className={monoFont.className}
              >
                {NODE_META[id].sub}
              </text>
            </g>
          );
        })}
      </svg>

      {/* ── Current event ── */}
      <div
        className={`${monoFont.className} flex min-h-[44px] items-center gap-2.5 border-t border-white/[0.06] px-4 py-2.5 text-[12px] md:px-5`}
      >
        <AnimatePresence mode="wait" initial={false}>
          <motion.p
            key={run ? `${run.id}-${step}` : 'idle'}
            className="flex min-w-0 items-center gap-2.5"
            initial={reduceMotion ? false : { opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduceMotion ? undefined : { opacity: 0, y: -4 }}
            transition={{ duration: 0.18 }}
          >
            <span aria-hidden="true" className="w-3 shrink-0 text-center" style={{ color: glyph.color }}>
              {glyph.char}
            </span>
            <span className={`truncate ${note.tone === 'muted' ? 'text-zinc-400' : 'text-zinc-200'}`}>{note.text}</span>
          </motion.p>
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

/* ─── Bits ──────────────────────────────────────────────────── */
function ReceiptCard({
  at,
  width,
  fields,
  anchorX,
  anchorY,
}: {
  at: Pt;
  width: number;
  fields: [string, string][];
  anchorX: number;
  anchorY: number;
}) {
  const [x, y] = at;
  const rowH = 19;
  const height = 38 + fields.length * rowH;
  return (
    <g className={monoFont.className}>
      <line
        x1={x + width}
        y1={anchorY}
        x2={anchorX}
        y2={anchorY}
        stroke={TONE.ai}
        strokeOpacity={0.5}
        strokeDasharray="2 4"
      />
      <rect x={x} y={y} width={width} height={height} rx={10} fill={TONE.ai} fillOpacity={0.05} stroke={TONE.ai} strokeOpacity={0.35} />
      <text x={x + 16} y={y + 24} fontSize={10} letterSpacing={1.6} fill={TONE.ai}>
        EXTRACTED BY AI
      </text>
      {fields.map(([k, v], i) => (
        <g key={k}>
          <text x={x + 16} y={y + 46 + i * rowH} fontSize={11.5} fill="#71717a">
            {k}
          </text>
          <text x={x + 100} y={y + 46 + i * rowH} fontSize={12} fill="#ffffff">
            {v}
          </text>
        </g>
      ))}
    </g>
  );
}

function ScenarioButton({
  active,
  tone,
  onClick,
  icon,
  children,
}: {
  active: boolean;
  tone: Tone;
  onClick: () => void;
  icon: ReactNode;
  children: ReactNode;
}) {
  const color = TONE[tone];
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[12px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70 focus-visible:ring-offset-2 focus-visible:ring-offset-[#08080B]"
      style={{
        borderColor: active ? `${color}80` : 'rgba(255,255,255,0.1)',
        background: active ? `${color}1A` : 'rgba(255,255,255,0.02)',
        color: active ? '#ffffff' : '#a1a1aa',
      }}
    >
      <span style={{ color: active ? color : undefined }}>{icon}</span>
      {children}
    </button>
  );
}
