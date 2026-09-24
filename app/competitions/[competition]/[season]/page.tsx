import Header from "@/components/Header";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

export default async function SeasonPage({
  params,
}: {
  params: Promise<{ competition: string; season: string }>;
}) {
  const {
    competition: encodedCompetition,
    season: encodedSeason,
  } = await params;

  const competition = decodeURIComponent(encodedCompetition);
  const season = decodeURIComponent(encodedSeason);

  const { data: matches } = await supabase
    .from("matches")
    .select("id, home_team_id, away_team_id")
    .eq("competition", competition)
    .eq("season", season);

  const allMatches = (matches || []) as any[];

  const matchCount = allMatches.length;

  const sections = [
    {
      title: "Matches",
      description: "Upcoming fixtures and scheduled matches.",
      href: `/competitions/${encodeURIComponent(competition)}/${encodeURIComponent(season)}/matches`,
      label: "View matches →",
    },
    {
      title: "Standings",
      description: "League table, points and team records.",
      href: `/competitions/${encodeURIComponent(competition)}/${encodeURIComponent(season)}/standings`,
      label: "View standings →",
    },

  ];

  return (
    <>
      <Header />
      <main className="min-h-screen bg-sky-50">
      <section className="border-b border-sky-100 bg-white">
        <div className="mx-auto max-w-7xl px-5 py-10">
          <Link
            href={`/competitions/${encodeURIComponent(competition)}`}
            className="text-xs font-black uppercase tracking-widest text-sky-600 hover:text-sky-800"
          >
            ← {competition}
          </Link>

          <p className="mt-6 text-xs font-black uppercase tracking-[0.2em] text-sky-600">
            Competition season
          </p>

          <h1 className="mt-2 text-4xl font-black tracking-tight text-slate-900 sm:text-5xl">
            {season}
          </h1>

          <p className="mt-3 text-sm text-slate-500">
            {competition}
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
          </div>

            <div className="rounded-xl border border-sky-100 bg-sky-50 px-4 py-3">
              <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                Teams
              </p>
              <p className="mt-1 text-xl font-black text-slate-900">
                {teamCount}
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-10 sm:py-14">
        <div className="mb-7">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-sky-600">
            Season centre
          </p>

          <h2 className="mt-1 text-2xl font-black text-slate-900 sm:text-3xl">
            Explore {season}
          </h2>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          {sections.map((section) => (
            <Link
              key={section.title}
              href={section.href}
              className="group rounded-3xl border border-sky-100 bg-white p-7 transition hover:-translate-y-1 hover:border-sky-300 hover:shadow-lg"
            >
              <div className="flex items-start justify-between gap-5">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-sky-600">
                    {section.title}
                  </p>

                  <h3 className="mt-2 text-2xl font-black text-slate-900 group-hover:text-sky-700">
                    {section.title}
                  </h3>

                  <p className="mt-3 max-w-md text-sm leading-6 text-slate-500">
                    {section.description}
                  </p>
                </div>

                <span className="text-2xl font-black text-sky-300 transition group-hover:translate-x-1 group-hover:text-sky-600">
                  →
                </span>
              </div>

              <p className="mt-7 text-xs font-black uppercase tracking-wider text-sky-600">
                {section.label}
              </p>
            </Link>
          ))}
        </div>
      </section>
      </main>
    </>
  );
}
