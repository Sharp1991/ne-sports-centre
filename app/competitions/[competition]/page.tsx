import Header from "@/components/Header";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

export default async function CompetitionPage({
  params,
}: {
  params: Promise<{ competition: string }>;
}) {
  const { competition: encodedCompetition } = await params;
  const competition = decodeURIComponent(encodedCompetition);

  const { data: matches } = await supabase
    .from("matches")
    .select("season")
    .eq("competition", competition);

  const allMatches = (matches || []) as any[];

  const seasons = [...new Set(
    allMatches
      .map((match) => match.season)
      .filter(Boolean)
  )];

  return (
    <>
      <Header />

      <main className="min-h-screen bg-sky-50">
        <section className="border-b border-sky-100 bg-white">
          <div className="mx-auto max-w-7xl px-5 py-10 sm:py-14">
            <Link
              href="/competitions"
              className="text-xs font-black uppercase tracking-widest text-sky-600 hover:text-sky-800"
            >
              ← Competitions
            </Link>

            <p className="mt-6 text-xs font-black uppercase tracking-[0.2em] text-sky-600">
              Competition
            </p>

            <h1 className="mt-2 text-4xl font-black tracking-tight text-slate-900 sm:text-5xl">
              {competition}
            </h1>

            <p className="mt-3 text-sm text-slate-500">
              Select a season to explore matches, results, standings and teams.
            </p>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-5 py-10 sm:py-14">
          <div className="mb-7">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-sky-600">
              Seasons
            </p>

            <h2 className="mt-1 text-2xl font-black text-slate-900 sm:text-3xl">
              Choose a season
            </h2>
          </div>

          {seasons.length > 0 ? (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {seasons.map((season) => (
                <Link
                  key={season}
                  href={`/competitions/${encodeURIComponent(
                    competition
                  )}/${encodeURIComponent(season)}`}
                  className="group rounded-3xl border border-sky-100 bg-white p-7 transition hover:-translate-y-1 hover:border-sky-300 hover:shadow-lg"
                >
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-sky-600">
                    Season
                  </p>

                  <h3 className="mt-2 text-3xl font-black text-slate-900 group-hover:text-sky-700">
                    {season}
                  </h3>

                  <p className="mt-3 text-sm text-slate-500">
                    Matches, results, standings and participating teams.
                  </p>

                  <p className="mt-7 text-xs font-black uppercase tracking-wider text-sky-600">
                    View season →
                  </p>
                </Link>
              ))}
            </div>
          ) : (
            <div className="rounded-3xl border border-sky-100 bg-white p-8">
              <p className="text-sm text-slate-500">
                No seasons are available for this competition yet.
              </p>
            </div>
          )}
        </section>
      </main>
    </>
  );
}
