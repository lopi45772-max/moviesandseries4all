import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Captions,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clapperboard,
  ListVideo,
  Loader2,
  Maximize,
  Minimize,
  MonitorPlay,
  Pause,
  Play,
  RotateCcw,
  RotateCw,
  Server,
  Settings,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  X,
  Zap,
} from "lucide-react";
import type { Title } from "../data/movies";
import {
  STREAM_SERVERS,
  buildStreamUrl,
  fetchSeasonEpisodes,
  fetchTrailerKey,
  fetchTvSeasons,
  img,
  isRemoteTitle,
  resolveStreamId,
  saveProgress,
  type TvEpisodeInfo,
  type TvSeasonInfo,
} from "../lib/tmdb";
import { cn } from "../utils/cn";
import SafeImage from "./SafeImage";

interface Props {
  title: Title | null;
  onClose: () => void;
}

const QUALITIES = ["Auto 4K", "1080p", "720p", "480p"] as const;
type Mode = "watch" | "trailer" | "preview";

function fmt(sec: number) {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = Math.floor(sec % 60);
  return h > 0
    ? `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`
    : `${m}:${String(s).padStart(2, "0")}`;
}

export default function CinemaPlayer({ title: t, onClose }: Props) {
  /* Preview-mode state */
  const [playing, setPlaying] = useState(true);
  const [elapsed, setElapsed] = useState(0);
  const [muted, setMuted] = useState(false);
  const [volume, setVolume] = useState(70);
  const [showControls, setShowControls] = useState(true);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [quality, setQuality] = useState<(typeof QUALITIES)[number]>("Auto 4K");
  const [captions, setCaptions] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  /* Watch-mode state */
  const [mode, setMode] = useState<Mode>("watch");
  const [streamId, setStreamId] = useState<number | null>(null);
  const [resolving, setResolving] = useState(false);
  const [resolveFailed, setResolveFailed] = useState(false);
  const [serverIdx, setServerIdx] = useState(0);
  const [frameLoading, setFrameLoading] = useState(true);
  const [frameKey, setFrameKey] = useState(0);
  const [trailerKey, setTrailerKey] = useState<string | null>(null);
  /* Series state */
  const [seasons, setSeasons] = useState<TvSeasonInfo[]>([]);
  const [season, setSeason] = useState(1);
  const [episodes, setEpisodes] = useState<TvEpisodeInfo[]>([]);
  const [episode, setEpisode] = useState(1);
  const [loadingEps, setLoadingEps] = useState(false);
  const [epsOpen, setEpsOpen] = useState(false);
  const [seasonOpen, setSeasonOpen] = useState(false);

  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const boxRef = useRef<HTMLDivElement>(null);
  const elapsedRef = useRef(0);

  const total = t ? (t.runtimeMins > 0 ? t.runtimeMins * 60 : 45 * 60) : 1;
  const isSeries = t?.type === "series";
  const server = STREAM_SERVERS[serverIdx];
  const isWatch = mode === "watch" && streamId !== null;
  const isTrailer = mode === "trailer" && !!trailerKey;
  const currentEp = episodes.find((e) => e.episode_number === episode);

  useEffect(() => {
    elapsedRef.current = elapsed;
  }, [elapsed]);

  /* Reset on title change */
  useEffect(() => {
    if (t) {
      const startPct = t.progress ?? 0;
      setElapsed(Math.floor(total * (startPct / 100)));
      setPlaying(true);
      setMode("watch");
      setStreamId(null);
      setResolving(true);
      setResolveFailed(false);
      setServerIdx(0);
      setFrameLoading(true);
      setFrameKey(0);
      setTrailerKey(t.trailerKey ?? null);
      setSeasons([]);
      setEpisodes([]);
      setSeason(1);
      setEpisode(1);
      setEpsOpen(false);
      setSeasonOpen(false);
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [t]);

  /* Resolve the free-stream TMDB id */
  useEffect(() => {
    if (!t) return;
    const controller = new AbortController();
    setResolving(true);
    resolveStreamId(t, controller.signal)
      .then((id) => {
        setStreamId(id);
        setResolveFailed(id === null);
        if (id === null) setMode((m) => (m === "watch" ? "trailer" : m));
      })
      .catch(() => {
        setResolveFailed(true);
      })
      .finally(() => setResolving(false));
    return () => controller.abort();
  }, [t]);

  /* Trailer fallback */
  useEffect(() => {
    if (!t || t.trailerKey) return;
    if (!isRemoteTitle(t) && streamId === null) return;
    const controller = new AbortController();
    const lookup: Title = isRemoteTitle(t) ? t : { ...t, id: streamId ?? t.id };
    fetchTrailerKey(lookup, controller.signal)
      .then((k) => {
        if (k) setTrailerKey(k);
      })
      .catch(() => {});
    return () => controller.abort();
  }, [t, streamId]);

  /* If watch fails but trailer exists, offer trailer; if neither, preview */
  useEffect(() => {
    if (resolveFailed && !trailerKey) setMode("preview");
    else if (resolveFailed && trailerKey && mode === "watch") setMode("trailer");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resolveFailed, trailerKey]);

  /* Series: load seasons once we know the stream id */
  useEffect(() => {
    if (!t || !isSeries || streamId === null) return;
    const controller = new AbortController();
    fetchTvSeasons(streamId, controller.signal)
      .then((list) => {
        setSeasons(list);
        const first = list.find((s) => s.season_number >= 1) ?? list[0];
        if (first && first.season_number !== season) setSeason(first.season_number);
      })
      .catch(() => {});
    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [t, streamId, isSeries]);

  /* Series: load episodes per season */
  useEffect(() => {
    if (!t || !isSeries || streamId === null) return;
    const controller = new AbortController();
    setLoadingEps(true);
    fetchSeasonEpisodes(streamId, season, controller.signal)
      .then((eps) => {
        setEpisodes(eps);
        if (!eps.some((e) => e.episode_number === episode)) setEpisode(eps[0]?.episode_number ?? 1);
      })
      .catch(() => setEpisodes([]))
      .finally(() => setLoadingEps(false));
    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [streamId, season]);

  /* Reset iframe loader whenever the stream changes */
  useEffect(() => {
    setFrameLoading(true);
  }, [frameKey, serverIdx, season, episode, streamId]);

  /* Preview-mode ticker */
  useEffect(() => {
    if (!t || !playing || mode !== "preview") return;
    const id = setInterval(() => setElapsed((e) => (e + 1 >= total ? 0 : e + 1)), 1000);
    return () => clearInterval(id);
  }, [t, playing, total, mode]);

  /* Autosave progress */
  useEffect(() => {
    if (!t || mode !== "preview") return;
    const id = setInterval(() => {
      if (elapsedRef.current > 0) saveProgress(t, (elapsedRef.current / total) * 100);
    }, 15000);
    return () => clearInterval(id);
  }, [t, total, mode]);

  const close = useCallback(() => {
    if (t && mode === "preview" && elapsedRef.current > 0) {
      saveProgress(t, (elapsedRef.current / total) * 100);
    }
    onClose();
  }, [t, total, mode, onClose]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (epsOpen) setEpsOpen(false);
        else close();
      }
    };
    if (t) window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [t, close, epsOpen]);

  const poke = useCallback(() => {
    setShowControls(true);
    if (hideTimer.current) clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => setShowControls(false), 3400);
  }, []);

  useEffect(() => {
    if (t) poke();
  }, [t, poke]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      boxRef.current?.requestFullscreen?.();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen?.();
      setIsFullscreen(false);
    }
  };

  const pickEpisode = (epNum: number) => {
    setEpisode(epNum);
    setFrameKey((k) => k + 1);
  };
  const stepEpisode = (dir: 1 | -1) => {
    const sorted = [...episodes].sort((a, b) => a.episode_number - b.episode_number);
    const idx = sorted.findIndex((e) => e.episode_number === episode);
    const next = sorted[idx + dir];
    if (next) pickEpisode(next.episode_number);
  };

  const pct = Math.min(100, (elapsed / total) * 100);
  const meta = t
    ? t.type === "movie"
      ? [`${t.year}`, t.duration || null].filter(Boolean).join(" · ")
      : [
          seasons.length > 0 ? `${seasons.filter((s) => s.season_number >= 1).length || t.seasons} Seasons` : t.duration || null,
          isWatch ? `S${season} E${episode}` : null,
          currentEp && isWatch ? `“${currentEp.name}”` : null,
        ]
          .filter(Boolean)
          .join(" · ")
    : "";
  const resumeSecs =
    t && t.type === "movie" && (t.progress ?? 0) >= 2
      ? Math.floor(total * ((t.progress ?? 0) / 100))
      : 0;
  const streamUrl =
    isWatch && server && streamId !== null
      ? buildStreamUrl(server, t!.type, streamId, season, episode, resumeSecs)
      : null;

  return (
    <AnimatePresence>
      {t && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[60] bg-black"
          onMouseMove={poke}
          onClick={poke}
        >
          <div ref={boxRef} className="relative h-full w-full overflow-hidden">
            {/* ===== Watch (free stream) ===== */}
            {isWatch && streamUrl && (
              <>
                {frameLoading && (
                  <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-black">
                    <SafeImage
                      seed={`player-${t.key ?? t.id}`}
                      src={t.backdrop}
                      alt=""
                      wrapperClassName="absolute inset-0 opacity-30"
                    />
                    <Loader2 size={34} className="relative animate-spin text-ember" />
                    <p className="relative text-sm font-bold text-white">
                      Loading {server.name}…
                    </p>
                    <p className="relative text-xs text-zinc-500">
                      Free HD stream · If it stalls, switch server below
                    </p>
                  </div>
                )}
                <iframe
                  key={`${frameKey}-${server.id}-${season}-${episode}`}
                  src={streamUrl}
                  title={`${t.title} — free stream`}
                  allow="autoplay; encrypted-media; fullscreen; picture-in-picture"
                  allowFullScreen
                  onLoad={() => setFrameLoading(false)}
                  className="absolute inset-0 h-full w-full"
                />
              </>
            )}

            {/* ===== Resolving ===== */}
            {mode === "watch" && (resolving || streamId === null) && !resolveFailed && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black">
                <SafeImage
                  seed={`player-${t.key ?? t.id}`}
                  src={t.backdrop}
                  alt=""
                  wrapperClassName="absolute inset-0 opacity-25"
                />
                <Loader2 size={34} className="relative animate-spin text-ember" />
                <p className="relative text-sm font-bold text-white">Finding your free stream…</p>
                <p className="relative text-xs text-zinc-500">Connecting to free sources</p>
              </div>
            )}

            {/* ===== Trailer ===== */}
            {isTrailer && (
              <iframe
                key={trailerKey}
                src={`https://www.youtube.com/embed/${trailerKey}?autoplay=1&rel=0`}
                title={`${t.title} — official trailer`}
                allow="autoplay; encrypted-media; fullscreen"
                allowFullScreen
                className="absolute inset-0 h-full w-full"
              />
            )}

            {/* ===== Preview ===== */}
            {mode === "preview" && (
              <>
                <SafeImage
                  seed={`player-${t.key ?? t.id}`}
                  src={t.backdrop}
                  alt={t.title}
                  wrapperClassName="h-full w-full"
                  className={cn("transition-transform duration-[2000ms]", playing ? "scale-105" : "scale-100")}
                />
                <div className="absolute inset-0 bg-black/45" />
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setPlaying(!playing);
                  }}
                  aria-label={playing ? "Pause" : "Play"}
                  className={cn(
                    "absolute inset-0 m-auto flex h-20 w-20 items-center justify-center rounded-full bg-ember text-white shadow-2xl transition-all",
                    showControls ? "scale-100 opacity-100" : "scale-90 opacity-0"
                  )}
                >
                  {playing ? <Pause size={30} fill="currentColor" /> : <Play size={30} fill="currentColor" className="ml-1" />}
                </button>
                {captions && playing && (
                  <p className="absolute inset-x-0 bottom-36 mx-auto w-fit max-w-[80%] rounded-lg bg-black/75 px-5 py-2 text-center text-base font-semibold text-white sm:text-lg">
                    {elapsed % 24 < 12 ? "— You have no idea what is coming. —" : "— Then show me. I am ready. —"}
                  </p>
                )}
              </>
            )}

            {/* ===== Top bar ===== */}
            <div
              className={cn(
                "absolute inset-x-0 top-0 z-20 bg-black/70 backdrop-blur transition-all",
                showControls ? "translate-y-0 opacity-100" : "-translate-y-full opacity-0"
              )}
            >
              <div className="flex items-center gap-3 px-4 py-3 sm:gap-4 sm:px-6">
                <button onClick={close} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-ember" aria-label="Back">
                  <ChevronLeft size={20} />
                </button>
                <div className="min-w-0">
                  <p className="truncate font-display text-base font-bold text-white sm:text-lg">{t.title}</p>
                  <p className="truncate text-xs font-medium text-zinc-400">
                    {meta}
                    {meta ? " · " : ""}
                    {isWatch ? (
                      <span className="font-bold text-emerald-400">Watching FREE on {server.name}</span>
                    ) : isTrailer ? (
                      "Official trailer"
                    ) : (
                      "Preview screening"
                    )}
                  </p>
                </div>
                {/* Mode tabs */}
                <div className="ml-auto flex shrink-0 items-center rounded-full bg-white/10 p-1">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setMode("watch");
                    }}
                    className={cn(
                      "flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold transition sm:px-3.5",
                      mode === "watch" ? "bg-ember text-white" : "text-zinc-300 hover:text-white"
                    )}
                  >
                    <Zap size={13} /> <span className="hidden sm:inline">Watch FREE</span><span className="sm:hidden">Free</span>
                  </button>
                  {trailerKey && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setMode("trailer");
                      }}
                      className={cn(
                        "flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold transition sm:px-3.5",
                        mode === "trailer" ? "bg-ember text-white" : "text-zinc-300 hover:text-white"
                      )}
                    >
                      <MonitorPlay size={13} /> Trailer
                    </button>
                  )}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setMode("preview");
                    }}
                    className={cn(
                      "hidden items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-bold transition sm:flex",
                      mode === "preview" ? "bg-white text-black" : "text-zinc-300 hover:text-white"
                    )}
                  >
                    <Clapperboard size={13} /> Preview
                  </button>
                </div>
              </div>

              {/* ===== Watch toolbar: servers + episodes ===== */}
              {isWatch && (
                <div
                  className="flex flex-wrap items-center gap-2 border-t border-white/10 px-4 py-2.5 sm:px-6"
                  onClick={(e) => e.stopPropagation()}
                >
                  <span className="flex items-center gap-1.5 text-[11px] font-900 tracking-widest text-zinc-500 uppercase">
                    <Server size={12} /> Source
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {STREAM_SERVERS.map((s, i) => (
                      <button
                        key={s.id}
                        onClick={() => {
                          setServerIdx(i);
                          setFrameKey((k) => k + 1);
                        }}
                        title={s.hint}
                        className={cn(
                          "rounded-full px-3.5 py-1.5 text-xs font-bold ring-1 transition active:scale-95",
                          i === serverIdx
                            ? "bg-emerald-500 text-black ring-emerald-500"
                            : "bg-white/10 text-zinc-200 ring-white/15 hover:bg-white/20"
                        )}
                      >
                        {s.name}
                      </button>
                    ))}
                  </div>
                  {isSeries && (
                    <div className="ml-auto flex items-center gap-1.5">
                      <button
                        onClick={() => stepEpisode(-1)}
                        disabled={!episodes.some((e) => e.episode_number < episode)}
                        className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20 disabled:opacity-30"
                        aria-label="Previous episode"
                      >
                        <SkipBack size={14} />
                      </button>
                      <button
                        onClick={() => setEpsOpen(true)}
                        className="flex items-center gap-2 rounded-full bg-white px-4 py-1.5 text-xs font-bold text-black transition hover:bg-zinc-200"
                      >
                        <ListVideo size={14} /> S{season} E{episode}
                        {loadingEps && <Loader2 size={12} className="animate-spin" />}
                      </button>
                      <button
                        onClick={() => stepEpisode(1)}
                        disabled={!episodes.some((e) => e.episode_number > episode)}
                        className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20 disabled:opacity-30"
                        aria-label="Next episode"
                      >
                        <SkipForward size={14} />
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* ===== Episodes drawer ===== */}
            <AnimatePresence>
              {epsOpen && isSeries && (
                <>
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={() => setEpsOpen(false)}
                    className="absolute inset-0 z-30 bg-black/60"
                  />
                  <motion.aside
                    initial={{ x: "100%" }}
                    animate={{ x: 0 }}
                    exit={{ x: "100%" }}
                    transition={{ type: "spring", stiffness: 320, damping: 34 }}
                    className="absolute top-0 right-0 z-30 flex h-full w-full max-w-sm flex-col border-l border-line bg-coal"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="flex items-center justify-between border-b border-line px-5 py-4">
                      <div>
                        <p className="font-display text-base font-bold text-white">Episodes</p>
                        <p className="text-xs text-zinc-500">{t.title}</p>
                      </div>
                      <button
                        onClick={() => setEpsOpen(false)}
                        className="flex h-9 w-9 items-center justify-center rounded-full bg-panel2 text-zinc-300 transition hover:text-white"
                        aria-label="Close episodes"
                      >
                        <X size={17} />
                      </button>
                    </div>
                    {/* Season selector */}
                    <div className="border-b border-line px-5 py-3">
                      <div className="relative">
                        <button
                          onClick={() => setSeasonOpen(!seasonOpen)}
                          className="flex w-full items-center justify-between rounded-xl border border-line bg-panel px-4 py-2.5 text-sm font-bold text-white transition hover:border-zinc-500"
                        >
                          <span>Season {season}</span>
                          <ChevronDown size={16} className={cn("text-zinc-500 transition-transform", seasonOpen && "rotate-180")} />
                        </button>
                        {seasonOpen && (
                          <div className="absolute inset-x-0 top-full z-10 mt-2 max-h-56 overflow-y-auto rounded-xl border border-line bg-panel p-1.5 shadow-2xl">
                            {(seasons.length > 0
                              ? seasons
                              : Array.from({ length: t.seasons ?? 1 }, (_, i) => ({
                                  season_number: i + 1,
                                  episode_count: 0,
                                  name: `Season ${i + 1}`,
                                  poster_path: null,
                                  air_date: "",
                                }))
                            ).map((s) => (
                              <button
                                key={s.season_number}
                                onClick={() => {
                                  setSeason(s.season_number);
                                  setEpisode(1);
                                  setFrameKey((k) => k + 1);
                                  setSeasonOpen(false);
                                }}
                                className={cn(
                                  "flex w-full items-center justify-between rounded-lg px-3.5 py-2.5 text-[13px] font-bold transition",
                                  s.season_number === season ? "bg-ember/15 text-white" : "text-zinc-400 hover:bg-panel2 hover:text-white"
                                )}
                              >
                                {s.name || `Season ${s.season_number}`}
                                {s.episode_count > 0 && (
                                  <span className="text-[11px] font-semibold text-zinc-500">{s.episode_count} eps</span>
                                )}
                                {s.season_number === season && <Check size={14} className="text-ember" />}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                    {/* Episode list */}
                    <div className="flex-1 overflow-y-auto p-3">
                      {loadingEps ? (
                        <div className="flex flex-col items-center gap-2 py-12">
                          <Loader2 size={26} className="animate-spin text-ember" />
                          <p className="text-xs font-semibold text-zinc-500">Loading episodes…</p>
                        </div>
                      ) : episodes.length === 0 ? (
                        <div className="px-2 py-12 text-center">
                          <p className="text-sm font-bold text-white">Episode list unavailable</p>
                          <p className="mt-1 text-xs text-zinc-500">Use the S/E stepper in the toolbar instead.</p>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {episodes.map((ep) => {
                            const active = ep.episode_number === episode;
                            return (
                              <button
                                key={ep.episode_number}
                                onClick={() => {
                                  pickEpisode(ep.episode_number);
                                  setEpsOpen(false);
                                }}
                                className={cn(
                                  "flex w-full items-center gap-3 rounded-2xl border p-2.5 text-left transition",
                                  active ? "border-ember bg-ember/10" : "border-line bg-panel hover:border-zinc-500"
                                )}
                              >
                                <span className="relative h-16 w-28 shrink-0 overflow-hidden rounded-xl bg-panel2">
                                  {ep.still_path ? (
                                    <img src={img(ep.still_path, "w300")} alt={ep.name} loading="lazy" className="h-full w-full object-cover" />
                                  ) : (
                                    <span className="flex h-full w-full items-center justify-center font-display text-lg font-bold text-zinc-600">
                                      {ep.episode_number}
                                    </span>
                                  )}
                                  {active && (
                                    <span className="absolute inset-0 flex items-center justify-center bg-black/50">
                                      <Play size={18} className="text-white" fill="currentColor" />
                                    </span>
                                  )}
                                </span>
                                <span className="min-w-0 flex-1">
                                  <span className="flex items-center gap-2">
                                    <span className={cn("rounded-md px-1.5 py-0.5 text-[10px] font-900", active ? "bg-ember text-white" : "bg-panel2 text-zinc-400")}>
                                      E{ep.episode_number}
                                    </span>
                                    {ep.runtime ? <span className="text-[11px] font-semibold text-zinc-500">{ep.runtime}m</span> : null}
                                  </span>
                                  <span className="mt-1 block truncate text-[13px] font-bold text-white">{ep.name}</span>
                                  <span className="mt-0.5 line-clamp-2 block text-[11px] leading-snug text-zinc-500">{ep.overview || "No synopsis available."}</span>
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </motion.aside>
                </>
              )}
            </AnimatePresence>

            {/* ===== Trailer / resolve-failed note ===== */}
            {(isTrailer || (mode === "watch" && resolveFailed)) && (
              <div
                className={cn(
                  "absolute inset-x-0 bottom-0 z-20 flex items-center justify-center gap-2 bg-black/70 px-4 py-3 text-center backdrop-blur transition-all",
                  showControls ? "translate-y-0 opacity-100" : "translate-y-full opacity-0"
                )}
              >
                <p className="text-xs font-medium text-zinc-400 sm:text-[13px]">
                  {mode === "watch" && resolveFailed
                    ? "Free stream unavailable for this title right now — enjoy the trailer or preview."
                    : `Official trailer via TMDB · Switch to “Watch FREE” for the full ${t.type === "movie" ? "film" : "series"}.`}
                </p>
              </div>
            )}

            {/* ===== Bottom controls (preview mode) ===== */}
            {mode === "preview" && (
              <div
                className={cn(
                  "absolute inset-x-0 bottom-0 z-20 bg-black/80 px-4 pt-3 pb-4 backdrop-blur transition-all sm:px-6",
                  showControls ? "translate-y-0 opacity-100" : "translate-y-full opacity-0"
                )}
                onClick={(e) => e.stopPropagation()}
              >
                <div
                  className="group/bar relative h-6 cursor-pointer"
                  onClick={(e) => {
                    const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
                    const ratio = (e.clientX - rect.left) / rect.width;
                    setElapsed(Math.floor(ratio * total));
                  }}
                >
                  <div className="absolute inset-x-0 top-1/2 h-1 -translate-y-1/2 rounded-full bg-white/20 transition-all group-hover/bar:h-1.5">
                    <div className="relative h-full rounded-full bg-ember" style={{ width: `${pct}%` }}>
                      <span className="absolute top-1/2 -right-2 h-4 w-4 -translate-y-1/2 rounded-full bg-ember opacity-0 ring-4 ring-white/80 transition group-hover/bar:opacity-100" />
                    </div>
                  </div>
                </div>

                <div className="mt-1 flex items-center gap-1.5 sm:gap-3">
                  <button onClick={() => setElapsed((e) => Math.max(0, e - 10))} className="flex h-10 w-10 items-center justify-center rounded-full text-zinc-200 transition hover:bg-white/10 hover:text-white" aria-label="Back 10s">
                    <RotateCcw size={19} />
                  </button>
                  <button
                    onClick={() => setPlaying(!playing)}
                    className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-black transition hover:scale-105"
                    aria-label={playing ? "Pause" : "Play"}
                  >
                    {playing ? <Pause size={19} fill="currentColor" /> : <Play size={19} fill="currentColor" className="ml-0.5" />}
                  </button>
                  <button onClick={() => setElapsed((e) => Math.min(total, e + 10))} className="flex h-10 w-10 items-center justify-center rounded-full text-zinc-200 transition hover:bg-white/10 hover:text-white" aria-label="Forward 10s">
                    <RotateCw size={19} />
                  </button>

                  <div className="ml-1 hidden items-center gap-2 sm:flex">
                    <button onClick={() => setMuted(!muted)} className="flex h-10 w-10 items-center justify-center rounded-full text-zinc-200 transition hover:bg-white/10 hover:text-white" aria-label="Mute">
                      {muted || volume === 0 ? <VolumeX size={19} /> : <Volume2 size={19} />}
                    </button>
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={muted ? 0 : volume}
                      onChange={(e) => {
                        setVolume(Number(e.target.value));
                        setMuted(false);
                      }}
                      className="h-1 w-20 cursor-pointer"
                    />
                  </div>

                  <span className="ml-2 text-[13px] font-semibold text-zinc-300 tabular-nums">
                    {fmt(elapsed)} <span className="text-zinc-600">/</span> {fmt(total)}
                  </span>

                  <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
                    {streamId !== null && (
                      <button
                        onClick={() => setMode("watch")}
                        className="mr-1 hidden items-center gap-1.5 rounded-full bg-ember px-4 py-2 text-xs font-bold text-white transition hover:bg-red-700 sm:flex"
                      >
                        <Zap size={13} /> Watch FREE
                      </button>
                    )}
                    <button
                      onClick={() => setCaptions(!captions)}
                      className={cn("flex h-10 w-10 items-center justify-center rounded-full transition", captions ? "bg-white text-black" : "text-zinc-300 hover:bg-white/10")}
                      aria-label="Captions"
                    >
                      <Captions size={19} />
                    </button>
                    <div className="relative">
                      <button
                        onClick={() => setSettingsOpen(!settingsOpen)}
                        className={cn("flex h-10 w-10 items-center justify-center rounded-full transition", settingsOpen ? "bg-white text-black" : "text-zinc-300 hover:bg-white/10")}
                        aria-label="Settings"
                      >
                        <Settings size={19} />
                      </button>
                      {settingsOpen && (
                        <div className="absolute right-0 bottom-12 w-48 overflow-hidden rounded-2xl border border-line bg-panel p-1.5 shadow-2xl">
                          <p className="px-3 pt-2 pb-1 text-[11px] font-bold tracking-widest text-zinc-500 uppercase">Quality</p>
                          {QUALITIES.map((q) => (
                            <button
                              key={q}
                              onClick={() => {
                                setQuality(q);
                                setSettingsOpen(false);
                              }}
                              className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-[13px] font-semibold text-zinc-300 transition hover:bg-panel2 hover:text-white"
                            >
                              {q}
                              {quality === q && <Check size={14} className="text-ember" />}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                    <button onClick={toggleFullscreen} className="flex h-10 w-10 items-center justify-center rounded-full text-zinc-200 transition hover:bg-white/10 hover:text-white" aria-label="Fullscreen">
                      {isFullscreen ? <Minimize size={19} /> : <Maximize size={19} />}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Series floating nav (when toolbar hidden) */}
            {isWatch && isSeries && !showControls && episodes.length > 1 && (
              <>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    stepEpisode(-1);
                    poke();
                  }}
                  aria-label="Previous episode"
                  className="absolute top-1/2 left-3 z-20 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-black/60 text-white opacity-0 backdrop-blur transition hover:bg-ember hover:opacity-100"
                >
                  <ChevronLeft size={20} />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    stepEpisode(1);
                    poke();
                  }}
                  aria-label="Next episode"
                  className="absolute top-1/2 right-3 z-20 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-black/60 text-white opacity-0 backdrop-blur transition hover:bg-ember hover:opacity-100"
                >
                  <ChevronRight size={20} />
                </button>
              </>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
