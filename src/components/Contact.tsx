'use client';

import {
  useCallback,
  useRef,
  useState,
  useSyncExternalStore,
  type FormEvent,
  type ReactNode,
} from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ArrowRight,
  ArrowUp,
  ArrowUpRight,
  Check,
  Copy,
  LoaderCircle,
  Mail,
  MapPin,
  Moon,
  Sun,
} from 'lucide-react';
import { useLenis } from 'lenis/react';
import LiquidField, { glassAttrs, type LiquidGlass } from '@/components/ui/liquid-field';

const EMAIL = 'adhilshahid@gmail.com';
const LINKEDIN_URL = 'https://www.linkedin.com/in/adhilshahid';
const GITHUB_URL = 'https://github.com/adhilshahid';
const TIME_ZONE = 'Asia/Kolkata';

type Status = 'idle' | 'sending' | 'sent' | 'mailto' | 'error';
type FieldErrors = Partial<Record<'name' | 'email' | 'message', string>>;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const EASE_OUT: [number, number, number, number] = [0.16, 1, 0.3, 1];

/* ─── Live clock (minute resolution, client only) ───────────── */
const subscribeClock = (onChange: () => void) => {
  const id = window.setInterval(onChange, 15_000);
  return () => window.clearInterval(id);
};
const getMinute = () => Math.floor(Date.now() / 60_000);
const getServerMinute = () => null;

const timeFormatter = new Intl.DateTimeFormat('en-US', {
  timeZone: TIME_ZONE,
  hour: 'numeric',
  minute: '2-digit',
});
const hourFormatter = new Intl.DateTimeFormat('en-US', {
  timeZone: TIME_ZONE,
  hour: 'numeric',
  hourCycle: 'h23',
});

/* ─── Glass primitives ──────────────────────────────────────── */
// The refraction itself is drawn by <LiquidField>, which looks for these
// data attributes and bends the liquid underneath each element's shape.
function GlassSurface({
  glass,
  className = '',
  children,
}: {
  glass: LiquidGlass;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={`lg-surface ${className}`} {...glassAttrs(glass)}>
      {children}
    </div>
  );
}

function GlassLink({
  href,
  label,
  children,
}: {
  href: string;
  label: string;
  children: ReactNode;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      className="lg-surface lg-press lg-focus group flex h-16 flex-1 items-center justify-between gap-3 rounded-full pl-5 pr-4 text-sm font-medium text-white"
      {...glassAttrs({ radius: 999, bezel: 22, refraction: 20, frost: 6 })}
    >
      <span className="relative z-[2] flex items-center gap-3">{children}</span>
      <ArrowUpRight
        className="relative z-[2] h-4 w-4 text-white/50 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-white"
        aria-hidden="true"
      />
    </a>
  );
}

function GitHubMark() {
  return (
    <svg viewBox="0 0 16 16" className="h-[18px] w-[18px]" fill="currentColor" aria-hidden="true">
      <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
    </svg>
  );
}

function LinkedInMark() {
  return (
    <svg viewBox="0 0 24 24" className="h-[17px] w-[17px]" fill="currentColor" aria-hidden="true">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 1 1 0-4.125 2.062 2.062 0 0 1 0 4.125zM7.119 20.452H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  );
}

/* ─── Local time card ───────────────────────────────────────── */
function LocalTime() {
  const minute = useSyncExternalStore(subscribeClock, getMinute, getServerMinute);
  const now = minute === null ? null : new Date(minute * 60_000);
  const hour = now ? Number(hourFormatter.format(now)) : 12;
  const isDay = hour >= 8 && hour < 22;

  return (
    <GlassSurface
      glass={{ radius: 32, bezel: 32, refraction: 28, frost: 12 }}
      className="rounded-[32px] p-6 sm:p-7"
    >
      <div className="relative z-[2]">
        <div className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-[0.22em] text-white/60">
          <span className="flex items-center gap-1.5">
            <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
            Kerala, India
          </span>
          <span>IST · UTC+5:30</span>
        </div>
        <p
          className="mt-5 text-5xl font-semibold tabular-nums tracking-tight text-white sm:text-6xl"
          aria-label={now ? `Local time ${timeFormatter.format(now)}` : 'Local time'}
        >
          {now ? timeFormatter.format(now) : '—:——'}
        </p>
        <p className="mt-3 flex items-center gap-2 text-sm text-white/70">
          {isDay ? (
            <Sun className="h-4 w-4 text-[#FFB38A]" aria-hidden="true" />
          ) : (
            <Moon className="h-4 w-4 text-[#C4B5FD]" aria-hidden="true" />
          )}
          {now
            ? isDay
              ? "Daytime here — I'm usually around."
              : "Night here — I'll reply in the morning."
            : 'Checking the time in Kerala…'}
        </p>
      </div>
    </GlassSurface>
  );
}

