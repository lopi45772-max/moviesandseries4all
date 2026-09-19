import { titleKey, type SortId, type Title, type YearId } from "../data/movies";

/* ================= API key ================= */
const DEFAULT_API_KEY = "fc36e8d6e14d28bb2428e8e39a4ce948";
const KEY_STORAGE = "cinenova-tmdb-key";

export function getApiKey(): string {
  try {
    return localStorage.getItem(KEY_STORAGE) || DEFAULT_API_KEY;
  } catch {
    return DEFAULT_API_KEY;
  }
}

export function setApiKey(key: string) {
  try {
    localStorage.setItem(KEY_STORAGE, key.trim());
  } catch {
    /* ignore */
  }
  cache.clear();
}

export function resetApiKey() {
  try {
    localStorage.removeItem(KEY_STORAGE);
  } catch {
    /* ignore */
  }
  cache.clear();
}

/* ================= Stream key (NexStream) ================= */
const DEFAULT_STREAM_KEY = "nx_5969afc3b1c39f9a5e30c7f37154fed0";
const STREAM_KEY_STORAGE = "cinenova-stream-key";

export function getStreamKey(): string {
  try {
    return localStorage.getItem(STREAM_KEY_STORAGE) || DEFAULT_STREAM_KEY;
  } catch {
    return DEFAULT_STREAM_KEY;
  }
}

export function setStreamKey(key: string) {
  try {
    localStorage.setItem(STREAM_KEY_STORAGE, key.trim());
  } catch {
    /* ignore */
  }
}

export function resetStreamKey() {
  try {
    localStorage.removeItem(STREAM_KEY_STORAGE);
  } catch {
    /* ignore */
  }
}

/* ================= HTTP + cache ================= */
const BASE = "https://api.themoviedb.org/3";
const IMG_BASE = "https://image.tmdb.org/t/p";

export class TmdbError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

const cache = new Map<string, { ts: number; data: unknown }>();
const TTL_MS = 10 * 60 * 1000;

async function get<T>(
  path: string,
  params: Record<string, string | number | boolean> = {},
  signal?: AbortSignal
): Promise<T> {
  const url = new URL(BASE + path);
  url.searchParams.set("api_key", getApiKey());
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, String(v));
  const href = url.toString();
  const hit = cache.get(href);
  if (hit && Date.now() - hit.ts < TTL_MS) return hit.data as T;
  const res = await fetch(href, { signal });
  if (!res.ok) throw new TmdbError(`TMDB request failed (${res.status})`, res.status);
  const data = (await res.json()) as T;
  cache.set(href, { ts: Date.now(), data });
  if (cache.size > 300) {
    const first = cache.keys().next().value;
    if (first) cache.delete(first);
  }
  return data;
}

export const img = (path: string | null | undefined, size = "w500") =>
  path ? `${IMG_BASE}/${size}${path}` : "";

export function getRegion(): string {
  try {
    const tag =
      Intl.DateTimeFormat().resolvedOptions().locale || navigator.language || "en-US";
    const code = tag.split("-")[1]?.toUpperCase();
    if (code && /^[A-Z]{2}$/.test(code)) return code;
  } catch {
    /* ignore */
  }
  return "US";
}

/** True only for genuine TMDB-backed titles (not the local offline catalog). */
export function isRemoteTitle(t: Title): boolean {
  const k = t.key ?? "";
  return k.startsWith("movie-") || k.startsWith("tv-");
}

/* ================= Lookups ================= */
const GENRE_NAMES: Record<number, string> = {
  28: "Action",
  12: "Adventure",
  16: "Animation",
  35: "Comedy",
  80: "Crime",
  99: "Documentary",
  18: "Drama",
  10751: "Family",
  14: "Fantasy",
  36: "History",
  27: "Horror",
  10402: "Music",
  9648: "Mystery",
  10749: "Romance",
  878: "Sci-Fi",
  10770: "TV Movie",
  53: "Thriller",
  10752: "War",
  37: "Western",
  10759: "Action",
  10762: "Kids",
  10763: "News",
  10764: "Reality",
  10765: "Sci-Fi",
  10766: "Soap",
  10767: "Talk",
  10768: "War",
};

