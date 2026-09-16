export const dynamic = "force-dynamic";
import Link from "next/link";
import Header from "@/components/Header";
import MatchCalendar from "@/components/MatchCalendar";
import { supabase } from "@/lib/supabase";

export default async function MatchesPage({
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
    .select(`
      id,
      competition,
      season,
      date,
      time,
      home_score,
      away_score,
      home_team:teams!matches_home_team_id_fkey (
        id,
        name,
        short_name,
        crest_url
      ),
      away_team:teams!matches_away_team_id_fkey (
        id,
        name,
        short_name,
        crest_url
      )
    `)
    .eq("competition", competition)
    .eq("season", season)
    .order("date", { ascending: true });

  const allMatches = (matches || []) as any[];

  return (
    <>
      <Header />

      <main className="min-h-screen bg-sky-50">
        <section className="border-b border-sky-100 bg-white">
          <div className="mx-auto max-w-7xl px-5 py-10 sm:py-14">
            <Link
              href={`/competitions/${encodeURIComponent(competition)}/${encodeURIComponent(season)}`}
              className="text-xs font-black uppercase tracking-widest text-sky-600 hover:text-sky-800"
            >
              ← {competition} · {season}
            </Link>

            <p className="mt-6 text-xs font-black uppercase tracking-[0.2em] text-sky-600">
              Matches
            </p>

            <h1 className="mt-2 text-4xl font-black tracking-tight text-slate-900 sm:text-5xl">
              {competition}
            </h1>

            <p className="mt-2 text-sm font-bold text-slate-500">
              {season}
            </p>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-5 py-8 sm:py-12">
          <MatchCalendar matches={allMatches} />
        </section>
      </main>
    </>
  );
}