/* ─── Email pill with copy ──────────────────────────────────── */
function EmailPill() {
  const [copied, setCopied] = useState(false);
  const timer = useRef<number | undefined>(undefined);

  const copy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(EMAIL);
      setCopied(true);
      window.clearTimeout(timer.current);
      timer.current = window.setTimeout(() => setCopied(false), 2000);
    } catch {
      window.location.href = `mailto:${EMAIL}`;
    }
  }, []);

  return (
    <GlassSurface
      glass={{ radius: 999, bezel: 22, refraction: 20, frost: 6 }}
      className="flex h-16 items-center gap-2 rounded-full pl-5 pr-2"
    >
      <a
        href={`mailto:${EMAIL}`}
        className="lg-focus relative z-[2] min-w-0 flex-1 truncate rounded-full text-[15px] font-medium text-white"
      >
        {EMAIL}
      </a>
      <button
        type="button"
        onClick={copy}
        className="lg-chip lg-press lg-focus relative z-[2] flex h-12 shrink-0 items-center gap-2 rounded-full px-4 text-sm font-medium text-white"
      >
        <AnimatePresence mode="wait" initial={false}>
          <motion.span
            key={copied ? 'copied' : 'copy'}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.18 }}
            className="flex items-center gap-2"
          >
            {copied ? (
              <Check className="h-4 w-4 text-[#7CF3B5]" aria-hidden="true" />
            ) : (
              <Copy className="h-4 w-4" aria-hidden="true" />
            )}
            {copied ? 'Copied' : 'Copy'}
          </motion.span>
        </AnimatePresence>
      </button>
      <span className="sr-only" aria-live="polite">
        {copied ? 'Email address copied' : ''}
      </span>
    </GlassSurface>
  );
}

