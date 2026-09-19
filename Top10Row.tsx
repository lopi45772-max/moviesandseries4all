import { useRef } from "react";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight, Flame, Play, Star } from "lucide-react";
import type { Title } from "../data/movies";
import SafeImage from "./SafeImage";

interface Props {
  titles: Title[];
  onSelect: (t: Title) => void;
  onPlay: (t: Title) => void;
}

export default function Top10Row({ titles, onSelect, onPlay }: Props) {
  const rail = useRef<HTMLDivElement>(null);
  const scroll = (dir: 1 | -1) =>
    rail.current?.scrollBy({ left: dir * 520, behavior: "smooth" });

  return (
    <section className="relative mx-auto max-w-7xl px-4 py-14 sm:px-6">
      <div className="mb-7 flex items-end justify-between">
        <div>
          <p className="flex items-center gap-1.5 text-[11px] font-bold tracking-[0.2em] text-ember uppercase">
            <Flame size={13} /> Updated hourly
          </p>
          <h2 className="mt-1.5 font-display text-3xl font-900 tracking-tight text-white sm:text-4xl">
            Top 10 Trending Today
          </h2>
        </div>
        <div className="hidden gap-2 sm:flex">
          <button
            onClick={() => scroll(-1)}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-line bg-panel text-zinc-300 transition hover:border-ember hover:text-white"
            aria-label="Scroll left"
          >
            <ChevronLeft size={18} />
          </button>
          <button
            onClick={() => scroll(1)}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-line bg-panel text-zinc-300 transition hover:border-ember hover:text-white"
            aria-label="Scroll right"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      <div ref={rail} className="no-scrollbar -mx-4 flex snap-x gap-5 overflow-x-auto px-4 pb-2 sm:-mx-6 sm:px-6">
        {titles.slice(0, 10).map((t, i) => (
          <motion.div
            key={t.id}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ delay: (i % 5) * 0.06, duration: 0.4 }}
            className="group flex shrink-0 snap-start items-end"
          >
            <span className="text-stroke font-bebas -mr-5 mb-[-14px] text-[118px] leading-none font-normal select-none sm:-mr-7 sm:text-[168px]">
              {i + 1}
            </span>
            <div className="relative w-[150px] sm:w-[188px]">
              <button onClick={() => onSelect(t)} className="block w-full" aria-label={t.title}>
                <SafeImage
                  seed={t.id}
                  src={t.poster}
                  alt={t.title}
                  wrapperClassName="aspect-[2/3] w-full rounded-xl ring-1 ring-line transition duration-300 group-hover:ring-ember"
                  className="transition duration-500 group-hover:scale-[1.04]"
                />
              </button>
              <button
                onClick={() => onPlay(t)}
                className="absolute inset-0 m-auto flex h-12 w-12 scale-75 items-center justify-center rounded-full bg-ember text-white opacity-0 shadow-xl shadow-black/50 transition-all duration-300 group-hover:scale-100 group-hover:opacity-100"
                aria-label={`Play ${t.title}`}
              >
                <Play size={18} fill="currentColor" />
              </button>
              <div className="absolute inset-x-2 bottom-2 flex items-center justify-between rounded-lg bg-black/85 px-2.5 py-1.5 backdrop-blur">
                <span className="flex items-center gap-1 text-xs font-bold text-gold">
                  <Star size={11} fill="currentColor" /> {t.rating > 0 ? t.rating.toFixed(1) : "SOON"}
                </span>
                <span className="text-[10px] font-bold tracking-wider text-zinc-400 uppercase">
                  {t.type === "movie" ? "Film" : "Show"}
                </span>
              </div>
              <button
                onClick={() => onPlay(t)}
                className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-xl bg-ember py-2 text-xs font-bold text-white shadow-lg shadow-ember/20 transition hover:bg-red-700 active:scale-[0.97]"
              >
                <Play size={12} fill="currentColor" /> Watch Now
              </button>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
