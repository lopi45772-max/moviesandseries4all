import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Award,
  BadgeCheck,
  Bell,
  BellRing,
  CalendarClock,
  ChevronRight,
  Clapperboard,
  History,
  Info,
  Play,
  Star,
  Trophy,
  X,
} from "lucide-react";
import type { Title } from "../data/movies";
import { cn } from "../utils/cn";
import SafeImage from "./SafeImage";

/* ---------------- Studios marquee ---------------- */
const STUDIOS = ["A24", "WARNER BROS.", "MARVEL", "HBO", "PIXAR", "UNIVERSAL", "NETFLIX ORIGINALS", "PARAMOUNT", "DISNEY", "SONY PICTURES"];

export function StudiosMarquee() {
  return (
    <div className="overflow-hidden border-y border-line bg-coal py-5">
      <div className="flex w-max animate-marquee items-center gap-14 pr-14">
        {[...STUDIOS, ...STUDIOS].map((s, i) => (
          <span key={i} className="flex items-center gap-14">
            <span className="font-display text-lg font-800 tracking-[0.25em] whitespace-nowrap text-zinc-600 transition hover:text-zinc-300">
              {s}
            </span>
            <Clapperboard size={15} className="shrink-0 text-ember/60" />
          </span>
        ))}
      </div>
    </div>
  );
}

