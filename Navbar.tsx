import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Bell,
  Bookmark,
  ChevronDown,
  Clapperboard,
  Crown,
  Flame,
  HelpCircle,
  Home,
  LogOut,
  Menu,
  MonitorPlay,
  Play,
  RefreshCw,
  Search,
  Settings,
  Sparkles,
  Star,
  TrendingUp,
  Tv,
  User,
  X,
} from "lucide-react";
import { asLocal, TITLES, type Title } from "../data/movies";
import { searchTitles } from "../lib/tmdb";
import { cn } from "../utils/cn";
import SafeImage from "./SafeImage";

export type View = "home" | "movies" | "series" | "mylist";

interface Props {
  view: View;
  onNavigate: (view: View, anchor?: string) => void;
  watchlistCount: number;
  onSelectTitle: (t: Title) => void;
  onPlayTitle: (t: Title) => void;
  live: boolean;
  trendingTop?: Title | null;
  upcomingTop?: Title | null;
}

const NAV_ITEMS: { id: View | "premium" | "soon"; label: string; icon: React.ReactNode }[] = [
  { id: "home", label: "Home", icon: <Home size={15} /> },
  { id: "movies", label: "Movies", icon: <Clapperboard size={15} /> },
  { id: "series", label: "TV Series", icon: <Tv size={15} /> },
  { id: "soon", label: "Coming Soon", icon: <Sparkles size={15} /> },
  { id: "mylist", label: "My List", icon: <Bookmark size={15} /> },
];

const TRENDING_SEARCHES = ["Dune", "Christopher Nolan", "Sci-Fi", "Zendaya", "Crime", "Breaking Bad", "Comedy"];

function localFilter(query: string): Title[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  return TITLES.filter(
    (t) =>
      t.title.toLowerCase().includes(q) ||
      t.genres.some((g) => g.toLowerCase().includes(q)) ||
      t.director.toLowerCase().includes(q) ||
      t.cast.some((c) => c.name.toLowerCase().includes(q))
  )
    .slice(0, 8)
    .map(asLocal);
}

