export const dynamic = "force-dynamic";
import Header from "@/components/Header";
import { supabase } from "@/lib/supabase";
import MatchesGroups from "@/components/MatchesGroups";

export default async function MatchesPage() {
  const { data: matches } = await supabase
    .from("matches")
    .select(`
      id,
      competition,
      season,
      matchday,
      date,
      venue,
      home_team_id,
      away_team_id,
      home_score,
      away_score,
      status,
      time,
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
    .order("date", { ascending: true });

  const today = new Date().toISOString().split("T")[0];

  const upcoming =
    matches?.filter(
      (match) => match.date >= today && match.status !== "completed"
    ) || [];

  const results =
    matches?.filter(
      (match) => match.date < today || match.status === "completed"
    ) || [];

  return (
    <>
      <Header />

      <main className="mx-auto max-w-7xl px-5 py-10">
        <div className="border-b border-sky-100 pb-7">
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-sky-600">
            NE Sports Centre
          </p>

          <h1 className="mt-2 text-4xl font-black tracking-tight text-slate-900">
            Matches
          </h1>

          <p className="mt-3 max-w-2xl text-slate-600">
            Fixtures and results from football across Northeast India.
          </p>
        </div>

        <MatchesGroups
          upcoming={upcoming}
          results={results}
        />
      </main>
    </>
  );

}