/** Genre name -> TMDB genre id per endpoint (movie / tv). null = unsupported there. */
export const GENRE_MAP: Record<string, { movie: number | null; tv: number | null }> = {
  Action: { movie: 28, tv: 10759 },
  Adventure: { movie: 12, tv: 10759 },
  Animation: { movie: 16, tv: 16 },
  Comedy: { movie: 35, tv: 35 },
  Crime: { movie: 80, tv: 80 },
  Drama: { movie: 18, tv: 18 },
  Family: { movie: 10751, tv: 10751 },
  Fantasy: { movie: 14, tv: 10765 },
  History: { movie: 36, tv: null },
  Horror: { movie: 27, tv: null },
  Music: { movie: 10402, tv: null },
  Mystery: { movie: 9648, tv: 9648 },
  Romance: { movie: 10749, tv: null },
  "Sci-Fi": { movie: 878, tv: 10765 },
  Thriller: { movie: 53, tv: null },
};

const LANG: Record<string, string> = {
  en: "English",
  es: "Spanish",
  fr: "French",
  de: "German",
  it: "Italian",
  pt: "Portuguese",
  ja: "Japanese",
  ko: "Korean",
  hi: "Hindi",
  zh: "Chinese",
  ru: "Russian",
  ar: "Arabic",
  tr: "Turkish",
  nl: "Dutch",
  sv: "Swedish",
  da: "Danish",
  no: "Norwegian",
  fi: "Finnish",
  pl: "Polish",
  th: "Thai",
  id: "Indonesian",
  ms: "Malay",
  vi: "Vietnamese",
};

export function formatVotes(n: number): string {
  if (!n || n <= 0) return "—";
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return `${n}`;
}

