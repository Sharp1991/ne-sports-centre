"use client";

import { usePathname } from "next/navigation";
import { useState } from "react";

const navItems = [
  { label: "Home", href: "/" },
  { label: "About", href: "/about" },
  { label: "News", href: "/articles" },
  { label: "Standings", href: "/standings" },
  { label: "Leagues & Cups", href: "/competitions" },
];

export default function Header() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-slate-800 bg-slate-950/95 shadow-[0_4px_20px_rgba(2,6,23,0.18)] backdrop-blur">
      <div className="mx-auto max-w-7xl px-5">
        <div className="flex h-[68px] items-center justify-between">
          {/* Brand */}
          <a href="/" className="group flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-xl transition">
              <img
                src="/logo.png"
                alt="Highland Football"
                className="h-full w-full object-contain"
              />
            </div>

            <div>
              <div className="text-[15px] font-black tracking-tight text-white sm:text-base">
                HIGHLAND FOOTBALL
              </div>

              <div className="mt-0.5 text-[8px] font-black uppercase tracking-[0.22em] text-sky-400">
                FOOTBALL · STORIES · DATA
              </div>
            </div>
          </a>

          {/* Desktop */}
          <div className="hidden items-center gap-6 md:flex">
            <nav className="flex items-center gap-1">
              {navItems.map((item) => (
                <a
                  key={item.label}
                  href={item.href}
                  className={`relative rounded-lg px-4 py-2.5 text-sm font-bold transition ${
                    pathname === item.href ||
                    (item.href !== "/" && pathname.startsWith(item.href))
                      ? "text-white"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  {item.label}
                  {(pathname === item.href ||
                    (item.href !== "/" && pathname.startsWith(item.href))) && (
                    <span className="absolute inset-x-4 -bottom-[9px] h-0.5 rounded-full bg-sky-400" />
                  )}
                </a>
              ))}
            </nav>


          </div>

          {/* Mobile menu */}
          <button
            type="button"
            onClick={() => setOpen(!open)}
            aria-label="Toggle navigation"
            aria-expanded={open}
            className="rounded-xl border border-slate-700 bg-white/5 px-3 py-2 text-xl font-bold text-sky-400 transition hover:border-sky-400/40 hover:bg-sky-400/10 md:hidden"
          >
            {open ? "×" : "☰"}
          </button>
        </div>
      </div>

      {/* Mobile navigation */}
      {open && (
        <div className="border-t border-slate-800 bg-slate-950 px-5 py-3 shadow-xl md:hidden">
          <nav className="space-y-1">
            {navItems.map((item) => (
              <a
                key={item.label}
                href={item.href}
                onClick={() => setOpen(false)}
                className="block rounded-xl px-4 py-3 text-sm font-bold text-slate-300 transition hover:bg-sky-500/10 hover:text-sky-400"
              >
                {item.label}
              </a>
            ))}


          </nav>
        </div>
      )}
    </header>
  );
}
