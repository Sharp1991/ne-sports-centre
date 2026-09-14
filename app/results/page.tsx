import Header from "@/components/Header";
import { supabase } from "@/lib/supabase";

export default async function ResultsPage() {
  const { data: matches, error } = await supabase
    .from("matches")
    .select(`
      id,
      competition,
      season,
      matchday,
      date,
      venue,
      home_score,
      away_score,
      status,
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
    .order("date", { ascending: false });

  const results =
    matches?.filter(
      (match) =>
        match.home_score !== null &&
        match.away_score !== null
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
            Results
          </h1>

          <p className="mt-3 max-w-2xl text-slate-600">
            Football results from competitions across Northeast India.
          </p>
        </div>

        <section className="mt-10">
          {error ? (
            <div className="rounded-2xl border border-red-100 bg-red-50 p-6 text-sm text-red-600">
              Unable to load results.
            </div>
          ) : results.length === 0 ? (
            <div className="rounded-2xl border border-sky-100 bg-white p-10 text-center text-slate-400">
              No results available.
            </div>
          ) : (
            <div className="space-y-8">
              {results.map((match) => (
                <ResultCard key={match.id} match={match} />
              ))}
            </div>
          )}
        </section>
      </main>
    </>
  );
}

function ResultCard({ match }: { match: any }) {
  const home = match.home_team;
  const away = match.away_team;

  return (
    <a
      href={`/matches/${match.id}`}
      className="block rounded-2xl border border-sky-100 bg-white p-5 transition hover:border-sky-300 hover:shadow-sm"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-sky-600">
            {match.competition}
          </span>

          {match.season && (
            <span className="ml-2 text-xs text-slate-400">
              {match.season}
            </span>
          )}
        </div>

        <span className="text-xs font-semibold text-slate-400">
          {new Date(match.date).toLocaleDateString("en-IN", {
            day: "numeric",
            month: "short",
            year: "numeric",
          })}
        </span>
      </div>

      <div className="mt-6 grid grid-cols-[1fr_auto_1fr] items-center gap-4">
        <Team team={home} align="right" />

        <div className="text-center">
          <div className="text-2xl font-black tracking-tight text-slate-900">
            {match.home_score} - {match.away_score}
          </div>

          <div className="mt-1 text-[10px] font-bold uppercase tracking-widest text-slate-400">
            Final
          </div>
        </div>

        <Team team={away} align="left" />
      </div>

      {match.venue && (
        <div className="mt-5 border-t border-slate-100 pt-3 text-center text-xs text-slate-400">
          {match.venue}
        </div>
      )}
    </a>
  );
}

function Team({
  team,
  align,
}: {
  team: any;
  align: "left" | "right";
}) {
  if (!team) {
    return (
      <div
        className={
          align === "right" ? "text-right" : "text-left"
        }
      >
        <span className="text-sm font-bold text-slate-400">
          TBD
        </span>
      </div>
    );
  }

  return (
    <div
      className={`flex items-center gap-3 ${
        align === "right" ? "justify-end" : "justify-start"
      }`}
    >
      {align === "right" && (
        <span className="text-sm font-bold text-slate-800">
          {team.short_name || team.name}
        </span>
      )}

      {team.crest_url && (
        <img
          src={team.crest_url}
          alt=""
          className="h-10 w-10 object-contain"
        />
      )}

      {align === "left" && (
        <span className="text-sm font-bold text-slate-800">
          {team.short_name || team.name}
        </span>
      )}
    </div>
  );
}
