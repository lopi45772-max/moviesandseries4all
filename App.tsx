import { useCallback, useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowUp, Bookmark, CheckCircle2, Clapperboard, Compass, KeyRound, Tv, X } from "lucide-react";
import Navbar, { type View } from "./components/Navbar";
import Hero from "./components/Hero";
import Top10Row from "./components/Top10Row";
import Explorer from "./components/Explorer";
import MovieCard from "./components/MovieCard";
import MovieModal from "./components/MovieModal";
import CinemaPlayer from "./components/CinemaPlayer";
import Footer from "./components/Footer";
import { BlockSkeleton, HeroSkeleton, RailSkeleton } from "./components/Skeletons";
import { ComingSoon, ContinueWatching, Spotlight, StudiosMarquee } from "./components/Sections";
import { Faq, Pricing } from "./components/Premium";
import SafeImage from "./components/SafeImage";
import {
  FALLBACK_FEATURED,
  FALLBACK_SPOTLIGHT,
  FALLBACK_TITLES,
  FALLBACK_TRENDING,
  titleKey,
  type Title,
} from "./data/movies";
import {
  TmdbError,
  fetchDetails,
  fetchTopRated,
  fetchTrending,
  fetchUpcoming,
  getApiKey,
  getStreamKey,
  persistTitle,
  readPersisted,
  readProgress,
  removePersisted,
  resetApiKey,
  resetStreamKey,
  setApiKey,
  setStreamKey,
} from "./lib/tmdb";
import { cn } from "./utils/cn";

interface Toast {
  id: number;
  message: string;
}

let toastId = 0;

const STATS = [
  { value: "1M+", label: "Movies & series" },
  { value: "190", label: "Countries streaming" },
  { value: "98M", label: "Happy members" },
  { value: "4K", label: "Ultra HD + HDR" },
];