/* ─── Contact form ──────────────────────────────────────────── */
function buildMailto(name: string, email: string, message: string) {
  const subject = `${name} via portfolio`;
  const body = `${message}\n\n—\n${name} <${email}>`;
  return `mailto:${EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

function ContactForm() {
  const [status, setStatus] = useState<Status>('idle');
  const [errors, setErrors] = useState<FieldErrors>({});
  const [serverError, setServerError] = useState('');
  const [sentTo, setSentTo] = useState('');
  const formRef = useRef<HTMLFormElement>(null);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const name = String(data.get('name') ?? '').trim();
    const email = String(data.get('email') ?? '').trim();
    const message = String(data.get('message') ?? '').trim();
    const company = String(data.get('company') ?? '');

    const nextErrors: FieldErrors = {};
    if (!name) nextErrors.name = 'Add your name.';
    if (!EMAIL_PATTERN.test(email)) nextErrors.email = 'Enter a valid email so I can reply.';
    if (message.length < 10) nextErrors.message = 'Write at least a sentence so I know how to help.';
    setErrors(nextErrors);
    setServerError('');

    const firstInvalid = (['name', 'email', 'message'] as const).find((k) => nextErrors[k]);
    if (firstInvalid) {
      formRef.current?.querySelector<HTMLElement>(`[name="${firstInvalid}"]`)?.focus();
      return;
    }

    setStatus('sending');
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, message, company }),
      });

      if (res.ok) {
        setSentTo(email);
        setStatus('sent');
        return;
      }

      const payload: { error?: string } = await res.json().catch(() => ({}));
      if (res.status === 503 && payload.error === 'not_configured') {
        window.location.href = buildMailto(name, email, message);
        setStatus('mailto');
        return;
      }
      if (res.status === 400 && payload.error) {
        setServerError(payload.error);
      } else {
        setServerError(`Your message didn't go through. Try again, or email me at ${EMAIL}.`);
      }
      setStatus('error');
    } catch {
      setServerError(`Couldn't reach the server. Check your connection, or email me at ${EMAIL}.`);
      setStatus('error');
    }
  };

  const reset = () => {
    formRef.current?.reset();
    setErrors({});
    setServerError('');
    setStatus('idle');
  };

  const done = status === 'sent' || status === 'mailto';

  return (
    <AnimatePresence mode="wait" initial={false}>
      {done ? (
        <motion.div
          key="done"
          initial={{ opacity: 0, scale: 0.96, filter: 'blur(8px)' }}
          animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
          exit={{ opacity: 0, scale: 0.96, filter: 'blur(8px)' }}
          transition={{ duration: 0.45, ease: EASE_OUT }}
          className="flex min-h-[420px] flex-col items-start justify-center"
          role="status"
        >
          <span className="lg-cta-orb mb-6 flex h-14 w-14 items-center justify-center rounded-full">
            <Check className="relative z-[1] h-6 w-6 text-white" aria-hidden="true" />
          </span>
          <h3 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">
            {status === 'sent' ? 'Message sent.' : 'Opening your email app.'}
          </h3>
          <p className="mt-3 max-w-md text-[15px] leading-relaxed text-white/70">
            {status === 'sent' ? (
              <>
                Thanks for reaching out. I&apos;ll reply to <span className="text-white">{sentTo}</span>.
              </>
            ) : (
              <>
                Your message is filled in and ready to send. If nothing opened, email me at{' '}
                <a href={`mailto:${EMAIL}`} className="lg-focus rounded text-white underline underline-offset-4">
                  {EMAIL}
                </a>
                .
              </>
            )}
          </p>
          <button
            type="button"
            onClick={reset}
            className="lg-chip lg-press lg-focus mt-8 h-11 rounded-full px-5 text-sm font-medium text-white"
          >
            Write another message
          </button>
        </motion.div>
      ) : (
        <motion.form
          key="form"
          ref={formRef}
          onSubmit={handleSubmit}
          noValidate
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.96, filter: 'blur(8px)' }}
          transition={{ duration: 0.35, ease: EASE_OUT }}
          className="flex flex-col gap-5"
        >
          <div>
            <h3 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">Send a message</h3>
            <p className="mt-1.5 text-sm text-white/60">
              It goes straight to my inbox, and I reply from {EMAIL}.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Name" name="name" error={errors.name}>
              <input
                id="contact-name"
                name="name"
                type="text"
                autoComplete="name"
                placeholder="Jane Doe"
                maxLength={100}
                className="lg-field"
                aria-invalid={errors.name ? true : undefined}
                aria-describedby={errors.name ? 'contact-name-error' : undefined}
              />
            </Field>
            <Field label="Email" name="email" error={errors.email}>
              <input
                id="contact-email"
                name="email"
                type="email"
                autoComplete="email"
                placeholder="jane@company.com"
                maxLength={200}
                className="lg-field"
                aria-invalid={errors.email ? true : undefined}
                aria-describedby={errors.email ? 'contact-email-error' : undefined}
              />
            </Field>
          </div>

          <Field label="Message" name="message" error={errors.message}>
            <textarea
              id="contact-message"
              name="message"
              rows={5}
              maxLength={5000}
              placeholder="A few lines about the role, the network, or the idea."
              className="lg-field resize-none"
              data-lenis-prevent
              aria-invalid={errors.message ? true : undefined}
              aria-describedby={errors.message ? 'contact-message-error' : undefined}
            />
          </Field>

          {/* Honeypot — hidden from people, irresistible to bots. */}
          <div className="absolute -left-[9999px] h-px w-px overflow-hidden" aria-hidden="true">
            <label>
              Company
              <input type="text" name="company" tabIndex={-1} autoComplete="off" />
            </label>
          </div>

          <div className="mt-1 flex flex-col-reverse items-stretch gap-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="min-h-5 text-sm text-[#FFB38A]" role="alert">
              {serverError}
            </p>
            <button
              type="submit"
              disabled={status === 'sending'}
              className="lg-cta lg-press lg-focus justify-center"
            >
              {status === 'sending' ? (
                <>
                  <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />
                  Sending…
                </>
              ) : (
                <>
                  Send message
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </>
              )}
            </button>
          </div>
        </motion.form>
      )}
    </AnimatePresence>
  );
}