/* ---------------- Continue watching ---------------- */
export function ContinueWatching({
  titles,
  onSelect,
  onPlay,
}: {
  titles: Title[];
  onSelect: (t: Title) => void;
  onPlay: (t: Title) => void;
}) {
  const [dismissed, setDismissed] = useState<number[]>([]);
  const list = titles.filter((t) => t.progress && !dismissed.includes(t.id));
  if (list.length === 0) return null;

  return (
    <section className="mx-auto max-w-7xl px-4 pt-14 sm:px-6">
      <div className="mb-6 flex items-end justify-between">
        <div>
          <p className="flex items-center gap-1.5 text-[11px] font-bold tracking-[0.2em] text-ember uppercase">
            <History size={13} /> Pick up where you left off
          </p>
          <h2 className="mt-1.5 font-display text-3xl font-900 tracking-tight text-white">Continue Watching</h2>
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {list.map((t, i) => {
          const pct = t.progress ?? 0;
          const remaining = t.runtimeMins ? Math.max(5, Math.round(t.runtimeMins * (1 - pct / 100))) : 24;
          return (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.07 }}
              className="group overflow-hidden rounded-2xl border border-line bg-panel transition hover:border-zinc-600"
            >
              <div className="relative">
                <button onClick={() => onSelect(t)} className="block w-full" aria-label={t.title}>
                  <SafeImage seed={`cw-${t.id}`} src={t.backdrop} alt={t.title} wrapperClassName="aspect-video w-full" />
                </button>
                <div className="absolute inset-0 bg-black/25 transition group-hover:bg-black/45" />
                <button
                  onClick={() => onPlay(t)}
                  className="absolute inset-0 m-auto flex h-14 w-14 scale-90 items-center justify-center rounded-full bg-ember text-white opacity-0 shadow-2xl transition-all duration-300 group-hover:scale-100 group-hover:opacity-100"
                  aria-label={`Resume ${t.title}`}
                >
                  <Play size={20} fill="currentColor" />
                </button>
                <button
                  onClick={() => setDismissed((d) => [...d, t.id])}
                  className="absolute top-2.5 right-2.5 flex h-7 w-7 items-center justify-center rounded-full bg-black/70 text-zinc-300 opacity-0 transition group-hover:opacity-100 hover:text-white"
                  aria-label="Remove"
                >
                  <X size={14} />
                </button>
                <span className="absolute bottom-2.5 left-2.5 rounded-md bg-black/80 px-2 py-1 text-[11px] font-bold text-white">
                  {remaining}m left
                </span>
                {/* Progress */}
                <div className="absolute inset-x-0 bottom-0 h-1 bg-white/20">
                  <div className="h-full bg-ember" style={{ width: `${pct}%` }} />
                </div>
              </div>
              <div className="flex items-center justify-between gap-2 p-3.5">
                <div className="min-w-0">
                  <p className="truncate font-display text-[15px] font-bold text-white">{t.title}</p>
                  <p className="mt-0.5 text-xs font-medium text-zinc-500">
                    {t.type === "series" ? `S${t.seasons} · Episode ${Math.max(1, Math.round((pct / 100) * 8))}` : `${pct}% watched`}
                  </p>
                </div>
                <button
                  onClick={() => onPlay(t)}
                  className="flex shrink-0 items-center gap-1 rounded-full bg-panel2 px-3.5 py-2 text-xs font-bold text-white ring-1 ring-line transition hover:bg-ember hover:ring-ember"
                >
                  <Play size={11} fill="currentColor" /> Resume
                </button>
              </div>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}

/* ---------------- Spotlight ---------------- */
export function Spotlight({
  title,
  onSelect,
  onPlay,
}: {
  title: Title;
  onSelect: (t: Title) => void;
  onPlay: (t: Title) => void;
}) {
  return (
    <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6">
      <div className="dot-grid relative overflow-hidden rounded-3xl border border-gold/25 bg-coal">
        <div className="grid items-center gap-8 p-6 sm:p-10 lg:grid-cols-[300px_1fr] lg:gap-12">
          <motion.div
            initial={{ opacity: 0, x: -24 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="relative mx-auto w-56 sm:w-64 lg:w-full"
          >
            <div className="absolute -inset-3 rounded-3xl bg-gold/10 blur-xl" />
            <SafeImage
              seed={title.id}
              src={title.poster}
              alt={title.title}
              wrapperClassName="relative aspect-[2/3] w-full rounded-2xl ring-1 ring-gold/40"
            />
            <span className="absolute -top-3 left-1/2 flex -translate-x-1/2 items-center gap-1.5 rounded-full bg-gold px-4 py-1.5 text-xs font-900 tracking-wider text-black uppercase shadow-lg">
              <Trophy size={13} /> #1 All time
            </span>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 24 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <p className="flex items-center gap-1.5 text-[11px] font-bold tracking-[0.2em] text-gold uppercase">
              <Award size={13} /> Critics' spotlight
            </p>
            <h2 className="mt-2 font-display text-4xl font-900 tracking-tight text-white sm:text-5xl">{title.title}</h2>
            {title.tagline && (
              <p className="mt-1 text-sm font-medium text-zinc-400 italic">“{title.tagline}”</p>
            )}

            <div className="mt-4 flex flex-wrap items-center gap-3">
              <span className="flex items-center gap-2 rounded-xl bg-gold px-3.5 py-2 font-display text-lg font-900 text-black">
                <Star size={17} fill="currentColor" /> {title.rating.toFixed(1)}
              </span>
              <span className="text-sm font-medium text-zinc-400">{title.votes} verified ratings</span>
              <span className="flex items-center gap-1 rounded-full bg-emerald-500/15 px-3 py-1.5 text-xs font-bold text-emerald-400">
                <BadgeCheck size={13} /> 98% critics score
              </span>
            </div>

            <p className="mt-4 max-w-2xl text-[15px] leading-relaxed text-zinc-300">{title.overview}</p>

            {title.cast.length > 0 && (
              <div className="mt-5 flex flex-wrap gap-2">
                {title.cast.slice(0, 4).map((c) => (
                <span key={c.name} className="flex items-center gap-2 rounded-full bg-panel py-1 pr-4 pl-1 ring-1 ring-line">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-ember font-display text-xs font-bold text-white">
                    {c.name.charAt(0)}
                  </span>
                  <span className="text-xs font-semibold text-zinc-200">{c.name}</span>
                </span>
                ))}
              </div>
            )}

            <div className="mt-6 flex flex-wrap gap-3">
              <button
                onClick={() => onPlay(title)}
                className="flex items-center gap-2 rounded-full bg-gold px-7 py-3 font-display text-[15px] font-bold text-black transition hover:bg-yellow-400 active:scale-95"
              >
                <Play size={16} fill="currentColor" /> Watch the legend
              </button>
              <button
                onClick={() => onSelect(title)}
                className="flex items-center gap-2 rounded-full bg-panel px-6 py-3 font-display text-[15px] font-bold text-white ring-1 ring-line transition hover:bg-panel2"
              >
                <Info size={16} /> Full details <ChevronRight size={15} />
              </button>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

/* ---------------- Coming soon ---------------- */
export function ComingSoon({
  titles,
  onSelect,
  onPlay,
  notify,
}: {
  titles: Title[];
  onSelect: (t: Title) => void;
  onPlay: (t: Title) => void;
  notify: (msg: string) => void;
}) {
  const [reminders, setReminders] = useState<number[]>([]);

  const daysUntil = (dateStr: string) => {
    const diff = new Date(dateStr).getTime() - Date.now();
    return Math.max(1, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  };

  const list = useMemo(() => titles.filter((t) => t.comingSoon), [titles]);

  return (
    <section id="coming-soon" className="scroll-mt-24 border-y border-line bg-coal/60 py-14">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="mb-7 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="flex items-center gap-1.5 text-[11px] font-bold tracking-[0.2em] text-ember uppercase">
              <CalendarClock size={13} /> Mark your calendar
            </p>
            <h2 className="mt-1.5 font-display text-3xl font-900 tracking-tight text-white sm:text-4xl">Coming Soon</h2>
          </div>
          <p className="text-sm font-medium text-zinc-500">Set a reminder — we'll ping you on release day.</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {list.map((t, i) => {
            const days = daysUntil(t.releaseDate);
            const active = reminders.includes(t.id);
            return (
              <motion.div
                key={t.id}
                initial={{ opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.07 }}
                className="group flex gap-4 rounded-2xl border border-line bg-panel p-3 transition hover:border-zinc-600"
              >
                <button onClick={() => onSelect(t)} className="shrink-0" aria-label={t.title}>
                  <SafeImage seed={t.id} src={t.poster} alt={t.title} wrapperClassName="h-36 w-24 rounded-xl" />
                </button>
                <div className="flex min-w-0 flex-1 flex-col">
                  <p className="truncate font-display text-[15px] font-bold text-white">{t.title}</p>
                  <p className="mt-0.5 text-xs font-medium text-zinc-500">
                    {new Date(t.releaseDate + "T12:00:00").toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </p>
                  <div className="mt-2 flex items-center gap-2">
                    <span className="rounded-lg bg-ember/12 px-2.5 py-1.5 font-display text-sm font-900 text-ember">
                      {days}
                    </span>
                    <span className="text-[11px] leading-tight font-bold text-zinc-400 uppercase">
                      days
                      <br />
                      to go
                    </span>
                  </div>
                  <div className="flex-1" />
                  <button
                    onClick={() => {
                      setReminders((r) => (active ? r.filter((x) => x !== t.id) : [...r, t.id]));
                      notify(active ? `Reminder removed for ${t.title}` : `We'll remind you: ${t.title}`);
                    }}
                    className={cn(
                      "mt-2 flex items-center justify-center gap-1.5 rounded-full py-2 text-xs font-bold ring-1 transition active:scale-95",
                      active
                        ? "bg-ember text-white ring-ember"
                        : "bg-panel2 text-zinc-200 ring-line hover:ring-ember hover:text-white"
                    )}
                  >
                    {active ? <BellRing size={13} /> : <Bell size={13} />}
                    {active ? "Reminder set" : "Remind me"}
                  </button>
                  <button
                    onClick={() => onPlay(t)}
                    className="mt-2 flex items-center justify-center gap-1.5 rounded-full bg-ember py-2 text-xs font-bold text-white transition hover:bg-red-700 active:scale-95"
                  >
                    <Play size={13} fill="currentColor" /> Watch Trailer
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