function StatsBand() {
  return (
    <section className="border-y border-line bg-coal">
      <div className="mx-auto grid max-w-7xl grid-cols-2 divide-x divide-line px-4 sm:px-6 lg:grid-cols-4">
        {STATS.map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.07 }}
            className="flex items-center justify-center gap-3 py-6"
          >
            <span className="font-display text-3xl font-900 text-white sm:text-4xl">{s.value}</span>
            <span className="max-w-[80px] text-[11px] leading-tight font-bold tracking-wider text-zinc-500 uppercase">
              {s.label}
            </span>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

function PageHeader({
  kicker,
  title,
  description,
  backdrop,
  icon,
  chips,
}: {
  kicker: string;
  title: string;
  description: string;
  backdrop: string;
  icon: React.ReactNode;
  chips: string[];
}) {
  return (
    <div className="relative overflow-hidden pt-28 pb-10 sm:pt-36 sm:pb-14">
      <SafeImage seed={title} src={backdrop} alt="" wrapperClassName="absolute inset-0" className="opacity-40" />
      <div className="absolute inset-0 bg-ink/70" />
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <p className="flex items-center gap-2 text-[11px] font-bold tracking-[0.2em] text-ember uppercase">
            {icon} {kicker}
          </p>
          <h1 className="mt-2 font-display text-4xl font-900 tracking-tight text-white sm:text-6xl">{title}</h1>
          <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-zinc-400">{description}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            {chips.map((c) => (
              <span key={c} className="rounded-full bg-white/10 px-3.5 py-1.5 text-xs font-bold text-zinc-200 ring-1 ring-white/15 backdrop-blur">
                {c}
              </span>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}

export default function App() {
  const [view, setView] = useState<View>("home");
  const [selected, setSelected] = useState<Title | null>(null);
  const [playing, setPlaying] = useState<Title | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [showTop, setShowTop] = useState(false);

  /* Live TMDB state */
  const [trending, setTrending] = useState<Title[]>([]);
  const [upcoming, setUpcoming] = useState<Title[]>([]);
  const [spotlightTitle, setSpotlightTitle] = useState<Title | null>(null);
  const [homeLoading, setHomeLoading] = useState(true);
  const [apiLive, setApiLive] = useState(false);
  const [apiVersion, setApiVersion] = useState(0);
  const [keyPanelOpen, setKeyPanelOpen] = useState(false);
  const [keyInput, setKeyInput] = useState("");
  const [streamInput, setStreamInput] = useState("");
  const [streamVersion, setStreamVersion] = useState(0);
  const [progressTick, setProgressTick] = useState(0);

  const [watchlist, setWatchlist] = useState<string[]>(() => {
    try {
      const raw = JSON.parse(localStorage.getItem("cinenova-watchlist") || "[]");
      return Array.isArray(raw) ? raw.filter((x): x is string => typeof x === "string") : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem("cinenova-watchlist", JSON.stringify(watchlist));
  }, [watchlist]);

  useEffect(() => {
    const onScroll = () => setShowTop(window.scrollY > 900);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const notify = useCallback((message: string) => {
    const id = ++toastId;
    setToasts((t) => [...t.slice(-2), { id, message }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 2800);
  }, []);

  /* Fetch the live catalog */
  useEffect(() => {
    let cancelled = false;
    setHomeLoading(true);
    (async () => {
      const [tr, up, top] = await Promise.all([
        fetchTrending("all").catch((): Title[] => []),
        fetchUpcoming().catch((): Title[] => []),
        fetchTopRated().catch((): Title[] => []),
      ]);
      if (cancelled) return;
      setTrending(tr);
      setUpcoming(up);
      setSpotlightTitle(top[0] ?? tr[0] ?? null);
      const live = tr.length > 0 || up.length > 0 || top.length > 0;
      setApiLive(live);
      setHomeLoading(false);
      if (!live) {
        try {
          await fetchTrending("movie");
        } catch (e) {
          if (e instanceof TmdbError && e.status === 401) {
            setKeyPanelOpen(true);
            notify("TMDB API key rejected — please check your key");
          }
        }
      }
      /* Enrich the spotlight with cast, tagline & trailer */
      const pick = top[0] ?? tr[0];
      if (pick) {
        fetchDetails(pick)
          .then((d) => {
            if (!cancelled) setSpotlightTitle({ ...pick, ...d.patch });
          })
          .catch(() => {
            /* keep basic */
          });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [apiVersion, notify]);

  const navigate = useCallback((v: View, anchor?: string) => {
    setView(v);
    requestAnimationFrame(() => {
      if (anchor) {
        setTimeout(() => document.getElementById(anchor)?.scrollIntoView({ behavior: "smooth" }), 80);
      } else {
        window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
      }
    });
  }, []);

  const toggleList = useCallback(
    (t: Title) => {
      const k = titleKey(t);
      setWatchlist((w) => {
        const has = w.includes(k);
        notify(has ? `Removed “${t.title}” from My List` : `Added “${t.title}” to My List`);
        if (!has) persistTitle(t);
        else removePersisted(k);
        return has ? w.filter((x) => x !== k) : [...w, k];
      });
    },
    [notify]
  );

  const play = useCallback((t: Title) => {
    setSelected(null);
    setPlaying(t);
  }, []);

  const featured = useMemo(
    () => (apiLive && trending.length > 0 ? trending.slice(0, 5) : FALLBACK_FEATURED),
    [apiLive, trending]
  );
  const trendingRow = useMemo(
    () => (apiLive && trending.length > 0 ? trending.slice(0, 10) : FALLBACK_TRENDING),
    [apiLive, trending]
  );
  const spotlight = spotlightTitle ?? FALLBACK_SPOTLIGHT;
  const comingSoon = useMemo(
    () =>
      apiLive && upcoming.length > 0
        ? upcoming
        : FALLBACK_TITLES.filter((t) => t.comingSoon),
    [apiLive, upcoming]
  );
  const continueList = useMemo(() => readProgress(), [progressTick, view]);
  const watchlistTitles = useMemo(() => {
    const saved = readPersisted();
    return watchlist.map((k) => saved[k]).filter((x): x is Title => Boolean(x));
  }, [watchlist]);
  const recommendations = useMemo(() => {
    const pool = trending.length > 0 ? trending : FALLBACK_TITLES.filter((t) => !t.comingSoon);
    return pool.filter((t) => !watchlist.includes(titleKey(t))).slice(0, 6);
  }, [trending, watchlist]);

  const moviesBackdrop =
    trending.find((t) => t.type === "movie")?.backdrop ?? FALLBACK_TITLES[0].backdrop;
  const seriesBackdrop =
    trending.find((t) => t.type === "series")?.backdrop ?? FALLBACK_TITLES[2].backdrop;
  const listBackdrop = watchlistTitles[0]?.backdrop ?? FALLBACK_TITLES[4].backdrop;

  const maskedKey = useMemo(() => {
    const k = getApiKey();
    return k.length > 8 ? `${k.slice(0, 4)}…${k.slice(-4)}` : "not set";
  }, [keyPanelOpen, apiVersion]);

  const maskedStreamKey = useMemo(() => {
    const k = getStreamKey();
    return k.length > 8 ? `${k.slice(0, 5)}…${k.slice(-4)}` : "not set";
  }, [keyPanelOpen, streamVersion]);

  const saveKey = () => {
    if (keyInput.trim().length < 10) {
      notify("That doesn't look like a valid TMDB key");
      return;
    }
    setApiKey(keyInput.trim());
    setKeyInput("");
    setKeyPanelOpen(false);
    setApiVersion((v) => v + 1);
    notify("API key updated — reloading live catalog");
  };

  const saveStreamKey = () => {
    if (streamInput.trim().length < 10) {
      notify("That doesn't look like a valid NexStream key");
      return;
    }
    setStreamKey(streamInput.trim());
    setStreamInput("");
    setStreamVersion((v) => v + 1);
    notify("NexStream key updated — used for all Watch streams");
  };

  return (
    <div className="min-h-screen bg-ink font-body">
      <Navbar
        view={view}
        onNavigate={navigate}
        watchlistCount={watchlist.length}
        onSelectTitle={setSelected}
        onPlayTitle={play}
        live={apiLive}
        trendingTop={trending[0] ?? null}
        upcomingTop={upcoming[0] ?? null}
      />

      {/* API key panel */}
      <AnimatePresence>
        {keyPanelOpen && (
          <motion.div
            initial={{ y: -70, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -70, opacity: 0 }}
            className="fixed inset-x-0 top-24 z-40 px-4 sm:top-28"
          >
            <div className="mx-auto max-w-2xl rounded-2xl border border-line bg-panel p-4 shadow-2xl shadow-black/60">
              <div className="flex items-center gap-3">
                <span
                  className={cn(
                    "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
                    apiLive ? "bg-emerald-500/15 text-emerald-400" : "bg-amber-500/15 text-amber-400"
                  )}
                >
                  <KeyRound size={18} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-display text-sm font-bold text-white">
                    API connections
                  </p>
                  <p className="truncate text-xs text-zinc-500">
                    Catalog:{" "}
                    <span className={apiLive ? "font-bold text-emerald-400" : "font-bold text-amber-400"}>
                      {apiLive ? "live" : "offline"}
                    </span>{" "}
                    <span className="text-zinc-700">·</span> TMDB{" "}
                    <span className="font-mono font-bold text-zinc-300">{maskedKey}</span> <span className="text-zinc-700">·</span>{" "}
                    NexStream <span className="font-mono font-bold text-zinc-300">{maskedStreamKey}</span>
                  </p>
                </div>
                <button
                  onClick={() => setKeyPanelOpen(false)}
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-panel2 text-zinc-400 transition hover:text-white"
                  aria-label="Close"
                >
                  <X size={15} />
                </button>
              </div>
              <p className="mt-3 mb-1.5 text-[11px] font-bold tracking-widest text-zinc-500 uppercase">
                TMDB key — powers the catalog & search
              </p>
              <div className="flex flex-col gap-2 sm:flex-row">
                <input
                  value={keyInput}
                  onChange={(e) => setKeyInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && saveKey()}
                  placeholder="Paste a TMDB API key (v3)…"
                  spellCheck={false}
                  className="w-full rounded-xl border border-line bg-coal px-4 py-2.5 font-mono text-[13px] text-white outline-none placeholder:font-body placeholder:text-zinc-600 focus:border-ember"
                />
                <div className="flex shrink-0 gap-2">
                  <button
                    onClick={saveKey}
                    className="flex-1 rounded-xl bg-ember px-5 py-2.5 text-[13px] font-bold text-white transition hover:bg-red-700 sm:flex-none"
                  >
                    Save & reload
                  </button>
                  <button
                    onClick={() => {
                      resetApiKey();
                      setKeyInput("");
                      setKeyPanelOpen(false);
                      setApiVersion((v) => v + 1);
                      notify("API key reset to default");
                    }}
                    className="rounded-xl bg-panel2 px-4 py-2.5 text-[13px] font-bold text-zinc-300 ring-1 ring-line transition hover:text-white"
                  >
                    Reset
                  </button>
                </div>
              </div>
              <p className="mt-3 mb-1.5 text-[11px] font-bold tracking-widest text-zinc-500 uppercase">
                NexStream key — powers Watch Now streams
              </p>
              <div className="flex flex-col gap-2 sm:flex-row">
                <input
                  value={streamInput}
                  onChange={(e) => setStreamInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && saveStreamKey()}
                  placeholder="Paste a NexStream key (nx_…)…"
                  spellCheck={false}
                  className="w-full rounded-xl border border-line bg-coal px-4 py-2.5 font-mono text-[13px] text-white outline-none placeholder:font-body placeholder:text-zinc-600 focus:border-ember"
                />
                <div className="flex shrink-0 gap-2">
                  <button
                    onClick={saveStreamKey}
                    className="flex-1 rounded-xl bg-emerald-500 px-5 py-2.5 text-[13px] font-bold text-black transition hover:bg-emerald-400 sm:flex-none"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => {
                      resetStreamKey();
                      setStreamInput("");
                      setStreamVersion((v) => v + 1);
                      notify("NexStream key reset to default");
                    }}
                    className="rounded-xl bg-panel2 px-4 py-2.5 text-[13px] font-bold text-zinc-300 ring-1 ring-line transition hover:text-white"
                  >
                    Reset
                  </button>
                </div>
              </div>
              <p className="mt-2.5 text-[11px] leading-relaxed text-zinc-600">
                TMDB key: themoviedb.org → Settings → API. NexStream key: your CodeSpecter dashboard. Keys are stored only in this browser.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <main>
        {view === "home" && (
          <>
            {homeLoading ? (
              <HeroSkeleton />
            ) : (
              <Hero
                featured={featured}
                watchlist={watchlist}
                onToggleList={toggleList}
                onSelect={setSelected}
                onPlay={play}
              />
            )}
            <StudiosMarquee />
            {homeLoading ? (
              <RailSkeleton />
            ) : (
              <Top10Row titles={trendingRow} onSelect={setSelected} onPlay={play} />
            )}
            <StatsBand />
            <Explorer
              titles={FALLBACK_TITLES}
              watchlist={watchlist}
              onToggleList={toggleList}
              onSelect={setSelected}
              onPlay={play}
              apiVersion={apiVersion}
            />
            <ContinueWatching titles={continueList} onSelect={setSelected} onPlay={play} />
            {homeLoading ? (
              <BlockSkeleton />
            ) : (
              <Spotlight title={spotlight} onSelect={setSelected} onPlay={play} />
            )}
            {homeLoading ? (
              <BlockSkeleton />
            ) : (
              <ComingSoon titles={comingSoon} onSelect={setSelected} onPlay={play} notify={notify} />
            )}
            <Pricing notify={notify} />
            <Faq />
          </>
        )}

        {view === "movies" && (
          <>
            <PageHeader
              kicker="Films"
              title="Movies"
              description="Blockbusters, Oscar winners and hidden gems — the live TMDB catalog. Filter by genre, era and rating to find your next obsession."
              backdrop={moviesBackdrop}
              icon={<Clapperboard size={13} />}
              chips={["Live catalog", "Up to 4K HDR", "New drops weekly"]}
            />
            <div className="-mt-6">
              <Explorer
                key={`movies-${apiVersion}`}
                titles={FALLBACK_TITLES}
                watchlist={watchlist}
                onToggleList={toggleList}
                onSelect={setSelected}
                onPlay={play}
                initialType="movie"
                lockType
                apiVersion={apiVersion}
              />
            </div>
          </>
        )}

        {view === "series" && (
          <>
            <PageHeader
              kicker="Shows"
              title="TV Series"
              description="Binge-worthy sagas, limited series and weekly drops from the live catalog. Track seasons and never miss an episode."
              backdrop={seriesBackdrop}
              icon={<Tv size={13} />}
              chips={["Live catalog", "Full seasons", "Weekly episodes"]}
            />
            <div className="-mt-6">
              <Explorer
                key={`series-${apiVersion}`}
                titles={FALLBACK_TITLES}
                watchlist={watchlist}
                onToggleList={toggleList}
                onSelect={setSelected}
                onPlay={play}
                initialType="series"
                lockType
                apiVersion={apiVersion}
              />
            </div>
          </>
        )}

        {view === "mylist" && (
          <>
            <PageHeader
              kicker="Saved"
              title="My List"
              description="Everything you bookmarked lives here — synced across devices and ready when you are."
              backdrop={listBackdrop}
              icon={<Bookmark size={13} />}
              chips={[`${watchlistTitles.length} saved`, "Synced everywhere", "Smart reminders"]}
            />
            <section className="mx-auto max-w-7xl px-4 pb-6 sm:px-6">
              {watchlistTitles.length === 0 ? (
                <div className="rounded-3xl border border-dashed border-line bg-panel/50 px-6 py-20 text-center">
                  <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-panel2 text-zinc-500 ring-1 ring-line">
                    <Bookmark size={26} />
                  </span>
                  <p className="mt-5 font-display text-2xl font-800 text-white">Your list is empty</p>
                  <p className="mx-auto mt-2 max-w-sm text-sm text-zinc-500">
                    Tap the bookmark on any title to save it here for later. Let's find something worth watching.
                  </p>
                  <button
                    onClick={() => navigate("home", "browse")}
                    className="mt-6 inline-flex items-center gap-2 rounded-full bg-ember px-7 py-3 text-sm font-bold text-white transition hover:bg-red-700"
                  >
                    <Compass size={16} /> Discover titles
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
                  {watchlistTitles.map((t) => (
                    <MovieCard
                      key={titleKey(t)}
                      title={t}
                      onSelect={setSelected}
                      onPlay={play}
                      inList
                      onToggleList={toggleList}
                    />
                  ))}
                </div>
              )}
            </section>

            <section className="mx-auto max-w-7xl px-4 pt-8 pb-16 sm:px-6">
              <p className="text-[11px] font-bold tracking-[0.2em] text-ember uppercase">Because you saved these</p>
              <h2 className="mt-1.5 font-display text-2xl font-900 tracking-tight text-white sm:text-3xl">
                Recommended for you
              </h2>
              <div className="mt-6 grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 lg:grid-cols-6">
                {recommendations.map((t) => (
                  <MovieCard
                    key={titleKey(t)}
                    title={t}
                    onSelect={setSelected}
                    onPlay={play}
                    inList={watchlist.includes(titleKey(t))}
                    onToggleList={toggleList}
                  />
                ))}
              </div>
            </section>
          </>
        )}
      </main>

      <Footer onNavigate={navigate} notify={notify} live={apiLive} onOpenApi={() => setKeyPanelOpen(true)} />

      <MovieModal
        title={selected}
        watchlist={watchlist}
        onToggleList={toggleList}
        onPlay={play}
        onClose={() => setSelected(null)}
        onSelect={setSelected}
        notify={notify}
      />
      <CinemaPlayer
        title={playing}
        onClose={() => {
          setPlaying(null);
          setProgressTick((x) => x + 1);
        }}
      />

      {/* Toasts */}
      <div className="pointer-events-none fixed right-4 bottom-4 z-[70] flex w-[calc(100%-2rem)] max-w-sm flex-col gap-2">
        <AnimatePresence>
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              layout
              initial={{ opacity: 0, x: 60 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 60 }}
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
              className="pointer-events-auto flex items-center gap-3 rounded-2xl border border-line bg-panel px-4 py-3.5 shadow-2xl shadow-black/60"
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-400">
                <CheckCircle2 size={17} />
              </span>
              <p className="text-[13px] font-semibold text-white">{t.message}</p>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Back to top */}
      <AnimatePresence>
        {showTop && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            className="fixed bottom-5 left-5 z-40 flex h-11 w-11 items-center justify-center rounded-full bg-panel text-white ring-1 ring-line shadow-xl transition hover:bg-ember hover:ring-ember"
            aria-label="Back to top"
          >
            <ArrowUp size={18} />
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}
