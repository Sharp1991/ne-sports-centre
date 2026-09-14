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
  return (
    <header className="sticky top-0 z-50 border-b border-sky-100 bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4">
        <a href="/" className="shrink-0">
          <div className="text-xl font-black tracking-tight text-sky-600">
            NE SPORTS CENTRE
          </div>

          <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">
            Northeast India
          </div>
        </a>

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
        </nav>

        <button
          type="button"
          className="rounded-lg bg-sky-500 px-4 py-2 text-sm font-bold text-white transition hover:bg-sky-600"
        >
          Search
        </button>
      </div>
    </header>
  );
}
