import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { BadgePercent, Check, Crown, Minus, MonitorPlay, Plus, Smartphone, Sparkles, Tv } from "lucide-react";
import { cn } from "../utils/cn";

const PLANS = [
  {
    id: "basic",
    name: "Basic",
    icon: <Smartphone size={18} />,
    monthly: 6.99,
    yearly: 69,
    tagline: "Casual watching on one screen",
    features: ["HD 720p quality", "1 screen at a time", "Mobile & tablet", "Limited ads", "Cancel anytime"],
    cta: "Choose Basic",
    highlight: false,
  },
  {
    id: "standard",
    name: "Standard",
    icon: <Tv size={18} />,
    monthly: 11.99,
    yearly: 119,
    tagline: "The sweet spot for households",
    features: ["Full HD 1080p quality", "2 screens at a time", "All devices + TV apps", "Ad-free experience", "Offline downloads", "Cancel anytime"],
    cta: "Choose Standard",
    highlight: true,
  },
  {
    id: "premium",
    name: "Premium",
    icon: <Crown size={18} />,
    monthly: 16.99,
    yearly: 169,
    tagline: "Cinema-grade 4K experience",
    features: ["4K Ultra HD + HDR + Atmos", "4 screens at a time", "All devices + TV apps", "Ad-free experience", "Offline downloads", "Early access premieres", "Cancel anytime"],
    cta: "Choose Premium",
    highlight: false,
  },
];

const FAQS = [
  {
    q: "What is CineNova?",
    a: "CineNova is a streaming universe with thousands of movies and series in up to 4K HDR. Browse curated collections, build your watchlist, get premiere reminders and pick up watching on any device.",
  },
  {
    q: "Can I download titles to watch offline?",
    a: "Yes — Standard and Premium plans include offline downloads on mobile and tablet. Premium members get priority 4K downloads with Dolby Atmos audio.",
  },
  {
    q: "How many devices can I use at once?",
    a: "Basic supports 1 screen, Standard supports 2, and Premium supports 4 simultaneous streams across phones, tablets, smart TVs, consoles and browsers.",
  },
  {
    q: "Can I share my account with family?",
    a: "Absolutely. Every plan supports up to 5 profiles with individual watchlists, recommendations, maturity ratings and kids-safe mode.",
  },
  {
    q: "How do I cancel?",
    a: "There are no contracts. Cancel in two clicks from your account page — you keep access until the end of your billing period, and your list stays saved for a year.",
  },
];