function Field({
  label,
  name,
  error,
  children,
}: {
  label: string;
  name: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={`contact-${name}`} className="text-[13px] font-medium text-white/70">
        {label}
      </label>
      {children}
      {error && (
        <p id={`contact-${name}-error`} className="text-[13px] text-[#FFB38A]">
          {error}
        </p>
      )}
    </div>
  );
}

/* ─── Section ───────────────────────────────────────────────── */
export default function Contact() {
  const lenis = useLenis();

  const backToTop = () => {
    if (lenis) lenis.scrollTo(0, { duration: 1.6 });
    else window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <section
      id="contact"
      className="relative w-full overflow-hidden bg-[#050505] pb-36 pt-24 md:pb-40 md:pt-32"
    >
      <motion.header
        className="relative z-10 mx-auto max-w-2xl px-6 text-center"
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-80px' }}
        transition={{ duration: 0.7, ease: 'easeOut' }}
      >
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-zinc-800/80 bg-zinc-900/80 px-4 py-1.5 text-[10px] font-bold uppercase tracking-[0.3em] text-zinc-500">
          <Mail className="h-3.5 w-3.5 text-[#FF0080]" aria-hidden="true" />
          Get in touch
        </div>
        <h2 className="mb-5 text-4xl font-bold md:text-5xl lg:text-6xl">
          <span className="bg-gradient-to-r from-[#FF0080] via-[#FF4060] to-[#FF6B35] bg-clip-text text-transparent">
            Let&apos;s talk
          </span>
        </h2>
        <p className="mx-auto max-w-lg text-sm leading-relaxed text-zinc-500 md:text-base">
          Hiring for a network or cloud role, or have something that needs building? I&apos;d like to
          hear about it.
        </p>
      </motion.header>

      <div className="relative py-14 md:py-20">
        <div className="contact-aurora" aria-hidden="true" />
        <LiquidField className="absolute inset-0 h-full w-full" />

        <div className="relative z-10 mx-auto grid max-w-6xl grid-cols-1 items-center gap-5 px-5 sm:px-6 lg:grid-cols-12 lg:gap-6">
          <motion.div
            className="flex flex-col gap-4 lg:col-span-5"
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.8, ease: EASE_OUT }}
          >
            <LocalTime />
            <EmailPill />
            <div className="flex gap-4">
              <GlassLink href={LINKEDIN_URL} label="Adhil Shahid on LinkedIn (opens in a new tab)">
                <LinkedInMark />
                LinkedIn
              </GlassLink>
              <GlassLink href={GITHUB_URL} label="Adhil Shahid on GitHub (opens in a new tab)">
                <GitHubMark />
                GitHub
              </GlassLink>
            </div>
          </motion.div>

          <motion.div
            className="lg:col-span-7"
            initial={{ opacity: 0, y: 60 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.9, delay: 0.1, ease: EASE_OUT }}
          >
            <GlassSurface
              glass={{ radius: 40, bezel: 48, refraction: 40, frost: 30 }}
              className="lg-surface--panel rounded-[40px] p-6 sm:p-9"
            >
              <div className="relative z-[2]">
                <ContactForm />
              </div>
            </GlassSurface>
          </motion.div>
        </div>
      </div>

      <footer className="relative z-10 mx-auto mt-10 flex max-w-6xl flex-col items-center justify-between gap-4 px-6 text-[13px] text-white/45 sm:flex-row">
        <p>© {new Date().getFullYear()} Adhil Shahid · Network &amp; cloud engineer</p>
        <button
          type="button"
          onClick={backToTop}
          className="lg-focus group flex items-center gap-2 rounded-full px-3 py-1.5 text-white/60 transition-colors hover:text-white"
        >
          Back to top
          <ArrowUp className="h-3.5 w-3.5 transition-transform duration-300 group-hover:-translate-y-0.5" aria-hidden="true" />
        </button>
      </footer>
    </section>
  );
}
