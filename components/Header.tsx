"use client";

import { useState } from "react";

const navItems = [
  { label: "Home", href: "/" },
  { label: "News", href: "/articles" },
  { label: "Matches", href: "/matches" },
  { label: "Results", href: "/results" },
  { label: "Standings", href: "/standings" },
  { label: "Teams", href: "/teams" },
];

const moreItems = [
  { label: "Competitions", href: "/competitions" },
  { label: "History", href: "/history" },
  { label: "About", href: "/about" },
];

export default function Header() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-sky-100 bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-3 sm:py-4">
        <a href="/" className="shrink-0">
          <div className="text-lg font-black tracking-tight text-sky-600 sm:text-xl">
            NE SPORTS CENTRE
          </div>

          <div className="text-[9px] font-bold uppercase tracking-[0.2em] text-slate-400 sm:text-[10px]">
            Northeast India
          </div>
        </a>

        {/* Desktop navigation */}
        <nav className="hidden items-center gap-6 md:flex">
          {navItems.map((item) => (
            <a
              key={item.label}
              href={item.href}
              className="text-sm font-semibold text-slate-600 transition hover:text-sky-600"
            >
              {item.label}
            </a>
          ))}

          <div className="group relative">
            <button
              type="button"
              className="flex items-center gap-1 text-sm font-semibold text-slate-600 transition hover:text-sky-600"
            >
              More
              <span className="text-xs">▾</span>
            </button>

            <div className="invisible absolute right-0 top-full mt-3 w-44 translate-y-1 rounded-xl border border-sky-100 bg-white p-2 opacity-0 shadow-lg transition-all group-hover:visible group-hover:translate-y-0 group-hover:opacity-100">
              {moreItems.map((item) => (
                <a
                  key={item.label}
                  href={item.href}
                  className="block rounded-lg px-3 py-2.5 text-sm font-semibold text-slate-600 hover:bg-sky-50 hover:text-sky-600"
                >
                  {item.label}
                </a>
              ))}
            </div>
          </div>

          <button
            type="button"
            className="rounded-lg bg-sky-500 px-4 py-2 text-sm font-bold text-white transition hover:bg-sky-600"
          >
            Search
          </button>
        </nav>

        {/* Mobile menu button */}
        <button
          type="button"
          onClick={() => setOpen(!open)}
          aria-label="Toggle navigation"
          aria-expanded={open}
          className="rounded-lg border border-sky-100 px-3 py-2 text-xl font-bold text-sky-600 md:hidden"
        >
          {open ? "×" : "☰"}
        </button>
      </div>

      {/* Mobile navigation */}
      {open && (
        <div className="border-t border-sky-100 bg-white px-5 py-3 md:hidden">
          <nav className="space-y-1">
            {navItems.map((item) => (
              <a
                key={item.label}
                href={item.href}
                onClick={() => setOpen(false)}
                className="block rounded-lg px-3 py-3 text-sm font-bold text-slate-700 hover:bg-sky-50 hover:text-sky-600"
              >
                {item.label}
              </a>
            ))}

            <div className="border-t border-slate-100 pt-2">
              <p className="px-3 py-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
                More
              </p>

              {moreItems.map((item) => (
                <a
                  key={item.label}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className="block rounded-lg px-3 py-2.5 text-sm font-semibold text-slate-600 hover:bg-sky-50 hover:text-sky-600"
                >
                  {item.label}
                </a>
              ))}
            </div>

            <button
              type="button"
              className="mt-2 w-full rounded-lg bg-sky-500 px-4 py-3 text-sm font-bold text-white"
            >
              Search
            </button>
          </nav>
        </div>
      )}
    </header>
  );
}
