import Link from "next/link";
import Header from "@/components/Header";
import { supabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type CompetitionSeason = {
  competition: string;
  season: string;
  matchCount: number;
};

export default async function StandingsPage() {
  const { data: matches } = await supabase
    .from("matches")
    .select("competition, season")
    .eq("status", "finished");

  const groups = new Map<string, CompetitionSeason>();

  for (const match of matches || []) {
    if (!match.competition || !match.season) continue;

    const key = `${match.competition}|||${match.season}`;
    const existing = groups.get(key);

    if (existing) {
      existing.matchCount++;
    } else {
      groups.set(key, {
        competition: match.competition,
        season: match.season,
        matchCount: 1,
      });
    }
  }

  const standings = [...groups.values()].sort((a, b) => {
    const competitionCompare =
      a.competition.localeCompare(b.competition);

    if (competitionCompare !== 0) {
      return competitionCompare;
    }

    return b.season.localeCompare(a.season);
  });

  return (
    <>
      <Header />

      <main className="min-h-screen bg-sky-50">
        <section className="border-b border-sky-100 bg-white">
          <div className="mx-auto max-w-7xl px-5 py-10 sm:py-14">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-sky-600">
              Highland Football
            </p>

            <h1 className="mt-2 text-4xl font-black tracking-tight text-slate-900 sm:text-5xl">
              Standings
            </h1>

            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-500">
              Select a competition and season to view the
              league table and top scorers.
            </p>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-5 py-8 sm:py-12">
          {standings.length === 0 ? (
            <div className="rounded-2xl border border-sky-100 bg-white p-8 text-center text-sm font-bold text-slate-500">
              No standings available yet.
            </div>
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {standings.map((item) => (
                <Link
                  key={`${item.competition}|||${item.season}`}
                  href={`/competitions/${encodeURIComponent(
                    item.competition
                  )}/${encodeURIComponent(
                    item.season
                  )}/standings`}
                  className="group rounded-3xl border border-sky-100 bg-white p-7 transition hover:-translate-y-1 hover:border-sky-300 hover:shadow-lg"
                >
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-sky-600">
                    {item.competition}
                  </p>

                  <h2 className="mt-2 text-3xl font-black tracking-tight text-slate-900 group-hover:text-sky-700">
                    {item.season}
                  </h2>

                  <div className="mt-5 flex items-center justify-between">
                    <p className="text-xs font-bold text-slate-400">
                      {item.matchCount} completed{" "}
                      {item.matchCount === 1
                        ? "match"
                        : "matches"}
                    </p>

                    <span className="text-sm font-black text-sky-600 transition group-hover:translate-x-1">
                      View standings →
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>
      </main>
    </>
  );
}