export function formatRuntime(mins: number): string {
  if (!mins || mins <= 0) return "";
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

function daysSince(dateStr: string): number {
  const t = new Date(`${dateStr}T12:00:00`).getTime();
  if (Number.isNaN(t)) return Infinity;
  return (Date.now() - t) / 86_400_000;
}

/* ================= Adapter ================= */
interface RawItem {
  id: number;
  media_type?: string;
  title?: string;
  name?: string;
  original_language?: string;
  overview?: string;
  poster_path?: string | null;
  backdrop_path?: string | null;
  genre_ids?: number[];
  release_date?: string;
  first_air_date?: string;
  vote_average?: number;
  vote_count?: number;
  popularity?: number;
}

export function adaptItem(item: RawItem, force?: "movie" | "tv"): Title {
  const isTv = force
    ? force === "tv"
    : item.media_type
      ? item.media_type === "tv"
      : Boolean(item.first_air_date && !item.title);
  const type = isTv ? "series" : "movie";
  const title = item.title || item.name || "Untitled";
  const date = item.release_date || item.first_air_date || "";
  const parsedYear = date ? parseInt(date.slice(0, 4), 10) : NaN;
  const year = Number.isNaN(parsedYear) ? new Date().getFullYear() : parsedYear;
  const key = `${isTv ? "tv" : "movie"}-${item.id}`;
  const rating = item.vote_average ? Math.round(item.vote_average * 10) / 10 : 0;
  const poster =
    img(item.poster_path, "w500") || `https://picsum.photos/seed/${key}/600/900`;
  const backdrop =
    img(item.backdrop_path, "w1280") ||
    img(item.poster_path, "w780") ||
    `https://picsum.photos/seed/${key}-wide/1280/720`;
  const genres = (item.genre_ids || [])
    .map((g) => GENRE_NAMES[g])
    .filter(Boolean)
    .slice(0, 3);
  return {
    id: item.id,
    key,
    title,
    type,
    year,
    rating,
    votes: formatVotes(item.vote_count ?? 0),
    duration: "",
    runtimeMins: 0,
    genres,
    overview: item.overview || "No synopsis available yet for this title.",
    tagline: "",
    poster,
    backdrop,
    cast: [],
    director: "",
    maturity: "NR",
    quality: "4K",
    language: LANG[item.original_language || "en"] || (item.original_language || "EN").toUpperCase(),
    popularity: item.popularity ?? 0,
    releaseDate: date,
    isNew: date ? daysSince(date) < 180 : false,
  };
}

/* ================= Lists ================= */
export async function fetchTrending(
  kind: "all" | "movie" | "tv" = "all",
  signal?: AbortSignal
): Promise<Title[]> {
  const data = await get<{ results: RawItem[] }>(
    `/trending/${kind}/week`,
    { language: "en-US" },
    signal
  );
  return (data.results || [])
    .filter((r) => r.media_type !== "person")
    .map((r) => adaptItem(r))
    .slice(0, 20);
}

export async function fetchUpcoming(signal?: AbortSignal): Promise<Title[]> {
  const data = await get<{ results: RawItem[] }>(
    `/movie/upcoming`,
    { language: "en-US", region: getRegion(), page: 1 },
    signal
  );
  const now = Date.now();
  return (data.results || [])
    .filter((r) => r.release_date)
    .sort((a, b) => ((a.release_date as string) > (b.release_date as string) ? 1 : -1))
    .slice(0, 8)
    .map((r) => ({
      ...adaptItem(r, "movie"),
      comingSoon: new Date(`${r.release_date}T12:00:00`).getTime() > now,
      isNew: true,
      rating: 0,
      votes: "—",
    }));
}

export async function fetchTopRated(signal?: AbortSignal): Promise<Title[]> {
  const data = await get<{ results: RawItem[] }>(
    `/movie/top_rated`,
    { language: "en-US", page: 1 },
    signal
  );
  return (data.results || []).map((r) => adaptItem(r, "movie")).slice(0, 10);
}

export async function searchTitles(query: string, signal?: AbortSignal): Promise<Title[]> {
  const data = await get<{ results: RawItem[] }>(
    `/search/multi`,
    { language: "en-US", query, include_adult: false, page: 1 },
    signal
  );
  return (data.results || [])
    .filter((r) => r.media_type === "movie" || r.media_type === "tv")
    .map((r) => adaptItem(r))
    .slice(0, 8);
}

/* ================= Discover ================= */
interface DiscoverOpts {
  media: "movie" | "tv";
  genre: string | null;
  year: YearId;
  minRating: number;
  sort: SortId;
  page: number;
}

function yearRange(year: YearId): { gte?: string; lte?: string } {
  switch (year) {
    case "all":
      return {};
    case "2024+":
      return { gte: "2024-01-01" };
    case "2020s":
      return { gte: "2020-01-01", lte: "2023-12-31" };
    case "2010s":
      return { gte: "2010-01-01", lte: "2019-12-31" };
    case "2000s":
      return { gte: "2000-01-01", lte: "2009-12-31" };
    case "classic":
      return { lte: "1999-12-31" };
  }
}

function sortParam(media: "movie" | "tv", sort: SortId): string {
  const dateField = media === "movie" ? "primary_release_date" : "first_air_date";
  switch (sort) {
    case "popular":
      return "popularity.desc";
    case "rating":
      return "vote_average.desc";
    case "buzz":
      return "vote_count.desc";
    case "newest":
      return `${dateField}.desc`;
    case "oldest":
      return `${dateField}.asc`;
    case "az":
      return media === "movie" ? "original_title.asc" : "popularity.desc";
  }
}

function clientSort(list: Title[], sort: SortId): Title[] {
  const arr = [...list];
  switch (sort) {
    case "popular":
    case "buzz":
      return arr.sort((a, b) => b.popularity - a.popularity);
    case "rating":
      return arr.sort((a, b) => b.rating - a.rating);
    case "newest":
      return arr.sort((a, b) => (b.releaseDate || "").localeCompare(a.releaseDate || ""));
    case "oldest":
      return arr.sort((a, b) => (a.releaseDate || "").localeCompare(b.releaseDate || ""));
    case "az":
      return arr.sort((a, b) => a.title.localeCompare(b.title));
  }
}

async function discoverOne(
  o: DiscoverOpts,
  signal?: AbortSignal
): Promise<{ results: Title[]; totalPages: number; totalResults: number }> {
  const range = yearRange(o.year);
  const dateField = o.media === "movie" ? "primary_release_date" : "first_air_date";
  const params: Record<string, string | number | boolean> = {
    language: "en-US",
    sort_by: sortParam(o.media, o.sort),
    page: o.page,
    include_adult: false,
    "vote_count.gte": o.minRating > 0 || o.sort === "rating" || o.sort === "buzz" ? 100 : 10,
  };
  const gid = o.genre ? (GENRE_MAP[o.genre]?.[o.media] ?? null) : null;
  if (o.genre && !gid) return { results: [], totalPages: 0, totalResults: 0 };
  if (gid) params.with_genres = gid;
  if (o.minRating > 0) params["vote_average.gte"] = o.minRating;
  if (range.gte) params[`${dateField}.gte`] = range.gte;
  if (range.lte) params[`${dateField}.lte`] = range.lte;
  try {
    const data = await get<{
      results: RawItem[];
      total_pages: number;
      total_results: number;
    }>(`/discover/${o.media}`, params, signal);
    let results = (data.results || []).map((r) => adaptItem(r, o.media));
    if (o.media === "tv" && o.sort === "az") {
      results = results.sort((a, b) => a.title.localeCompare(b.title));
    }
    return {
      results,
      totalPages: Math.min(data.total_pages || 1, 500),
      totalResults: data.total_results || 0,
    };
  } catch (e) {
    if (o.page > 1) return { results: [], totalPages: o.page - 1, totalResults: 0 };
    throw e;
  }
}

export async function runDiscover(
  o: Omit<DiscoverOpts, "media"> & { media: "movie" | "tv" | "all" },
  signal?: AbortSignal
): Promise<{ results: Title[]; totalPages: number; totalResults: number }> {
  if (o.media !== "all") return discoverOne({ ...o, media: o.media }, signal);
  const [m, t] = await Promise.all([
    discoverOne({ ...o, media: "movie" }, signal),
    discoverOne({ ...o, media: "tv" }, signal),
  ]);
  return {
    results: clientSort([...m.results, ...t.results], o.sort).slice(0, 40),
    totalPages: Math.max(m.totalPages, t.totalPages),
    totalResults: m.totalResults + t.totalResults,
  };
}

/* ================= Details ================= */
export interface Provider {
  id: number;
  name: string;
  logo: string;
}
export interface Providers {
  stream: Provider[];
  rent: Provider[];
  link?: string;
}
export interface TitleDetails {
  patch: Partial<Title>;
  similar: Title[];
  providers: Providers;
}

interface Video {
  site: string;
  type: string;
  key: string;
  official: boolean;
}

function pickTrailer(videos: Video[] | undefined): string | null {
  if (!videos || videos.length === 0) return null;
  const yt = videos.filter((v) => v.site === "YouTube");
  const score = (v: Video) =>
    (v.type === "Trailer" ? 2 : v.type === "Teaser" ? 1 : 0) + (v.official ? 1 : 0);
  const best = [...yt].sort((a, b) => score(b) - score(a))[0];
  return best?.key ?? null;
}

export async function fetchTrailerKey(t: Title, signal?: AbortSignal): Promise<string | null> {
  const seg = t.type === "movie" ? "movie" : "tv";
  try {
    const data = await get<{ results: Video[] }>(`/${seg}/${t.id}/videos`, { language: "en-US" }, signal);
    return pickTrailer(data.results);
  } catch {
    return null;
  }
}

export async function fetchDetails(t: Title, signal?: AbortSignal): Promise<TitleDetails> {
  const seg = t.type === "movie" ? "movie" : "tv";
  const region = getRegion();
  const [d, prov, cert] = await Promise.all([
    get<Record<string, unknown>>(
      `/${seg}/${t.id}`,
      { language: "en-US", append_to_response: "credits,videos,similar" },
      signal
    ),
    get<Record<string, unknown>>(`/${seg}/${t.id}/watch/providers`, {}, signal).catch(() => null),
    (t.type === "movie"
      ? get<Record<string, unknown>>(`/movie/${t.id}/releases`, {}, signal).catch(() => null)
      : get<Record<string, unknown>>(`/tv/${t.id}/content_ratings`, {}, signal).catch(() => null)),
  ]);

  const anyD = d as {
    videos?: { results?: Video[] };
    credits?: { cast?: { name: string; character?: string }[]; crew?: { job: string; name: string }[] };
    similar?: { results?: RawItem[] };
    tagline?: string;
    genres?: { name: string }[];
    vote_average?: number;
    vote_count?: number;
    runtime?: number;
    release_date?: string;
    number_of_seasons?: number;
    number_of_episodes?: number;
    episode_run_time?: number[];
    first_air_date?: string;
    created_by?: { name: string }[];
  };

  const trailerKey = pickTrailer(anyD.videos?.results);
  const cast = (anyD.credits?.cast || []).slice(0, 8).map((c) => ({
    name: c.name,
    character: c.character || "—",
  }));
  const rating = anyD.vote_average ? Math.round(anyD.vote_average * 10) / 10 : t.rating;

  let patch: Partial<Title>;
  if (t.type === "movie") {
    const director =
      (anyD.credits?.crew || []).find((c) => c.job === "Director")?.name || "";
    const runtime = anyD.runtime || 0;
    const date = anyD.release_date || t.releaseDate;
    patch = {
      duration: formatRuntime(runtime),
      runtimeMins: runtime,
      tagline: anyD.tagline || "",
      genres: (anyD.genres || []).map((g) => g.name).slice(0, 4),
      cast,
      director,
      trailerKey: trailerKey || undefined,
      rating,
      votes: formatVotes(anyD.vote_count || 0),
      releaseDate: date,
      year: date ? parseInt(date.slice(0, 4), 10) || t.year : t.year,
    };
    const countries = ((cert as { countries?: { iso_3166_1: string; certification: string }[] } | null)
      ?.countries || []) as { iso_3166_1: string; certification: string }[];
    const match =
      countries.find((c) => c.iso_3166_1 === region && c.certification) ||
      countries.find((c) => c.iso_3166_1 === "US" && c.certification) ||
      countries.find((c) => c.certification);
    if (match?.certification) patch.maturity = match.certification;
  } else {
    const seasons = anyD.number_of_seasons || 1;
    const episodes = anyD.number_of_episodes || 0;
    const epRuntime = (anyD.episode_run_time || [])[0] || 45;
    const date = anyD.first_air_date || t.releaseDate;
    patch = {
      seasons,
      episodes,
      duration: `${seasons} Season${seasons > 1 ? "s" : ""}`,
      runtimeMins: epRuntime,
      tagline: anyD.tagline || "",
      genres: (anyD.genres || []).map((g) => g.name).slice(0, 4),
      cast,
      director: anyD.created_by?.[0]?.name || "",
      trailerKey: trailerKey || undefined,
      rating,
      votes: formatVotes(anyD.vote_count || 0),
      releaseDate: date,
      year: date ? parseInt(date.slice(0, 4), 10) || t.year : t.year,
    };
    const ratings = ((cert as { results?: { iso_3166_1: string; rating: string }[] } | null)
      ?.results || []) as { iso_3166_1: string; rating: string }[];
    const match =
      ratings.find((r) => r.iso_3166_1 === region && r.rating) ||
      ratings.find((r) => r.iso_3166_1 === "US" && r.rating);
    if (match?.rating) patch.maturity = match.rating;
  }

  const similar = (anyD.similar?.results || [])
    .filter((r) => r.poster_path)
    .slice(0, 6)
    .map((r) => adaptItem(r, seg as "movie" | "tv"));

  const results = (prov as { results?: Record<string, { link?: string; flatrate?: { provider_id: number; provider_name: string; logo_path: string }[]; rent?: { provider_id: number; provider_name: string; logo_path: string }[]; buy?: { provider_id: number; provider_name: string; logo_path: string }[] }> } | null)
    ?.results;
  const entry = results?.[region] || results?.US;
  const mapP = (
    arr: { provider_id: number; provider_name: string; logo_path: string }[] | undefined
  ): Provider[] =>
    (arr || []).map((p) => ({ id: p.provider_id, name: p.provider_name, logo: img(p.logo_path, "w92") }));
  const providers: Providers = {
    stream: mapP(entry?.flatrate),
    rent: [...mapP(entry?.rent), ...mapP(entry?.buy)],
    link: entry?.link,
  };

  return { patch, similar, providers };
}

/* ================= Local persistence ================= */
const PROG_KEY = "cinenova-progress";
const SAVED_KEY = "cinenova-saved";

interface ProgressEntry {
  pct: number;
  ts: number;
  snap: Title;
}

export function saveProgress(t: Title, pct: number) {
  try {
    const raw = localStorage.getItem(PROG_KEY);
    const obj = (raw ? JSON.parse(raw) : {}) as Record<string, ProgressEntry>;
    const k = titleKey(t);
    if (pct < 2 || pct >= 97) delete obj[k];
    else obj[k] = { pct: Math.round(pct), ts: Date.now(), snap: { ...t } };
    localStorage.setItem(PROG_KEY, JSON.stringify(obj));
  } catch {
    /* ignore */
  }
}

export function readProgress(): Title[] {
  try {
    const raw = localStorage.getItem(PROG_KEY);
    if (!raw) return [];
    const obj = JSON.parse(raw) as Record<string, ProgressEntry>;
    return Object.values(obj)
      .sort((a, b) => b.ts - a.ts)
      .slice(0, 8)
      .map((e) => ({ ...e.snap, progress: e.pct }));
  } catch {
    return [];
  }
}

export function persistTitle(t: Title) {
  try {
    const raw = localStorage.getItem(SAVED_KEY);
    const obj = (raw ? JSON.parse(raw) : {}) as Record<string, Title>;
    obj[titleKey(t)] = t;
    const keys = Object.keys(obj);
    if (keys.length > 200 && keys[0]) delete obj[keys[0]];
    localStorage.setItem(SAVED_KEY, JSON.stringify(obj));
  } catch {
    /* ignore */
  }
}

export function removePersisted(key: string) {
  try {
    const raw = localStorage.getItem(SAVED_KEY);
    if (!raw) return;
    const obj = JSON.parse(raw) as Record<string, Title>;
    delete obj[key];
    localStorage.setItem(SAVED_KEY, JSON.stringify(obj));
  } catch {
    /* ignore */
  }
}

export function readPersisted(): Record<string, Title> {
  try {
    const raw = localStorage.getItem(SAVED_KEY);
    return raw ? (JSON.parse(raw) as Record<string, Title>) : {};
  } catch {
    return {};
  }
}

/* ================= FREE streaming ================= */
export interface StreamServer {
  id: string;
  name: string;
  hint: string;
  movie: (tmdbId: number) => string;
  tv: (tmdbId: number, season: number, episode: number) => string;
}

const NEXSTREAM_BASE = "https://api.codespecters.com";

/** Free embed providers keyed by TMDB id. NexStream (keyed) is primary; if one is down, try the next. */
export const STREAM_SERVERS: StreamServer[] = [
  {
    id: "nexstream",
    name: "NexStream",
    hint: "Ad-free · HD",
    movie: (id) => `${NEXSTREAM_BASE}/embed/movie/${id}?apikey=${getStreamKey()}`,
    tv: (id, s, e) => `${NEXSTREAM_BASE}/embed/tv/${id}/${s}/${e}?apikey=${getStreamKey()}`,
  },
  {
    id: "vidsrc-xyz",
    name: "Nova One",
    hint: "Fast · HD",
    movie: (id) => `https://vidsrc.xyz/embed/movie/${id}`,
    tv: (id, s, e) => `https://vidsrc.xyz/embed/tv/${id}/${s}/${e}`,
  },
  {
    id: "vidsrc-cc",
    name: "Nova Pro",
    hint: "4K · Subtitles",
    movie: (id) => `https://vidsrc.cc/v3/embed/movie/${id}?autoPlay=true`,
    tv: (id, s, e) => `https://vidsrc.cc/v3/embed/tv/${id}/${s}/${e}?autoPlay=true`,
  },
  {
    id: "vidlink",
    name: "VidLink",
    hint: "HD · Fast load",
    movie: (id) => `https://vidlink.pro/movie/${id}`,
    tv: (id, s, e) => `https://vidlink.pro/tv/${id}/${s}/${e}`,
  },
  {
    id: "2embed",
    name: "Mirror",
    hint: "Backup source",
    movie: (id) => `https://www.2embed.cc/embed/${id}`,
    tv: (id, s, e) => `https://www.2embed.cc/embedtv/${id}&s=${s}&e=${e}`,
  },
];

export function buildStreamUrl(
  server: StreamServer,
  kind: "movie" | "series",
  tmdbId: number,
  season = 1,
  episode = 1,
  progressSecs = 0
): string {
  const base = kind === "movie" ? server.movie(tmdbId) : server.tv(tmdbId, season, episode);
  if (server.id === "nexstream" && progressSecs > 0) return `${base}&progress=${progressSecs}`;
  return base;
}

/** Resolve a real TMDB id for any title (local offline entries included). */
export async function resolveStreamId(t: Title, signal?: AbortSignal): Promise<number | null> {
  if (isRemoteTitle(t)) return t.id;
  try {
    const results = await searchTitles(t.title, signal);
    if (results.length === 0) return null;
    const sameType = results.filter((r) => r.type === t.type);
    const pool = sameType.length > 0 ? sameType : results;
    const yearMatch = pool.find((r) => r.year === t.year);
    return (yearMatch ?? pool[0])?.id ?? null;
  } catch {
    return null;
  }
}

export interface TvSeasonInfo {
  season_number: number;
  episode_count: number;
  name: string;
  poster_path: string | null;
  air_date: string;
}

export async function fetchTvSeasons(
  tmdbId: number,
  signal?: AbortSignal
): Promise<TvSeasonInfo[]> {
  const data = await get<{ seasons?: TvSeasonInfo[] }>(`/tv/${tmdbId}`, { language: "en-US" }, signal);
  return (data.seasons || []).filter((s) => s.season_number >= 0 && s.episode_count > 0);
}

export interface TvEpisodeInfo {
  episode_number: number;
  name: string;
  overview: string;
  still_path: string | null;
  runtime: number | null;
  vote_average: number;
  air_date: string;
}

export async function fetchSeasonEpisodes(
  tmdbId: number,
  season: number,
  signal?: AbortSignal
): Promise<TvEpisodeInfo[]> {
  const data = await get<{ episodes?: TvEpisodeInfo[] }>(
    `/tv/${tmdbId}/season/${season}`,
    { language: "en-US" },
    signal
  );
  return data.episodes || [];
}
