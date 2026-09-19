import { motion } from "framer-motion";
import { Bookmark, BookmarkCheck, Info, Play, Plus, Star } from "lucide-react";
import type { Title } from "../data/movies";
import { cn } from "../utils/cn";
import SafeImage from "./SafeImage";

interface Props {
  title: Title;
  onSelect: (t: Title) => void;
  onPlay: (t: Title) => void;
  inList: boolean;
  onToggleList: (t: Title) => void;
  layout?: "grid" | "list";
}

export function RatingBadge({ rating, className }: { rating: number; className?: string }) {
  if (rating <= 0) return null;
  return (
    <span
      className={cn(
        "flex items-center gap-1 rounded-lg bg-black/80 px-2 py-1 text-xs font-bold text-gold backdrop-blur",
        className
      )}
    >
      <Star size={11} fill="currentColor" /> {rating.toFixed(1)}
    </span>
  );
}

export default function MovieCard({ title: t, onSelect, onPlay, inList, onToggleList, layout = "grid" }: Props) {
  if (layout === "list") {
    return (
      <motion.div
        layout
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        className="group flex items-center gap-4 rounded-2xl border border-line bg-panel p-3 transition hover:border-zinc-600 sm:gap-5 sm:p-4"
      >
        <button onClick={() => onSelect(t)} className="relative shrink-0">
          <SafeImage seed={t.id} src={t.poster} alt={t.title} wrapperClassName="h-32 w-[86px] rounded-xl sm:h-40 sm:w-28" />
          {t.isNew && (
            <span className="absolute top-1.5 left-1.5 rounded-md bg-ember px-1.5 py-0.5 text-[10px] font-bold text-white">
              NEW
            </span>
          )}
        </button>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <button onClick={() => onSelect(t)} className="block truncate text-left font-display text-base font-bold text-white hover:text-ember sm:text-lg">
                {t.title}
              </button>
              <p className="mt-1 text-xs text-zinc-500 sm:text-[13px]">
                {t.year} · {t.duration} · {t.type === "movie" ? "Movie" : `${t.seasons} Seasons`} · {t.maturity}
              </p>
            </div>
            {t.rating > 0 && (
              <span className="flex shrink-0 items-center gap-1 rounded-lg bg-coal px-2.5 py-1.5 text-sm font-bold text-gold ring-1 ring-line">
                <Star size={13} fill="currentColor" /> {t.rating.toFixed(1)}
              </span>
            )}
          </div>
          <p className="mt-2 line-clamp-2 hidden text-[13px] leading-relaxed text-zinc-400 sm:block">{t.overview}</p>
          <div className="mt-2.5 flex items-center gap-2">
            <button
              onClick={() => onPlay(t)}
              className="flex items-center gap-1.5 rounded-full bg-ember px-4 py-2 text-xs font-bold text-white transition hover:bg-red-700 active:scale-95"
            >
              <Play size={12} fill="currentColor" /> Watch Now
              <span className="rounded bg-white/20 px-1.5 py-0.5 text-[9px] font-900 tracking-wider">FREE</span>
            </button>
            <button
              onClick={() => onSelect(t)}
              className="flex items-center gap-1.5 rounded-full bg-panel2 px-4 py-2 text-xs font-bold text-zinc-200 ring-1 ring-line transition hover:bg-line"
            >
              <Info size={12} /> Details
            </button>
            <button
              onClick={() => onToggleList(t)}
              className={cn(
                "flex h-8 w-8 items-center justify-center rounded-full ring-1 transition active:scale-90",
                inList ? "bg-gold text-black ring-gold" : "bg-panel2 text-zinc-300 ring-line hover:text-white"
              )}
              aria-label="Toggle watchlist"
            >
              {inList ? <BookmarkCheck size={14} /> : <Plus size={14} />}
            </button>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="group"
    >
      <div className="relative">
        <button onClick={() => onSelect(t)} className="block w-full text-left" aria-label={t.title}>
          <SafeImage
            seed={t.id}
            src={t.poster}
            alt={t.title}
            wrapperClassName="aspect-[2/3] w-full rounded-2xl ring-1 ring-line transition duration-300 group-hover:ring-ember/70"
            className="transition duration-500 group-hover:scale-105"
          />
        </button>

        {/* Badges */}
        <div className="absolute top-2.5 left-2.5 flex flex-col items-start gap-1.5">
          <RatingBadge rating={t.rating} />
          {t.isNew && (
            <span className="rounded-md bg-ember px-2 py-0.5 text-[10px] font-bold tracking-wider text-white">NEW</span>
          )}
          {t.comingSoon && (
            <span className="rounded-md bg-gold px-2 py-0.5 text-[10px] font-bold tracking-wider text-black">SOON</span>
          )}
        </div>
        <span className="absolute top-2.5 right-2.5 rounded-md bg-black/80 px-1.5 py-0.5 text-[10px] font-bold text-zinc-200 backdrop-blur">
          {t.quality}
        </span>

        {/* Hover actions */}
        <div className="absolute inset-x-2.5 bottom-2.5 translate-y-2 opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
          <div className="flex items-center gap-2 rounded-xl bg-black/85 p-2 backdrop-blur-md">
            <button
              onClick={() => onPlay(t)}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-ember text-white transition hover:bg-red-700"
              aria-label={`Play ${t.title}`}
            >
              <Play size={15} fill="currentColor" />
            </button>
            <button
              onClick={() => onToggleList(t)}
              className={cn(
                "flex h-9 w-9 items-center justify-center rounded-full ring-1 transition",
                inList ? "bg-gold text-black ring-gold" : "bg-white/10 text-white ring-white/25 hover:bg-white/20"
              )}
              aria-label="Toggle watchlist"
            >
              {inList ? <BookmarkCheck size={15} /> : <Bookmark size={15} />}
            </button>
            <button
              onClick={() => onSelect(t)}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white ring-1 ring-white/25 transition hover:bg-white/20"
              aria-label="More info"
            >
              <Info size={15} />
            </button>
            <span className="ml-auto pr-1.5 text-[11px] font-bold text-zinc-300">{t.maturity}</span>
          </div>
        </div>
      </div>

      <div className="px-1 pt-3">
        <button onClick={() => onSelect(t)} className="block w-full truncate text-left font-display text-[15px] font-bold text-white transition hover:text-ember">
          {t.title}
        </button>
        <p className="mt-1 truncate text-xs font-medium text-zinc-500">
          {[
            `${t.year}`,
            t.type === "movie"
              ? t.duration || null
              : t.seasons
                ? `${t.seasons} Season${t.seasons > 1 ? "s" : ""}`
                : "TV Series",
            t.genres.slice(0, 2).join(" · ") || null,
          ]
            .filter(Boolean)
            .join(" · ")}
        </p>
        <button
          onClick={() => onPlay(t)}
          className="mt-2.5 flex w-full items-center justify-center gap-2 rounded-xl bg-ember py-2.5 text-[13px] font-bold text-white shadow-lg shadow-ember/20 transition hover:bg-red-700 active:scale-[0.98]"
        >
          <Play size={13} fill="currentColor" /> {t.comingSoon ? "Watch Trailer" : "Watch Now"}
          {!t.comingSoon && (
            <span className="rounded bg-white/20 px-1.5 py-0.5 text-[9px] font-900 tracking-wider">FREE</span>
          )}
        </button>
      </div>
    </motion.div>
  );
}