export function Pricing({ notify }: { notify: (msg: string) => void }) {
  const [billing, setBilling] = useState<"monthly" | "yearly">("yearly");

  return (
    <section id="premium" className="mx-auto max-w-7xl scroll-mt-24 px-4 py-16 sm:px-6">
      <div className="text-center">
        <p className="inline-flex items-center gap-1.5 rounded-full bg-gold/12 px-4 py-1.5 text-[11px] font-bold tracking-[0.2em] text-gold uppercase ring-1 ring-gold/30">
          <Sparkles size={13} /> CineNova Premium
        </p>
        <h2 className="mx-auto mt-3 max-w-2xl font-display text-3xl font-900 tracking-tight text-white sm:text-5xl">
          One subscription. Every story ever told.
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-[15px] text-zinc-400">
          Stream in stunning 4K, download for offline, and never see an ad again. Cancel anytime.
        </p>

        {/* Billing selector */}
        <div className="mt-6 inline-flex items-center rounded-full bg-panel p-1.5 ring-1 ring-line">
          {(["monthly", "yearly"] as const).map((b) => (
            <button
              key={b}
              onClick={() => setBilling(b)}
              className={cn(
                "relative flex items-center gap-2 rounded-full px-6 py-2.5 text-sm font-bold transition",
                billing === b ? "text-white" : "text-zinc-500 hover:text-zinc-200"
              )}
            >
              {billing === b && (
                <motion.span
                  layoutId="billing-pill"
                  className="absolute inset-0 rounded-full bg-ember shadow-lg shadow-ember/30"
                  transition={{ type: "spring", stiffness: 420, damping: 32 }}
                />
              )}
              <span className="relative z-10 flex items-center gap-2">
                {b === "monthly" ? "Monthly" : "Yearly"}
                {b === "yearly" && (
                  <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-900", billing === "yearly" ? "bg-white text-ember" : "bg-gold/20 text-gold")}>
                    −20%
                  </span>
                )}
              </span>
            </button>
          ))}
        </div>
      </div>

      <div className="mt-10 grid gap-5 lg:grid-cols-3">
        {PLANS.map((p, i) => (
          <motion.div
            key={p.id}
            initial={{ opacity: 0, y: 22 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.08 }}
            className={cn(
              "relative flex flex-col rounded-3xl border p-7 transition",
              p.highlight
                ? "border-ember bg-panel shadow-2xl shadow-ember/15 lg:scale-[1.04]"
                : "border-line bg-coal hover:border-zinc-600"
            )}
          >
            {p.highlight && (
              <span className="absolute -top-3.5 left-1/2 flex -translate-x-1/2 items-center gap-1.5 rounded-full bg-ember px-4 py-1.5 text-[11px] font-900 tracking-widest whitespace-nowrap text-white uppercase shadow-lg">
                <BadgePercent size={12} /> Most popular
              </span>
            )}
            <div className="flex items-center gap-3">
              <span className={cn("flex h-11 w-11 items-center justify-center rounded-2xl", p.highlight ? "bg-ember text-white" : "bg-panel2 text-zinc-300 ring-1 ring-line")}>
                {p.icon}
              </span>
              <div>
                <p className="font-display text-lg font-800 text-white">{p.name}</p>
                <p className="text-xs text-zinc-500">{p.tagline}</p>
              </div>
            </div>
            <div className="mt-5 flex items-end gap-1.5">
              <AnimatePresence mode="wait">
                <motion.span
                  key={billing}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className="font-display text-5xl font-900 text-white"
                >
                  ${billing === "monthly" ? p.monthly : p.yearly}
                </motion.span>
              </AnimatePresence>
              <span className="pb-1.5 text-sm font-medium text-zinc-500">/{billing === "monthly" ? "mo" : "yr"}</span>
            </div>
            <ul className="mt-5 flex-1 space-y-2.5 border-t border-line pt-5">
              {p.features.map((f) => (
                <li key={f} className="flex items-start gap-2.5 text-[13px] font-medium text-zinc-300">
                  <span className={cn("mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full", p.highlight ? "bg-ember text-white" : "bg-emerald-500/15 text-emerald-400")}>
                    <Check size={11} strokeWidth={3} />
                  </span>
                  {f}
                </li>
              ))}
            </ul>
            <button
              onClick={() => notify(`${p.name} plan selected — welcome aboard!`)}
              className={cn(
                "mt-6 w-full rounded-full py-3.5 font-display text-[15px] font-bold transition active:scale-[0.98]",
                p.highlight ? "bg-ember text-white shadow-xl shadow-ember/25 hover:bg-red-700" : "bg-panel2 text-white ring-1 ring-line hover:bg-line"
              )}
            >
              {p.cta}
            </button>
          </motion.div>
        ))}
      </div>

      <p className="mt-6 flex items-center justify-center gap-2 text-center text-xs font-medium text-zinc-600">
        <MonitorPlay size={14} /> 30-day money-back guarantee · No contracts · Switch or cancel anytime
      </p>
    </section>
  );
}

export function Faq() {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <section className="mx-auto max-w-3xl px-4 pb-16 sm:px-6">
      <h2 className="text-center font-display text-3xl font-900 tracking-tight text-white">
        Frequently asked questions
      </h2>
      <div className="mt-7 space-y-2.5">
        {FAQS.map((f, i) => {
          const isOpen = open === i;
          return (
            <div
              key={f.q}
              className={cn(
                "overflow-hidden rounded-2xl border transition",
                isOpen ? "border-ember/50 bg-panel" : "border-line bg-coal hover:border-zinc-600"
              )}
            >
              <button
                onClick={() => setOpen(isOpen ? null : i)}
                className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
              >
                <span className="font-display text-[15px] font-bold text-white">{f.q}</span>
                <span className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition", isOpen ? "bg-ember text-white" : "bg-panel2 text-zinc-400")}>
                  {isOpen ? <Minus size={15} /> : <Plus size={15} />}
                </span>
              </button>
              <AnimatePresence initial={false}>
                {isOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25 }}
                  >
                    <p className="px-5 pb-5 text-sm leading-relaxed text-zinc-400">{f.a}</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </section>
  );
}
