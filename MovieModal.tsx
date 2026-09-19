import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Bookmark,
  BookmarkCheck,
  Calendar,
  Check,
  Clock,
  ExternalLink,
  Globe,
  MonitorPlay,
  Play,
  Share2,
  Star,
  Users,
  X,
} from "lucide-react";
import { asLocal, TITLES, titleKey, type Title } from "../data/movies";
import { fetchDetails, getRegion, isRemoteTitle, type TitleDetails } from "../lib/tmdb";
import { cn } from "../utils/cn";
import SafeImage from "./SafeImage";

interface Props {
  title: Title | null;
  watchlist: string[];
  onToggleList: (t: Title) => void;
  onPlay: (t: Title) => void;
  onClose: () => void;
  onSelect: (t: Title) => void;
  notify: (msg: string) => void;
}

const TABS = ["Overview", "Cast & Crew", "Details", "More Like This"] as const;

export default function MovieModal({ title: t, watchlist, onToggleList, onPlay, onClose, onSelect, notify }: Props) {
  const [tab, setTab] = useState<(typeof TABS)[number]>("Overview");
  const [details, setDetails] = useState<TitleDetails | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [showTrailer, setShowTrailer] = useState(false);

  useEffect(() => {
    setTab("Overview");
    setShowTrailer(false);
    setDetails(null);
    if (!t || !isRemoteTitle(t)) return;
    setLoadingDetails(true);
    const controller = new AbortController();
    fetchDetails(t, controller.signal)
      .then((d) => setDetails(d))
      .catch(() => {
        /* keep basic info */
      })
      .finally(() => setLoadingDetails(false));
    return () => controller.abort();
  }, [t]);

  useEffect(() => {
    if (t) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [t]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const localSimilar = useMemo(() => {
    if (!t) return [];
    return TITLES.filter(
      (x) => x.id !== t.id && !x.comingSoon && x.genres.some((g) => t.genres.includes(g))
    )
      .sort((a, b) => b.rating - a.rating)
      .slice(0, 6)
      .map(asLocal);
  }, [t]);

  if (!t) return <AnimatePresence />;

  const view: Title = details ? { ...t, ...details.patch } : t;
  const similar = details && details.similar.length > 0 ? details.similar : localSimilar;
  const providers = details?.providers;
  const trailerKey = view.trailerKey;
  const inList = watchlist.includes(titleKey(t));
  const region = getRegion();

  return (
    <AnimatePresence>
      {t && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 z-50 overflow-y-auto bg-black/80 p-3 backdrop-blur-sm sm:p-6"
        >
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 40, scale: 0.98 }}
            transition={{ type: "spring", stiffness: 300, damping: 32 }}
            onClick={(e) => e.stopPropagation()}
            className="relative mx-auto my-4 w-full max-w-4xl overflow-hidden rounded-3xl border border-line bg-coal shadow-2xl"
          >
            {/* Hero */}
            <div className="relative">
              {showTrailer && trailerKey ? (
                <div className="aspect-[16/8] w-full bg-black sm:aspect-[16/7]">
                  <iframe
                    src={`https://www.youtube.com/embed/${trailerKey}?autoplay=1&rel=0`}
                    title={`${view.title} trailer`}
                    allow="autoplay; encrypted-media; fullscreen"
                    allowFullScreen
                    className="h-full w-full"
                  />
                </div>
              ) : (
                <>
                  <SafeImage seed={`modal-${titleKey(view)}`} src={view.backdrop} alt={view.title} wrapperClassName="aspect-[16/8] w-full sm:aspect-[16/7]" />
                  <div className="absolute inset-0 bg-ink/45" />
                  <div className="absolute inset-x-0 bottom-0 h-20 bg-coal/90 blur-xl" />
                </>
              )}
              <button
                onClick={onClose}
                className="absolute top-4 right-4 flex h-10 w-10 items-center justify-center rounded-full bg-black/70 text-white backdrop-blur transition hover:bg-ember"
                aria-label="Close"
              >
                <X size={18} />
              </button>
              {!showTrailer && (
                <div className="absolute inset-x-0 bottom-0 flex items-end gap-4 p-5 sm:gap-5 sm:p-7">
                  <SafeImage
                    seed={titleKey(view)}
                    src={view.poster}
                    alt={view.title}
                    wrapperClassName="hidden w-32 shrink-0 rounded-2xl ring-2 ring-white/20 sm:block lg:w-36"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-md bg-ember px-2 py-0.5 text-[11px] font-bold text-white">{view.type === "movie" ? "MOVIE" : "SERIES"}</span>
                      <span className="rounded-md border border-zinc-500 px-2 py-0.5 text-[11px] font-bold text-zinc-200">{view.quality}</span>
                      <span className="rounded-md bg-zinc-200 px-2 py-0.5 text-[11px] font-bold text-black">{view.maturity}</span>
                      {view.isNew && <span className="rounded-md bg-gold px-2 py-0.5 text-[11px] font-bold text-black">NEW</span>}
                    </div>
                    <h2 className="mt-2 font-display text-3xl font-900 tracking-tight text-white sm:text-4xl">{view.title}</h2>
                    <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[13px] font-medium text-zinc-300">
                      {view.rating > 0 && (
                        <span className="flex items-center gap-1 font-bold text-gold">
                          <Star size={14} fill="currentColor" /> {view.rating.toFixed(1)} <span className="font-medium text-zinc-500">({view.votes})</span>
                        </span>
                      )}
                      <span className="flex items-center gap-1.5"><Calendar size={13} className="text-zinc-500" /> {view.year}</span>
                      {view.duration && <span className="flex items-center gap-1.5"><Clock size={13} className="text-zinc-500" /> {view.duration}</span>}
                      <span className="flex items-center gap-1.5"><Globe size={13} className="text-zinc-500" /> {view.language}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex flex-wrap items-center gap-2.5 px-5 pt-5 sm:px-7">
              <button
                onClick={() => onPlay(view)}
                className="flex items-center gap-2 rounded-full bg-ember px-6 py-3 font-display text-sm font-bold text-white shadow-lg shadow-ember/25 transition hover:bg-red-700 active:scale-95"
              >
                <Play size={15} fill="currentColor" /> {view.comingSoon ? "Watch Trailer" : "Watch Now"}
                {!view.comingSoon && (
                  <span className="rounded bg-white/20 px-1.5 py-0.5 text-[10px] font-900 tracking-wider">FREE</span>
                )}
              </button>
              {trailerKey && (
                <button
                  onClick={() => setShowTrailer(!showTrailer)}
                  className={cn(
                    "flex items-center gap-2 rounded-full px-5 py-3 font-display text-sm font-bold ring-1 transition active:scale-95",
                    showTrailer ? "bg-white text-black ring-white" : "bg-panel2 text-white ring-line hover:bg-line"
                  )}
                >
                  <MonitorPlay size={15} /> {showTrailer ? "Hide Trailer" : "Trailer"}
                </button>
              )}
              <button
                onClick={() => onToggleList(view)}
                className={cn(
                  "flex items-center gap-2 rounded-full px-5 py-3 font-display text-sm font-bold ring-1 transition active:scale-95",
                  inList ? "bg-gold text-black ring-gold" : "bg-panel2 text-white ring-line hover:bg-line"
                )}
              >
                {inList ? <BookmarkCheck size={15} /> : <Bookmark size={15} />}
                {inList ? "In My List" : "Add to List"}
              </button>
              <button
                onClick={() => notify("Link copied — share the hype!")}
                className="flex h-[46px] w-[46px] items-center justify-center rounded-full bg-panel2 text-zinc-300 ring-1 ring-line transition hover:text-white"
                aria-label="Share"
              >
                <Share2 size={16} />
              </button>
            </div>

            {/* Tabs */}
            <div className="no-scrollbar mt-5 flex gap-1 overflow-x-auto border-y border-line bg-panel/50 px-5 sm:px-7">
              {TABS.map((tb) => (
                <button
                  key={tb}
                  onClick={() => setTab(tb)}
                  className={cn(
                    "relative shrink-0 px-4 py-3.5 text-[13px] font-bold whitespace-nowrap transition",
                    tab === tb ? "text-white" : "text-zinc-500 hover:text-zinc-200"
                  )}
                >
                  {tb}
                  {tab === tb && (
                    <motion.span layoutId="modal-tab" className="absolute inset-x-3 bottom-0 h-0.5 rounded-full bg-ember" />
                  )}
                </button>
              ))}
            </div>

            <div className="min-h-[220px] px-5 py-5 sm:px-7 sm:py-6">
              <AnimatePresence mode="wait">
                <motion.div
                  key={tab}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.18 }}
                >
                  {tab === "Overview" && (
                    <div>
                      {view.tagline && <p className="text-sm font-medium text-gold italic">“{view.tagline}”</p>}
                      <p className="mt-2 text-[15px] leading-relaxed text-zinc-300">{view.overview}</p>
                      {view.genres.length > 0 && (
                        <div className="mt-4 flex flex-wrap gap-2">
                          {view.genres.map((g) => (
                            <span key={g} className="rounded-full bg-panel2 px-3.5 py-1.5 text-xs font-bold text-zinc-200 ring-1 ring-line">
                              {g}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Where to watch */}
                      {isRemoteTitle(t) && (
                        <div className="mt-5 rounded-2xl border border-line bg-panel p-4">
                          <p className="flex items-center gap-2 text-[11px] font-bold tracking-widest text-zinc-400 uppercase">
                            <MonitorPlay size={13} className="text-emerald-400" /> Where to watch · {region}
                          </p>
                          {loadingDetails ? (
                            <div className="mt-3 flex animate-pulse gap-2.5">
                              {[1, 2, 3, 4].map((i) => (
                                <div key={i} className="h-12 w-12 rounded-xl bg-panel2" />
                              ))}
                            </div>
                          ) : providers && (providers.stream.length > 0 || providers.rent.length > 0) ? (
                            <div className="mt-3 space-y-3">
                              {providers.stream.length > 0 && (
                                <div>
                                  <p className="text-[11px] font-bold text-emerald-400 uppercase">Stream</p>
                                  <div className="mt-1.5 flex flex-wrap gap-2">
                                    {providers.stream.map((p) => (
                                      <span key={p.id} className="flex items-center gap-2 rounded-xl bg-coal py-1 pr-3.5 pl-1 ring-1 ring-line">
                                        {p.logo ? (
                                          <img src={p.logo} alt={p.name} className="h-8 w-8 rounded-lg object-cover" loading="lazy" />
                                        ) : (
                                          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-ember text-xs font-bold text-white">
                                            {p.name.charAt(0)}
                                          </span>
                                        )}
                                        <span className="text-xs font-bold text-zinc-100">{p.name}</span>
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              )}
                              {providers.rent.length > 0 && (
                                <div>
                                  <p className="text-[11px] font-bold text-gold uppercase">Rent / Buy</p>
                                  <div className="mt-1.5 flex flex-wrap gap-2">
                                    {providers.rent.map((p) => (
                                      <span key={p.id} className="flex items-center gap-2 rounded-xl bg-coal py-1 pr-3.5 pl-1 ring-1 ring-line">
                                        {p.logo ? (
                                          <img src={p.logo} alt={p.name} className="h-8 w-8 rounded-lg object-cover" loading="lazy" />
                                        ) : (
                                          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-panel2 text-xs font-bold text-white">
                                            {p.name.charAt(0)}
                                          </span>
                                        )}
                                        <span className="text-xs font-bold text-zinc-100">{p.name}</span>
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              )}
                              {providers.link && (
                                <a
                                  href={providers.link}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="inline-flex items-center gap-1.5 text-xs font-bold text-ember hover:underline"
                                >
                                  See all watch options <ExternalLink size={12} />
                                </a>
                              )}
                            </div>
                          ) : (
                            <p className="mt-2 text-[13px] text-zinc-500">
                              Not streaming on major services in {region} right now — check back soon.
                            </p>
                          )}
                        </div>
                      )}

                      <div className="mt-5 grid gap-3 rounded-2xl bg-panel p-4 text-[13px] sm:grid-cols-3">
                        <div>
                          <p className="text-[11px] font-bold tracking-wider text-zinc-600 uppercase">Director</p>
                          <p className="mt-1 font-semibold text-white">{view.director || "—"}</p>
                        </div>
                        <div>
                          <p className="text-[11px] font-bold tracking-wider text-zinc-600 uppercase">Release</p>
                          <p className="mt-1 font-semibold text-white">{view.releaseDate || `${view.year}`}</p>
                        </div>
                        <div>
                          <p className="text-[11px] font-bold tracking-wider text-zinc-600 uppercase">
                            {view.type === "movie" ? "Runtime" : "Episodes"}
                          </p>
                          <p className="mt-1 font-semibold text-white">
                            {view.type === "movie"
                              ? view.duration || "—"
                              : view.episodes
                                ? `${view.episodes} episodes · ${view.seasons} seasons`
                                : view.duration || "—"}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {tab === "Cast & Crew" && (
                    <div>
                      <p className="flex items-center gap-2 text-[11px] font-bold tracking-widest text-zinc-500 uppercase">
                        <Users size={13} /> Top billed cast
                      </p>
                      {loadingDetails && view.cast.length === 0 ? (
                        <div className="mt-3 grid animate-pulse gap-2.5 sm:grid-cols-2">
                          {[1, 2, 3, 4].map((i) => (
                            <div key={i} className="flex items-center gap-3 rounded-2xl bg-panel p-3">
                              <div className="h-11 w-11 shrink-0 rounded-full bg-panel2" />
                              <div className="flex-1">
                                <div className="h-3.5 w-2/3 rounded bg-panel2" />
                                <div className="mt-2 h-3 w-1/2 rounded bg-panel2" />
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : view.cast.length > 0 ? (
                        <div className="mt-3 grid gap-2.5 sm:grid-cols-2">
                          {view.cast.map((c) => (
                            <div key={c.name} className="flex items-center gap-3 rounded-2xl bg-panel p-3 ring-1 ring-line/60">
                              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-ember font-display text-base font-bold text-white">
                                {c.name.charAt(0)}
                              </span>
                              <div className="min-w-0">
                                <p className="truncate text-sm font-bold text-white">{c.name}</p>
                                <p className="truncate text-xs text-zinc-500">{c.character}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="mt-3 text-sm text-zinc-500">Cast information is not available for this title.</p>
                      )}
                      {view.director && (
                        <div className="mt-3 rounded-2xl border border-line bg-panel/60 p-4 text-[13px]">
                          <p className="text-[11px] font-bold tracking-wider text-zinc-600 uppercase">Directed by</p>
                          <p className="mt-1 font-bold text-white">{view.director}</p>
                        </div>
                      )}
                    </div>
                  )}

                  {tab === "Details" && (
                    <dl className="space-y-0 overflow-hidden rounded-2xl border border-line text-[13px]">
                      {[
                        ["Title", view.title],
                        ["Type", view.type === "movie" ? "Feature film" : "TV series"],
                        ["Release date", view.releaseDate || `${view.year}`],
                        ["Genres", view.genres.join(", ") || "—"],
                        ["Maturity rating", view.maturity],
                        ["Audio & subtitles", `${view.language} · 32 subtitle languages`],
                        ["Video quality", `${view.quality} Ultra HD · HDR10 · Dolby Vision`],
                        ["Audio", "Dolby Atmos · 5.1 Surround"],
                        [
                          "Availability",
                          providers && providers.stream.length > 0
                            ? `Streaming on ${providers.stream.map((p) => p.name).join(", ")}`
                            : "Streaming · Download for offline",
                        ],
                      ].map(([k, v], i) => (
                        <div key={k} className={cn("flex gap-4 px-4 py-3", i % 2 === 0 ? "bg-panel" : "bg-coal")}>
                          <dt className="w-36 shrink-0 font-semibold text-zinc-500">{k}</dt>
                          <dd className="font-medium text-zinc-100">{v}</dd>
                        </div>
                      ))}
                    </dl>
                  )}

                  {tab === "More Like This" && (
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                      {similar.map((s) => (
                        <button
                          key={titleKey(s)}
                          onClick={() => onSelect(s)}
                          className="group overflow-hidden rounded-2xl border border-line bg-panel text-left transition hover:border-ember"
                        >
                          <SafeImage seed={titleKey(s)} src={s.backdrop} alt={s.title} wrapperClassName="aspect-video w-full" />
                          <div className="p-3">
                            <p className="truncate text-[13px] font-bold text-white group-hover:text-ember">{s.title}</p>
                            <p className="mt-1 flex items-center justify-between text-[11px] font-medium text-zinc-500">
                              <span>{s.year} · {s.type === "movie" ? "Film" : "Show"}</span>
                              {s.rating > 0 && (
                                <span className="flex items-center gap-1 font-bold text-gold">
                                  <Star size={10} fill="currentColor" /> {s.rating.toFixed(1)}
                                </span>
                              )}
                            </p>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>

            <div className="flex items-center gap-2 border-t border-line bg-panel/40 px-5 py-3.5 text-xs font-medium text-zinc-500 sm:px-7">
              <Check size={14} className="text-emerald-400" />
              Available in {view.quality} · Downloads enabled · Up to 4 screens
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
