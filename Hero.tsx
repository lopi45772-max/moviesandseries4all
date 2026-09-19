import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Bookmark, BookmarkCheck, Calendar, ChevronLeft, ChevronRight, Clock, Info, Play, Star } from "lucide-react";
import { titleKey, type Title } from "../data/movies";
import { cn } from "../utils/cn";
import SafeImage from "./SafeImage";

interface Props {
  featured: Title[];
  watchlist: string[];
  onToggleList: (t: Title) => void;
  onSelect: (t: Title) => void;
  onPlay: (t: Title) => void;
}

const AUTOPLAY_MS = 7000;

export default function Hero({ featured, watchlist, onToggleList, onSelect, onPlay }: Props) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  const safeIndex = featured.length > 0 ? index % featured.length : 0;
  const current = featured[safeIndex];

  const go = useCallback(
    (dir: 1 | -1) => setIndex((i) => (i + dir + featured.length) % featured.length),
    [featured.length]
  );

  useEffect(() => {
    if (paused || featured.length === 0) return;
    timer.current = setInterval(() => setIndex((i) => (i + 1) % featured.length), AUTOPLAY_MS);
    return () => {
      if (timer.current) clearInterval(timer.current);
    };
  }, [paused, featured.length, index]);

  if (!current) return null;
  const inList = watchlist.includes(titleKey(current));

  return (
    <section
      className="relative min-h-[92vh] w-full overflow-hidden"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {/* Backdrops */}
      <AnimatePresence mode="popLayout">
        <motion.div
          key={titleKey(current)}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.9 }}
          className="absolute inset-0"
        >
          <SafeImage
            seed={`hero-${titleKey(current)}`}
            src={current.backdrop}
            alt={current.title}
            wrapperClassName="h-full w-full"
            className="animate-kenburns"
          />
        </motion.div>
      </AnimatePresence>

      {/* Solid scrims (no gradients): full dim + side panel for readability */}
      <div className="absolute inset-0 bg-ink/55" />
      <div className="absolute inset-y-0 left-0 hidden w-[46%] bg-ink/72 md:block" />
      <div className="absolute inset-x-0 bottom-0 h-28 bg-ink/80 blur-2xl" />
      <div className="vignette pointer-events-none absolute inset-0" />

      {/* Content */}
      <div className="relative z-10 mx-auto flex min-h-[92vh] max-w-7xl flex-col justify-end px-4 pt-36 pb-28 sm:px-6 md:justify-center md:pb-20">
        <AnimatePresence mode="wait">
          <motion.div
            key={titleKey(current) + "-copy"}
            initial={{ opacity: 0, y: 32 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -18 }}
            transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
            className="max-w-2xl"
          >
            <div className="flex flex-wrap items-center gap-2">
              <span className="flex items-center gap-1.5 rounded-full bg-ember px-3 py-1 text-[11px] font-bold tracking-widest text-white uppercase">
                <span className="h-1.5 w-1.5 animate-pulse-dot rounded-full bg-white" />
                #{safeIndex + 1} Featured
              </span>
              <span className="rounded-md border border-zinc-500 px-2 py-0.5 text-[11px] font-bold text-zinc-200">
                {current.quality}
              </span>
              <span className="rounded-md bg-zinc-200 px-2 py-0.5 text-[11px] font-bold text-black">
                {current.maturity}
              </span>
              <span className="rounded-md bg-panel2 px-2 py-0.5 text-[11px] font-bold text-zinc-300 ring-1 ring-line">
                {current.type === "movie" ? "Movie" : "Series"}
              </span>
            </div>

            <h1 className="mt-4 font-display text-5xl leading-[0.95] font-900 tracking-tight text-white sm:text-6xl lg:text-7xl">
              {current.title}
            </h1>
            {current.tagline && (
              <p className="mt-2 font-display text-sm font-medium tracking-wide text-zinc-400 italic sm:text-base">
                “{current.tagline}”
              </p>
            )}

            <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
              {current.rating > 0 ? (
                <span className="flex items-center gap-1.5 font-bold text-gold">
                  <Star size={16} fill="currentColor" />
                  {current.rating.toFixed(1)}
                  <span className="font-medium text-zinc-400">/ 10 · {current.votes}</span>
                </span>
              ) : (
                <span className="flex items-center gap-1.5 font-bold text-gold">
                  <Star size={16} fill="currentColor" /> New release
                </span>
              )}
              <span className="flex items-center gap-1.5 text-zinc-300">
                <Calendar size={15} className="text-zinc-500" /> {current.year}
              </span>
              {current.duration && (
                <span className="flex items-center gap-1.5 text-zinc-300">
                  <Clock size={15} className="text-zinc-500" /> {current.duration}
                </span>
              )}
            </div>

            {current.genres.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {current.genres.map((g) => (
                  <span
                    key={g}
                    className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-zinc-200 ring-1 ring-white/15 backdrop-blur"
                  >
                    {g}
                  </span>
                ))}
              </div>
            )}

            <p className="mt-4 line-clamp-3 max-w-xl text-[15px] leading-relaxed text-zinc-300">
              {current.overview}
            </p>

            <div className="mt-6 flex flex-wrap items-center gap-3">
              <button
                onClick={() => onPlay(current)}
                className="group flex items-center gap-2.5 rounded-full bg-ember px-7 py-3.5 font-display text-[15px] font-bold text-white shadow-xl shadow-ember/30 transition hover:bg-red-700 active:scale-95"
              >
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white text-ember transition group-hover:scale-110">
                  <Play size={14} fill="currentColor" />
                </span>
                Watch Now
                <span className="rounded-md bg-white/20 px-2 py-0.5 text-[10px] font-900 tracking-widest">FREE</span>
              </button>
              <button
                onClick={() => onSelect(current)}
                className="flex items-center gap-2 rounded-full bg-white/12 px-6 py-3.5 font-display text-[15px] font-bold text-white ring-1 ring-white/20 backdrop-blur transition hover:bg-white/20 active:scale-95"
              >
                <Info size={17} /> More Info
              </button>
              <button
                onClick={() => onToggleList(current)}
                aria-label="Toggle watchlist"
                className={cn(
                  "flex h-[52px] w-[52px] items-center justify-center rounded-full ring-1 backdrop-blur transition active:scale-90",
                  inList
                    ? "bg-gold text-black ring-gold"
                    : "bg-white/12 text-white ring-white/20 hover:bg-white/20"
                )}
              >
                {inList ? <BookmarkCheck size={19} /> : <Bookmark size={19} />}
              </button>
            </div>

            {current.cast.length > 0 && (
              <p className="mt-5 text-xs font-medium text-zinc-500">
                Starring <span className="text-zinc-300">{current.cast.slice(0, 3).map((c) => c.name).join(", ")}</span>
              </p>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Arrows */}
      <div className="absolute top-1/2 right-4 z-20 hidden -translate-y-1/2 flex-col gap-2 md:flex lg:right-8">
        <button
          onClick={() => go(-1)}
          className="flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white ring-1 ring-white/20 backdrop-blur transition hover:bg-ember"
          aria-label="Previous"
        >
          <ChevronLeft size={20} />
        </button>
        <button
          onClick={() => go(1)}
          className="flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white ring-1 ring-white/20 backdrop-blur transition hover:bg-ember"
          aria-label="Next"
        >
          <ChevronRight size={20} />
        </button>
      </div>

      {/* Selector rail */}
      <div className="absolute inset-x-0 bottom-0 z-20 border-t border-white/10 bg-ink/70 backdrop-blur-xl">
        <div className="no-scrollbar mx-auto flex max-w-7xl items-stretch gap-2 overflow-x-auto px-4 py-3 sm:px-6">
          {featured.map((f, i) => (
            <button
              key={titleKey(f)}
              onClick={() => setIndex(i)}
              className={cn(
                "group relative flex min-w-[190px] flex-1 items-center gap-3 rounded-xl p-2 text-left transition",
                i === safeIndex ? "bg-white/10 ring-1 ring-white/20" : "hover:bg-white/5"
              )}
            >
              <SafeImage seed={titleKey(f)} src={f.poster} alt={f.title} wrapperClassName="h-12 w-9 shrink-0 rounded-md" />
              <span className="min-w-0">
                <span className={cn("block truncate text-[13px] font-bold", i === safeIndex ? "text-white" : "text-zinc-400")}>
                  {f.title}
                </span>
                <span className="mt-0.5 block text-[11px] font-medium text-zinc-500">
                  {f.year} · ★ {f.rating > 0 ? f.rating.toFixed(1) : "New"}
                </span>
              </span>
              {i === safeIndex && !paused && (
                <motion.span
                  key={`bar-${safeIndex}`}
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ duration: AUTOPLAY_MS / 1000, ease: "linear" }}
                  className="absolute right-2 bottom-0 left-2 h-0.5 origin-left rounded-full bg-ember"
                />
              )}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