export default function Navbar({ view, onNavigate, watchlistCount, onSelectTitle, onPlayTitle, live, trendingTop, upcomingTop }: Props) {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [remoteResults, setRemoteResults] = useState<Title[] | null>(null);
  const [searching, setSearching] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [recent, setRecent] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem("cinenova-recent") || "[]");
    } catch {
      return [];
    }
  });
  const searchInputRef = useRef<HTMLInputElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (searchOpen) setTimeout(() => searchInputRef.current?.focus(), 60);
  }, [searchOpen]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setSearchOpen(false);
        setMobileOpen(false);
        setNotifOpen(false);
        setProfileOpen(false);
      }
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    const onClick = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setNotifOpen(false);
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) setProfileOpen(false);
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("mousedown", onClick);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("mousedown", onClick);
    };
  }, []);

  /* Live TMDB search (debounced) with local fallback */
  useEffect(() => {
    const q = query.trim();
    if (!q) {
      setRemoteResults(null);
      setSearching(false);
      return;
    }
    setSearching(true);
    const controller = new AbortController();
    const id = setTimeout(async () => {
      try {
        const r = await searchTitles(q, controller.signal);
        setRemoteResults(r);
      } catch (e) {
        if ((e as { name?: string })?.name !== "AbortError") {
          setRemoteResults(localFilter(q));
        }
      } finally {
        setSearching(false);
      }
    }, 350);
    return () => {
      clearTimeout(id);
      controller.abort();
    };
  }, [query]);

  const localResults = useMemo(() => localFilter(query), [query]);
  const results = query.trim() ? (remoteResults ?? localResults) : [];
  const usingRemote = remoteResults !== null;

  const pushRecent = (term: string) => {
    const next = [term, ...recent.filter((r) => r !== term)].slice(0, 6);
    setRecent(next);
    localStorage.setItem("cinenova-recent", JSON.stringify(next));
  };

  const fmtDate = (d: string) => {
    if (!d) return "soon";
    try {
      return new Date(`${d}T12:00:00`).toLocaleDateString("en-US", { month: "short", day: "numeric" });
    } catch {
      return "soon";
    }
  };

  const notifications = useMemo(
    () => [
      {
        id: 1,
        icon: <Sparkles size={15} className="text-gold" />,
        title: upcomingTop ? `${upcomingTop.title} dated` : "Dune: Part Three dated",
        text: upcomingTop
          ? `Lands ${fmtDate(upcomingTop.releaseDate)}. Add a reminder.`
          : "The finale lands Dec 18, 2026. Add a reminder.",
        time: "2h ago",
        unread: true,
      },
      {
        id: 2,
        icon: <MonitorPlay size={15} className="text-emerald-400" />,
        title: trendingTop ? `#1 trending: ${trendingTop.title}` : "New episode: The Last of Us",
        text: trendingTop
          ? `★ ${trendingTop.rating.toFixed(1)} · ${trendingTop.votes} votes and climbing.`
          : "Season 2 finale is now streaming in 4K.",
        time: "6h ago",
        unread: true,
      },
      { id: 3, icon: <TrendingUp size={15} className="text-ember" />, title: "Top 10 refreshed", text: "This week's global chart just landed.", time: "1d ago", unread: false },
      { id: 4, icon: <Crown size={15} className="text-gold" />, title: "Premium weekend", text: "Watch everything in 4K HDR free until Monday.", time: "2d ago", unread: false },
    ],
    [trendingTop, upcomingTop]
  );

  const handleNav = (id: View | "premium" | "soon") => {
    setMobileOpen(false);
    if (id === "soon") onNavigate("home", "coming-soon");
    else if (id === "premium") onNavigate("home", "premium");
    else onNavigate(id);
  };

  return (
    <>
      <header
        className={cn(
          "fixed inset-x-0 top-0 z-40 transition-all duration-300",
          scrolled ? "border-b border-line bg-ink/95 backdrop-blur-xl" : "bg-transparent"
        )}
      >
        {/* Top utility strip */}
        <div
          className={cn(
            "overflow-hidden bg-ember transition-all duration-300",
            scrolled ? "max-h-0" : "max-h-9"
          )}
        >
          <p className="flex items-center justify-center gap-2 px-4 py-1.5 text-center text-[11px] font-semibold tracking-wide text-white uppercase">
            <Flame size={13} />
            <span className="hidden sm:inline">Premium weekend — stream everything in 4K free until Monday</span>
            <span className="sm:hidden">Free 4K weekend — all titles</span>
            <button
              onClick={() => onNavigate("home", "premium")}
              className="ml-1 rounded-full bg-white px-2.5 py-0.5 text-[10px] font-bold text-ember uppercase transition hover:bg-zinc-200"
            >
              Claim
            </button>
          </p>
        </div>

        <nav className="mx-auto flex h-16 max-w-7xl items-center gap-3 px-4 sm:px-6">
          {/* Logo */}
          <button onClick={() => onNavigate("home")} className="group flex shrink-0 items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-ember shadow-lg shadow-ember/30 transition-transform group-hover:rotate-6">
              <Clapperboard size={19} className="text-white" />
            </span>
            <span className="font-display text-xl font-800 tracking-tight text-white">
              Cine<span className="text-ember">Nova</span>
            </span>
          </button>
          <span
            className={cn(
              "hidden items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-900 tracking-widest ring-1 sm:flex",
              live ? "bg-emerald-500/10 text-emerald-400 ring-emerald-500/30" : "bg-amber-500/10 text-amber-400 ring-amber-500/30"
            )}
            title={live ? "Connected to TMDB — live catalog" : "Offline mode — showing cached catalog"}
          >
            <span className={cn("h-1.5 w-1.5 rounded-full", live ? "animate-pulse-dot bg-emerald-400" : "bg-amber-400")} />
            {live ? "LIVE" : "OFFLINE"}
          </span>

          {/* Desktop links */}
          <div className="ml-4 hidden items-center gap-1 lg:flex">
            {NAV_ITEMS.map((item) => {
              const active = view === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleNav(item.id)}
                  className={cn(
                    "relative flex items-center gap-1.5 rounded-full px-4 py-2 text-[13px] font-semibold transition",
                    active ? "text-white" : "text-zinc-400 hover:text-white"
                  )}
                >
                  {active && (
                    <motion.span
                      layoutId="nav-pill"
                      className="absolute inset-0 rounded-full bg-panel2 ring-1 ring-line"
                      transition={{ type: "spring", stiffness: 400, damping: 32 }}
                    />
                  )}
                  <span className="relative z-10 flex items-center gap-1.5">
                    {item.icon}
                    {item.label}
                    {item.id === "mylist" && watchlistCount > 0 && (
                      <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-ember px-1 text-[10px] font-bold text-white">
                        {watchlistCount}
                      </span>
                    )}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="flex-1" />

          {/* Search trigger */}
          <button
            onClick={() => setSearchOpen(true)}
            className="hidden items-center gap-2.5 rounded-full border border-line bg-panel/80 py-2 pr-4 pl-3.5 text-[13px] text-zinc-400 transition hover:border-zinc-500 hover:text-zinc-200 md:flex"
          >
            <Search size={15} />
            <span>Search titles, genres, actors…</span>
            <kbd className="rounded-md border border-line bg-coal px-1.5 py-0.5 font-body text-[10px] font-semibold text-zinc-500">
              ⌘K
            </kbd>
          </button>
          <button
            onClick={() => setSearchOpen(true)}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-line bg-panel/80 text-zinc-300 transition hover:border-zinc-500 md:hidden"
            aria-label="Search"
          >
            <Search size={17} />
          </button>

          {/* Notifications */}
          <div className="relative" ref={notifRef}>
            <button
              onClick={() => {
                setNotifOpen(!notifOpen);
                setProfileOpen(false);
              }}
              className={cn(
                "relative flex h-10 w-10 items-center justify-center rounded-full border transition",
                notifOpen ? "border-ember bg-ember/15 text-white" : "border-line bg-panel/80 text-zinc-300 hover:border-zinc-500"
              )}
              aria-label="Notifications"
            >
              <Bell size={17} />
              <span className="absolute top-2 right-2.5 h-2 w-2 rounded-full bg-ember ring-2 ring-ink" />
            </button>
            <AnimatePresence>
              {notifOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.97 }}
                  transition={{ duration: 0.18 }}
                  className="absolute right-0 mt-3 w-[330px] overflow-hidden rounded-2xl border border-line bg-panel shadow-2xl shadow-black/60"
                >
                  <div className="flex items-center justify-between border-b border-line px-4 py-3">
                    <p className="font-display text-sm font-bold text-white">Notifications</p>
                    <span className="rounded-full bg-ember/15 px-2 py-0.5 text-[11px] font-bold text-ember">2 new</span>
                  </div>
                  <div className="max-h-[340px] overflow-y-auto">
                    {notifications.map((n) => (
                      <div key={n.id} className="flex gap-3 border-b border-line/60 px-4 py-3.5 transition last:border-0 hover:bg-panel2">
                        <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-coal ring-1 ring-line">
                          {n.icon}
                        </span>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="truncate text-[13px] font-bold text-white">{n.title}</p>
                            {n.unread && <span className="h-1.5 w-1.5 shrink-0 animate-pulse-dot rounded-full bg-ember" />}
                          </div>
                          <p className="mt-0.5 line-clamp-2 text-xs text-zinc-400">{n.text}</p>
                          <p className="mt-1 text-[11px] font-medium text-zinc-600">{n.time}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Profile */}
          <div className="relative hidden sm:block" ref={profileRef}>
            <button
              onClick={() => {
                setProfileOpen(!profileOpen);
                setNotifOpen(false);
              }}
              className="flex items-center gap-1.5 rounded-full border border-line bg-panel/80 p-1 pr-2 transition hover:border-zinc-500"
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-ember font-display text-sm font-bold text-white">
                A
              </span>
              <ChevronDown size={14} className={cn("text-zinc-400 transition-transform", profileOpen && "rotate-180")} />
            </button>
            <AnimatePresence>
              {profileOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.97 }}
                  transition={{ duration: 0.18 }}
                  className="absolute right-0 mt-3 w-60 overflow-hidden rounded-2xl border border-line bg-panel shadow-2xl shadow-black/60"
                >
                  <div className="border-b border-line px-4 py-3.5">
                    <p className="font-display text-sm font-bold text-white">Alex Carter</p>
                    <p className="text-xs text-zinc-500">alex@cinenova.io</p>
                    <span className="mt-2 inline-flex items-center gap-1 rounded-full bg-gold/15 px-2.5 py-1 text-[11px] font-bold text-gold">
                      <Crown size={11} /> Premium 4K
                    </span>
                  </div>
                  {[
                    { icon: <User size={15} />, label: "Profile & settings" },
                    { icon: <Bookmark size={15} />, label: "My List", action: () => onNavigate("mylist") },
                    { icon: <Settings size={15} />, label: "Preferences" },
                    { icon: <HelpCircle size={15} />, label: "Help center" },
                  ].map((m) => (
                    <button
                      key={m.label}
                      onClick={() => {
                        m.action?.();
                        setProfileOpen(false);
                      }}
                      className="flex w-full items-center gap-3 px-4 py-2.5 text-[13px] font-medium text-zinc-300 transition hover:bg-panel2 hover:text-white"
                    >
                      <span className="text-zinc-500">{m.icon}</span>
                      {m.label}
                    </button>
                  ))}
                  <button className="flex w-full items-center gap-3 border-t border-line px-4 py-3 text-[13px] font-semibold text-ember transition hover:bg-ember/10">
                    <LogOut size={15} /> Sign out
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileOpen(true)}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-line bg-panel/80 text-zinc-200 lg:hidden"
            aria-label="Menu"
          >
            <Menu size={18} />
          </button>
        </nav>
      </header>

      {/* Mobile drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
              className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm"
            />
            <motion.aside
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", stiffness: 320, damping: 34 }}
              className="fixed top-0 right-0 z-50 flex h-full w-[300px] flex-col border-l border-line bg-coal"
            >
              <div className="flex items-center justify-between border-b border-line px-5 py-4">
                <span className="flex items-center gap-2">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-ember">
                    <Clapperboard size={16} className="text-white" />
                  </span>
                  <span className="font-display text-lg font-bold text-white">
                    Cine<span className="text-ember">Nova</span>
                  </span>
                </span>
                <button
                  onClick={() => setMobileOpen(false)}
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-panel2 text-zinc-300"
                  aria-label="Close menu"
                >
                  <X size={17} />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-4">
                <p className="px-2 pb-2 text-[11px] font-bold tracking-widest text-zinc-600 uppercase">Menu</p>
                {NAV_ITEMS.map((item, i) => (
                  <motion.button
                    key={item.id}
                    initial={{ opacity: 0, x: 24 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.05 * i }}
                    onClick={() => handleNav(item.id)}
                    className={cn(
                      "mb-1 flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold transition",
                      view === item.id ? "bg-ember text-white" : "text-zinc-300 hover:bg-panel2"
                    )}
                  >
                    {item.icon}
                    {item.label}
                    {item.id === "mylist" && watchlistCount > 0 && (
                      <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-white/20 px-1.5 text-[10px] font-bold">
                        {watchlistCount}
                      </span>
                    )}
                  </motion.button>
                ))}
                <p className="px-2 pt-4 pb-2 text-[11px] font-bold tracking-widest text-zinc-600 uppercase">Account</p>
                <button
                  onClick={() => handleNav("premium")}
                  className="flex w-full items-center gap-3 rounded-xl border border-gold/30 bg-gold/10 px-3 py-3 text-sm font-semibold text-gold"
                >
                  <Crown size={16} /> Go Premium
                </button>
              </div>
              <div className="border-t border-line p-4">
                <div className="flex items-center gap-3 rounded-xl bg-panel p-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-ember font-display font-bold text-white">
                    A
                  </span>
                  <div>
                    <p className="text-sm font-bold text-white">Alex Carter</p>
                    <p className="text-xs text-zinc-500">Premium 4K plan</p>
                  </div>
                </div>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Search overlay */}
      <AnimatePresence>
        {searchOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 overflow-y-auto bg-ink/97 backdrop-blur-xl"
          >
            <div className="mx-auto max-w-3xl px-4 pt-20 pb-16 sm:pt-28">
              <motion.div initial={{ y: 24, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.05 }}>
                <div className="flex items-center gap-3 rounded-2xl border border-line bg-panel p-2 pl-5 shadow-2xl shadow-black/50 focus-within:border-ember">
                  <Search size={20} className="shrink-0 text-zinc-500" />
                  <input
                    ref={searchInputRef}
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && query.trim()) pushRecent(query.trim());
                    }}
                    placeholder="Search millions of movies & shows…"
                    className="w-full bg-transparent py-3 text-base text-white outline-none placeholder:text-zinc-600 sm:text-lg"
                  />
                  {searching && <RefreshCw size={17} className="shrink-0 animate-spin text-ember" />}
                  {query && !searching && (
                    <button
                      onClick={() => setQuery("")}
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-panel2 text-zinc-400 hover:text-white"
                    >
                      <X size={15} />
                    </button>
                  )}
                  <button
                    onClick={() => setSearchOpen(false)}
                    className="hidden shrink-0 items-center gap-1.5 rounded-xl bg-panel2 px-4 py-2.5 text-[13px] font-semibold text-zinc-300 transition hover:bg-line sm:flex"
                  >
                    <X size={14} /> ESC
                  </button>
                </div>
              </motion.div>

              {!query && (
                <motion.div initial={{ y: 16, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.12 }}>
                  {recent.length > 0 && (
                    <div className="mt-8">
                      <p className="text-[11px] font-bold tracking-widest text-zinc-500 uppercase">Recent searches</p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {recent.map((r) => (
                          <button
                            key={r}
                            onClick={() => setQuery(r)}
                            className="rounded-full border border-line bg-panel px-4 py-2 text-[13px] font-medium text-zinc-300 transition hover:border-zinc-500 hover:text-white"
                          >
                            {r}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                  <div className="mt-8">
                    <p className="flex items-center gap-1.5 text-[11px] font-bold tracking-widest text-zinc-500 uppercase">
                      <Flame size={12} className="text-ember" /> Trending searches
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {TRENDING_SEARCHES.map((t) => (
                        <button
                          key={t}
                          onClick={() => setQuery(t)}
                          className="flex items-center gap-1.5 rounded-full border border-line bg-panel px-4 py-2 text-[13px] font-medium text-zinc-300 transition hover:border-ember hover:text-white"
                        >
                          <TrendingUp size={13} className="text-ember" /> {t}
                        </button>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}

              {query && (
                <div className="mt-8">
                  <div className="flex items-center justify-between">
                    <p className="text-[11px] font-bold tracking-widest text-zinc-500 uppercase">
                      {results.length} result{results.length !== 1 && "s"} for “{query}”
                    </p>
                    <span
                      className={cn(
                        "flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-900 tracking-widest ring-1",
                        usingRemote && live
                          ? "bg-emerald-500/10 text-emerald-400 ring-emerald-500/30"
                          : "bg-panel text-zinc-500 ring-line"
                      )}
                    >
                      <span className={cn("h-1.5 w-1.5 rounded-full", usingRemote && live ? "bg-emerald-400" : "bg-zinc-600")} />
                      {usingRemote && live ? "TMDB LIVE" : "OFFLINE INDEX"}
                    </span>
                  </div>
                  <div className="mt-4 space-y-2.5">
                    {results.map((t, i) => (
                      <motion.div
                        key={`${t.type}-${t.id}`}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.04 }}
                        onClick={() => {
                          pushRecent(t.title);
                          setSearchOpen(false);
                          setQuery("");
                          onSelectTitle(t);
                        }}
                        className="group flex w-full cursor-pointer items-center gap-4 rounded-2xl border border-line bg-panel p-2.5 text-left transition hover:border-ember"
                      >
                        <SafeImage
                          seed={t.key ?? t.id}
                          src={t.poster}
                          alt={t.title}
                          wrapperClassName="h-16 w-11 shrink-0 rounded-lg"
                        />
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-display text-[15px] font-bold text-white group-hover:text-ember">
                            {t.title}
                          </p>
                          <p className="mt-0.5 truncate text-xs text-zinc-500">
                            {t.year} · {t.type === "movie" ? "Movie" : "Series"} · {t.genres.slice(0, 3).join(", ") || "Various"}
                          </p>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            pushRecent(t.title);
                            setSearchOpen(false);
                            setQuery("");
                            onPlayTitle(t);
                          }}
                          className="flex shrink-0 items-center gap-1.5 rounded-full bg-ember px-3.5 py-2 text-xs font-bold text-white transition hover:bg-red-700"
                        >
                          <Play size={12} fill="currentColor" /> Watch
                        </button>
                        {t.rating > 0 && (
                          <span className="mr-2 flex shrink-0 items-center gap-1 rounded-lg bg-coal px-2.5 py-1.5 text-[13px] font-bold text-gold ring-1 ring-line">
                            <Star size={13} fill="currentColor" /> {t.rating.toFixed(1)}
                          </span>
                        )}
                      </motion.div>
                    ))}
                    {results.length === 0 && !searching && (
                      <div className="rounded-2xl border border-dashed border-line bg-panel/60 px-6 py-12 text-center">
                        <Search size={28} className="mx-auto text-zinc-600" />
                        <p className="mt-3 font-display font-bold text-white">No titles found</p>
                        <p className="mt-1 text-sm text-zinc-500">Try a different title, actor or genre.</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
