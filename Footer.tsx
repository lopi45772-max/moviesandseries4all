import { useState } from "react";
import { Check, Clapperboard, Mail, Send } from "lucide-react";
import type { View } from "./Navbar";
import { cn } from "../utils/cn";

interface Props {
  onNavigate: (view: View, anchor?: string) => void;
  notify: (msg: string) => void;
  live: boolean;
  onOpenApi: () => void;
}

const XIcon = (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" /></svg>
);
const InstagramIcon = (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="20" x="2" y="2" rx="5" ry="5" /><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" /><line x1="17.5" x2="17.51" y1="6.5" y2="6.5" /></svg>
);
const FacebookIcon = (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" /></svg>
);
const YoutubeIcon = (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2.5 17a24.12 24.12 0 0 1 0-10 2 2 0 0 1 1.4-1.4 49.56 49.56 0 0 1 16.2 0A2 2 0 0 1 21.5 7a24.12 24.12 0 0 1 0 10 2 2 0 0 1-1.4 1.4 49.55 49.55 0 0 1-16.2 0A2 2 0 0 1 2.5 17" /><path d="m10 15 5-3-5-3z" /></svg>
);

const COLUMNS: { title: string; links: { label: string; view?: View; anchor?: string }[] }[] = [
  {
    title: "Browse",
    links: [
      { label: "Home", view: "home" },
      { label: "Movies", view: "movies" },
      { label: "TV Series", view: "series" },
      { label: "Coming Soon", view: "home", anchor: "coming-soon" },
      { label: "My List", view: "mylist" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About us" },
      { label: "Careers" },
      { label: "Press" },
      { label: "Investors" },
      { label: "Gift cards" },
    ],
  },
  {
    title: "Support",
    links: [
      { label: "Help center" },
      { label: "Supported devices" },
      { label: "Accessibility" },
      { label: "Contact us" },
      { label: "Status" },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Privacy policy" },
      { label: "Terms of use" },
      { label: "Cookie preferences" },
      { label: "Corporate info" },
    ],
  },
];

export default function Footer({ onNavigate, notify, live, onOpenApi }: Props) {
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);

  const subscribe = () => {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      notify("Please enter a valid email address");
      return;
    }
    setSubscribed(true);
    notify("Subscribed — premiere news incoming!");
  };

  return (
    <footer className="border-t border-line bg-coal">
      {/* Newsletter band */}
      <div className="border-b border-line">
        <div className="mx-auto flex max-w-7xl flex-col items-center gap-5 px-4 py-10 sm:px-6 lg:flex-row lg:justify-between">
          <div className="text-center lg:text-left">
            <p className="flex items-center justify-center gap-2 font-display text-xl font-800 text-white lg:justify-start">
              <Mail size={19} className="text-ember" /> Never miss a premiere
            </p>
            <p className="mt-1 text-sm text-zinc-500">
              One email a week. New releases, hidden gems and exclusive drops.
            </p>
          </div>
          {subscribed ? (
            <p className="flex items-center gap-2 rounded-full bg-emerald-500/12 px-5 py-3 text-sm font-bold text-emerald-400 ring-1 ring-emerald-500/30">
              <Check size={16} /> You're on the list — check your inbox!
            </p>
          ) : (
            <div className="flex w-full max-w-md gap-2">
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && subscribe()}
                type="email"
                placeholder="you@example.com"
                className="w-full rounded-full border border-line bg-panel px-5 py-3 text-sm text-white outline-none placeholder:text-zinc-600 focus:border-ember"
              />
              <button
                onClick={subscribe}
                className="flex shrink-0 items-center gap-2 rounded-full bg-ember px-6 py-3 text-sm font-bold text-white transition hover:bg-red-700 active:scale-95"
              >
                <Send size={14} /> <span className="hidden sm:inline">Subscribe</span>
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
        <div className="grid gap-10 lg:grid-cols-[1.3fr_2fr]">
          <div>
            <span className="flex items-center gap-2.5">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-ember">
                <Clapperboard size={20} className="text-white" />
              </span>
              <span className="font-display text-2xl font-800 tracking-tight text-white">
                Cine<span className="text-ember">Nova</span>
              </span>
            </span>
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-zinc-500">
              The universe of stories. Stream thousands of movies and series in stunning 4K HDR
              with Dolby Atmos — on any screen, anywhere.
            </p>
            <div className="mt-5 flex gap-2.5">
              {[
                { icon: XIcon, label: "X" },
                { icon: InstagramIcon, label: "Instagram" },
                { icon: FacebookIcon, label: "Facebook" },
                { icon: YoutubeIcon, label: "YouTube" },
              ].map((s) => (
                <button
                  key={s.label}
                  aria-label={s.label}
                  onClick={() => notify(`Opening CineNova on ${s.label}…`)}
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-panel text-zinc-400 ring-1 ring-line transition hover:bg-ember hover:text-white hover:ring-ember"
                >
                  {s.icon}
                </button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
            {COLUMNS.map((col) => (
              <div key={col.title}>
                <p className="text-[11px] font-bold tracking-[0.2em] text-zinc-600 uppercase">{col.title}</p>
                <ul className="mt-4 space-y-2.5">
                  {col.links.map((l) => (
                    <li key={l.label}>
                      <button
                        onClick={() => (l.view ? onNavigate(l.view, l.anchor) : notify(`${l.label} — coming right up!`))}
                        className="text-[13px] font-medium text-zinc-400 transition hover:text-white"
                      >
                        {l.label}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-line pt-6 sm:flex-row">
          <div className="text-center sm:text-left">
            <p className="text-xs font-medium text-zinc-600">© 2026 CineNova Entertainment. All rights reserved. Made for movie lovers.</p>
            <p className="mt-1 text-[11px] text-zinc-700">
              Movie data, artwork & trailers by{" "}
              <a href="https://www.themoviedb.org" target="_blank" rel="noreferrer" className="font-bold text-zinc-500 hover:text-white">
                TMDB
              </a>
              . This product is not endorsed or certified by TMDB.
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-2">
            {["4K ULTRA HD", "DOLBY ATMOS", "HDR10"].map((b) => (
              <span key={b} className="rounded-md border border-line px-2 py-1 text-[10px] font-800 tracking-wider text-zinc-500">
                {b}
              </span>
            ))}
            <button
              onClick={onOpenApi}
              title="TMDB API settings"
              className="flex items-center gap-2 rounded-full border border-line bg-panel px-3.5 py-1.5 text-[11px] font-bold text-zinc-400 transition hover:border-zinc-500 hover:text-white"
            >
              <span className={cn("h-1.5 w-1.5 rounded-full", live ? "bg-emerald-400" : "bg-amber-400")} />
              TMDB {live ? "Connected" : "Offline"}
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
}
