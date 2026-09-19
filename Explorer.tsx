import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowDownAZ,
  Calendar,
  Check,
  ChevronDown,
  Clapperboard,
  Clock,
  Dices,
  Flame,
  LayoutGrid,
  Library,
  RefreshCw,
  Rows3,
  SearchX,
  SlidersHorizontal,
  Star,
  TrendingUp,
  Tv,
  WifiOff,
  X,
} from "lucide-react";
import {
  GENRES,
  RATING_OPTIONS,
  SORT_OPTIONS,
  YEAR_OPTIONS,
  matchYear,
  sortTitles,
  titleKey,
  type SortId,
  type Title,
  type YearId,
} from "../data/movies";
import { runDiscover } from "../lib/tmdb";
import { cn } from "../utils/cn";
import MovieCard from "./MovieCard";
import { GridSkeleton } from "./Skeletons";

interface Props {
  titles: Title[];
  watchlist: string[];
  onToggleList: (t: Title) => void;
  onSelect: (t: Title) => void;
  onPlay: (t: Title) => void;
  initialType?: "all" | "movie" | "series";
  lockType?: boolean;
  apiVersion?: number;
}

type MediaFilter = "all" | "movie" | "series";

const PAGE_SIZE = 12;

const SORT_ICONS: Record<SortId, React.ReactNode> = {
  popular: <TrendingUp size={15} />,
  rating: <Star size={15} />,
  buzz: <Flame size={15} />,
  newest: <Calendar size={15} />,
  oldest: <Clock size={15} />,
  az: <ArrowDownAZ size={15} />,
};

function Dropdown({
  label,
  value,
  icon,
  open,
  onToggle,
  children,
  align = "right",
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  open: boolean;
  onToggle: () => void;
  children: React.ReactNode;
  align?: "left" | "right";
}) {
  return (
    <div className="relative">
      <button
        onClick={onToggle}
        className={cn(
          "flex items-center gap-2.5 rounded-xl border px-4 py-2.5 text-[13px] font-semibold transition active:scale-[0.98]",
          open ? "border-ember bg-ember/10 text-white" : "border-line bg-panel text-zinc-300 hover:border-zinc-500 hover:text-white"
        )}
      >
        <span className={open ? "text-ember" : "text-zinc-500"}>{icon}</span>
        <span className="hidden text-zinc-500 sm:inline">{label}:</span>
        <span className="max-w-[110px] truncate">{value}</span>
        <ChevronDown size={14} className={cn("text-zinc-500 transition-transform", open && "rotate-180")} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
            transition={{ duration: 0.16 }}
            className={cn(
              "absolute z-30 mt-2 w-64 overflow-hidden rounded-2xl border border-line bg-panel p-1.5 shadow-2xl shadow-black/60",
              align === "right" ? "right-0" : "left-0"
            )}
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function Explorer({
  titles,
  watchlist,
  onToggleList,
  onSelect,
  onPlay,
  initialType = "all",
  lockType = false,
  apiVersion = 0,
}: Props) {
  const [media, setMedia] = useState<MediaFilter>(initialType);
  const [genre, setGenre] = useState<string | null>(null);
  const [sort, setSort] = useState<SortId>("popular");
  const [year, setYear] = useState<YearId>("all");
  const [minRating, setMinRating] = useState<number>(0);
  const [view, setView] = useState<"grid" | "list">("grid");
  const [visible, setVisible] = useState(PAGE_SIZE);
  const [sortOpen, setSortOpen] = useState(false);
  const [yearOpen, setYearOpen] = useState(false);

  /* Remote (TMDB discover) state */
  const [page, setPage] = useState(1);
  const [remoteResults, setRemoteResults] = useState<Title[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [totalResults, setTotalResults] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [remoteFailed, setRemoteFailed] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setSortOpen(false);
        setYearOpen(false);
      }
    };
    window.addEventListener("mousedown", onClick);
    return () => window.removeEventListener("mousedown", onClick);
  }, []);

  useEffect(() => {
    setVisible(PAGE_SIZE);
  }, [media, genre, sort, year, minRating]);

  /* Reset remote paging whenever filters (or API key) change */
  useEffect(() => {
    setPage(1);
    setRemoteResults([]);
    setRemoteFailed(false);
  }, [media, genre, sort, year, minRating, apiVersion]);

  useEffect(() => {
    if (remoteFailed) return;
    let cancelled = false;
    const controller = new AbortController();
    const first = page === 1;
    if (first) setLoading(true);
    else setLoadingMore(true);
    setLoadError(null);

    const apiMedia = media === "series" ? "tv" : media;
    runDiscover({ media: apiMedia, genre, year, minRating, sort, page }, controller.signal)
      .then((res) => {
        if (cancelled) return;
        setRemoteResults((prev) => (first ? res.results : [...prev, ...res.results]));
        setTotalPages(res.totalPages);
        setTotalResults(res.totalResults);
      })
      .catch((err) => {
        if (cancelled) return;
        if ((err as { name?: string })?.name === "AbortError") return;
        if (first) setRemoteFailed(true);
        else setLoadError("Could not load more titles.");
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
          setLoadingMore(false);
        }
      });
    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [page, media, genre, sort, year, minRating, apiVersion, remoteFailed]);

  const showingRemote = !remoteFailed;

  const genreCounts = useMemo(() => {
    const map = new Map<string, number>();
    titles.forEach((t) => {
      if (media !== "all" && t.type !== media) return;
      t.genres.forEach((g) => map.set(g, (map.get(g) ?? 0) + 1));
    });
    return map;
  }, [titles, media]);

  /* Local fallback filtering (offline catalog) */
  const filtered = useMemo(() => {
    let list = titles.filter((t) => !t.comingSoon);
    if (media !== "all") list = list.filter((t) => t.type === media);
    if (genre) list = list.filter((t) => t.genres.includes(genre));
    list = list.filter((t) => matchYear(t.year, year));
    if (minRating > 0) list = list.filter((t) => t.rating >= minRating);
    return sortTitles(list, sort);
  }, [titles, media, genre, sort, year, minRating]);

  const displayList = showingRemote ? remoteResults : filtered.slice(0, visible);
  const displayCount = showingRemote ? totalResults : filtered.length;
  const canLoadMoreRemote = showingRemote && page < totalPages;
  const canLoadMoreLocal = !showingRemote && visible < filtered.length;
  const isEmpty = showingRemote ? !loading && remoteResults.length === 0 : filtered.length === 0;

  const activeChips: { label: string; clear: () => void }[] = [];
  if (!lockType && media !== "all") activeChips.push({ label: media === "movie" ? "Movies" : "Series", clear: () => setMedia("all") });
  if (genre) activeChips.push({ label: genre, clear: () => setGenre(null) });
  if (year !== "all") activeChips.push({ label: YEAR_OPTIONS.find((y) => y.id === year)?.label ?? year, clear: () => setYear("all") });
  if (minRating > 0) activeChips.push({ label: `★ ${minRating}+`, clear: () => setMinRating(0) });

  const reset = () => {
    if (!lockType) setMedia(initialType);
    setGenre(null);
    setSort("popular");
    setYear("all");
    setMinRating(0);
  };

  const surprise = () => {
    const pool = showingRemote ? remoteResults : filtered;
    const src = pool.length > 0 ? pool : titles;
    const pick = src[Math.floor(Math.random() * src.length)];
    if (pick) onSelect(pick);
  };

  const sortLabel = SORT_OPTIONS.find((s) => s.id === sort)?.label ?? "";
  const yearLabel = YEAR_OPTIONS.find((y) => y.id === year)?.label ?? "";

  return (
    <section id="browse" ref={rootRef} className="mx-auto max-w-7xl scroll-mt-24 px-4 py-14 sm:px-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="flex items-center gap-1.5 text-[11px] font-bold tracking-[0.2em] text-ember uppercase">
            <Library size={13} /> The library
          </p>
          <h2 className="mt-1.5 font-display text-3xl font-900 tracking-tight text-white sm:text-4xl">
            Browse Everything
          </h2>
        </div>
        <p className="flex items-center gap-2 text-sm font-medium text-zinc-500">
          <span
            className={cn(
              "flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-900 tracking-widest ring-1",
              showingRemote
                ? "bg-emerald-500/10 text-emerald-400 ring-emerald-500/30"
                : "bg-amber-500/10 text-amber-400 ring-amber-500/30"
            )}
          >
            <span className={cn("h-1.5 w-1.5 rounded-full", showingRemote ? "bg-emerald-400" : "bg-amber-400")} />
            {showingRemote ? "TMDB LIVE" : "OFFLINE"}
          </span>
          <span className="font-bold text-white">{displayCount.toLocaleString()}</span> titles found
        </p>
      </div>

      {/* ===== Control deck ===== */}
      <div className="mt-6 rounded-3xl border border-line bg-coal p-4 sm:p-5">
        {/* Row 1: media segmented + view toggle + actions */}
        <div className="flex flex-wrap items-center gap-3">
          {!lockType ? (
            <div className="flex rounded-2xl bg-panel p-1 ring-1 ring-line">
              {(
                [
                  { id: "all", label: "All", icon: <Library size={14} /> },
                  { id: "movie", label: "Movies", icon: <Clapperboard size={14} /> },
                  { id: "series", label: "Series", icon: <Tv size={14} /> },
                ] as { id: MediaFilter; label: string; icon: React.ReactNode }[]
              ).map((m) => (
                <button
                  key={m.id}
                  onClick={() => setMedia(m.id)}
                  className={cn(
                    "relative flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-[13px] font-bold transition sm:px-5",
                    media === m.id ? "text-white" : "text-zinc-500 hover:text-zinc-200"
                  )}
                >
                  {media === m.id && (
                    <motion.span
                      layoutId="media-pill"
                      className="absolute inset-0 rounded-xl bg-ember shadow-lg shadow-ember/30"
                      transition={{ type: "spring", stiffness: 420, damping: 32 }}
                    />
                  )}
                  <span className="relative z-10 flex items-center gap-1.5">
                    {m.icon}
                    <span className="hidden sm:inline">{m.label}</span>
                  </span>
                </button>
              ))}
            </div>
          ) : (
            <span className="flex items-center gap-2 rounded-2xl bg-ember px-5 py-3 text-[13px] font-bold text-white">
              {initialType === "movie" ? <Clapperboard size={15} /> : <Tv size={15} />}
              {initialType === "movie" ? "Movies" : "TV Series"}
            </span>
          )}

          <div className="flex-1" />

          <div className="flex items-center gap-2">
            <Dropdown
              label="Sort"
              value={sortLabel}
              icon={<SlidersHorizontal size={15} />}
              open={sortOpen}
              onToggle={() => {
                setSortOpen(!sortOpen);
                setYearOpen(false);
              }}
            >
              {SORT_OPTIONS.map((s) => (
                <button
                  key={s.id}
                  onClick={() => {
                    setSort(s.id);
                    setSortOpen(false);
                  }}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition",
                    sort === s.id ? "bg-ember/12 text-white" : "text-zinc-400 hover:bg-panel2 hover:text-white"
                  )}
                >
                  <span
                    className={cn(
                      "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ring-1",
                      sort === s.id ? "bg-ember text-white ring-ember" : "bg-coal text-zinc-500 ring-line"
                    )}
                  >
                    {SORT_ICONS[s.id]}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[13px] font-bold">{s.label}</span>
                    <span className="block truncate text-[11px] text-zinc-500">{s.desc}</span>
                  </span>
                  {sort === s.id && <Check size={15} className="shrink-0 text-ember" />}
                </button>
              ))}
            </Dropdown>

            <Dropdown
              label="Year"
              value={yearLabel}
              icon={<Calendar size={15} />}
              open={yearOpen}
              onToggle={() => {
                setYearOpen(!yearOpen);
                setSortOpen(false);
              }}
            >
              {YEAR_OPTIONS.map((y) => (
                <button
                  key={y.id}
                  onClick={() => {
                    setYear(y.id);
                    setYearOpen(false);
                  }}
                  className={cn(
                    "flex w-full items-center justify-between rounded-xl px-4 py-2.5 text-[13px] font-semibold transition",
                    year === y.id ? "bg-ember/12 text-white" : "text-zinc-400 hover:bg-panel2 hover:text-white"
                  )}
                >
                  {y.label}
                  {year === y.id && <Check size={15} className="text-ember" />}
                </button>
              ))}
            </Dropdown>

            {/* View toggle */}
            <div className="flex rounded-xl bg-panel p-1 ring-1 ring-line">
              {(
                [
                  { id: "grid", icon: <LayoutGrid size={15} /> },
                  { id: "list", icon: <Rows3 size={15} /> },
                ] as const
              ).map((v) => (
                <button
                  key={v.id}
                  onClick={() => setView(v.id)}
                  aria-label={`${v.id} view`}
                  className={cn(
                    "relative flex h-9 w-10 items-center justify-center rounded-lg transition",
                    view === v.id ? "text-white" : "text-zinc-500 hover:text-zinc-200"
                  )}
                >
                  {view === v.id && (
                    <motion.span
                      layoutId="view-pill"
                      className="absolute inset-0 rounded-lg bg-panel2 ring-1 ring-zinc-600"
                      transition={{ type: "spring", stiffness: 420, damping: 32 }}
                    />
                  )}
                  <span className="relative z-10">{v.icon}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Row 2: genres */}
        <div className="mt-4 border-t border-line pt-4">
          <div className="no-scrollbar -mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
            <button
              onClick={() => setGenre(null)}
              className={cn(
                "flex shrink-0 items-center gap-1.5 rounded-full px-4 py-2 text-[13px] font-bold transition active:scale-95",
                genre === null ? "bg-white text-black" : "bg-panel text-zinc-400 ring-1 ring-line hover:text-white"
              )}
            >
              All genres
            </button>
            {GENRES.map((g) => {
              const count = genreCounts.get(g) ?? 0;
              if (!showingRemote && count === 0) return null;
              const active = genre === g;
              return (
                <button
                  key={g}
                  onClick={() => setGenre(active ? null : g)}
                  className={cn(
                    "flex shrink-0 items-center gap-1.5 rounded-full px-4 py-2 text-[13px] font-bold ring-1 transition active:scale-95",
                    active
                      ? "border-transparent bg-ember text-white shadow-lg shadow-ember/25 ring-ember"
                      : "bg-panel text-zinc-400 ring-line hover:border-zinc-500 hover:text-white"
                  )}
                >
                  {g}
                  {!showingRemote && (
                    <span className={cn("rounded-full px-1.5 py-0.5 text-[10px] font-bold", active ? "bg-white/20 text-white" : "bg-coal text-zinc-500")}>
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Row 3: rating + shuffle + chips */}
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1 rounded-xl bg-panel p-1 ring-1 ring-line">
            <Star size={14} className="ml-2.5 text-gold" fill="currentColor" />
            {RATING_OPTIONS.map((r) => (
              <button
                key={r.id}
                onClick={() => setMinRating(r.id)}
                className={cn(
                  "rounded-lg px-3 py-1.5 text-[12px] font-bold transition",
                  minRating === r.id ? "bg-gold text-black" : "text-zinc-500 hover:text-white"
                )}
              >
                {r.label}
              </button>
            ))}
          </div>

          <button
            onClick={surprise}
            className="flex items-center gap-2 rounded-xl border border-dashed border-zinc-600 px-4 py-2.5 text-[13px] font-bold text-zinc-300 transition hover:border-gold hover:text-gold active:scale-95"
          >
            <Dices size={15} /> Surprise me
          </button>

          <AnimatePresence>
            {activeChips.length > 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-wrap items-center gap-1.5"
              >
                {activeChips.map((c) => (
                  <button
                    key={c.label}
                    onClick={c.clear}
                    className="group flex items-center gap-1.5 rounded-full bg-ember/12 py-1.5 pr-2.5 pl-3.5 text-xs font-bold text-ember ring-1 ring-ember/30 transition hover:bg-ember hover:text-white"
                  >
                    {c.label}
                    <X size={12} />
                  </button>
                ))}
                <button
                  onClick={reset}
                  className="rounded-full px-3 py-1.5 text-xs font-bold text-zinc-500 underline-offset-4 transition hover:text-white hover:underline"
                >
                  Clear all
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Offline notice */}
      {!showingRemote && (
        <div className="mt-6 flex flex-wrap items-center gap-3 rounded-2xl border border-amber-500/30 bg-amber-500/10 px-5 py-3.5">
          <WifiOff size={17} className="shrink-0 text-amber-400" />
          <p className="flex-1 text-[13px] font-medium text-amber-200/90">
            TMDB is unreachable — showing the offline catalog. Check your connection or API key.
          </p>
          <button
            onClick={() => {
              setRemoteFailed(false);
              setPage(1);
            }}
            className="rounded-full bg-amber-400 px-4 py-1.5 text-xs font-bold text-black transition hover:bg-amber-300"
          >
            Retry live
          </button>
        </div>
      )}

      {/* ===== Results ===== */}
      {loading && showingRemote && remoteResults.length === 0 ? (
        <GridSkeleton count={12} />
      ) : isEmpty ? (
        <div className="mt-8 rounded-3xl border border-dashed border-line bg-panel/50 px-6 py-16 text-center">
          <SearchX size={36} className="mx-auto text-zinc-600" />
          <p className="mt-4 font-display text-xl font-bold text-white">Nothing matches those filters</p>
          <p className="mt-1 text-sm text-zinc-500">Try widening the year range or lowering the rating.</p>
          <button
            onClick={reset}
            className="mt-5 rounded-full bg-ember px-6 py-2.5 text-sm font-bold text-white transition hover:bg-red-700"
          >
            Reset filters
          </button>
        </div>
      ) : view === "grid" ? (
        <>
          <motion.div layout className="mt-8 grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
            {displayList.map((t) => (
              <MovieCard
                key={titleKey(t)}
                title={t}
                onSelect={onSelect}
                onPlay={onPlay}
                inList={watchlist.includes(titleKey(t))}
                onToggleList={onToggleList}
              />
            ))}
          </motion.div>
          {loadingMore && (
            <div className="mt-8 flex items-center justify-center gap-2 text-sm font-semibold text-zinc-500">
              <RefreshCw size={16} className="animate-spin text-ember" /> Loading more…
            </div>
          )}
          {loadError && <p className="mt-6 text-center text-sm font-semibold text-ember">{loadError}</p>}
          {canLoadMoreRemote && !loadingMore && (
            <div className="mt-10 text-center">
              <button
                onClick={() => setPage((p) => p + 1)}
                className="rounded-full border border-line bg-panel px-8 py-3 text-sm font-bold text-white transition hover:border-ember hover:bg-ember"
              >
                Load more
              </button>
            </div>
          )}
          {canLoadMoreLocal && (
            <div className="mt-10 text-center">
              <button
                onClick={() => setVisible((v) => v + PAGE_SIZE)}
                className="rounded-full border border-line bg-panel px-8 py-3 text-sm font-bold text-white transition hover:border-ember hover:bg-ember"
              >
                Load more ({filtered.length - visible} remaining)
              </button>
            </div>
          )}
        </>
      ) : (
        <div className="mt-8 space-y-3">
          {displayList.map((t) => (
            <MovieCard
              key={titleKey(t)}
              title={t}
              layout="list"
              onSelect={onSelect}
              onPlay={onPlay}
              inList={watchlist.includes(titleKey(t))}
              onToggleList={onToggleList}
            />
          ))}
          {loadingMore && (
            <div className="flex items-center justify-center gap-2 pt-2 text-sm font-semibold text-zinc-500">
              <RefreshCw size={16} className="animate-spin text-ember" /> Loading more…
            </div>
          )}
          {loadError && <p className="pt-2 text-center text-sm font-semibold text-ember">{loadError}</p>}
          {canLoadMoreRemote && !loadingMore && (
            <div className="pt-4 text-center">
              <button
                onClick={() => setPage((p) => p + 1)}
                className="rounded-full border border-line bg-panel px-8 py-3 text-sm font-bold text-white transition hover:border-ember hover:bg-ember"
              >
                Load more
              </button>
            </div>
          )}
          {canLoadMoreLocal && (
            <div className="pt-4 text-center">
              <button
                onClick={() => setVisible((v) => v + PAGE_SIZE)}
                className="rounded-full border border-line bg-panel px-8 py-3 text-sm font-bold text-white transition hover:border-ember hover:bg-ember"
              >
                Load more ({filtered.length - visible} remaining)
              </button>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
