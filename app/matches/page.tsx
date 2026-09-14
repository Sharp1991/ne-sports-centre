import Header from "@/components/Header";
import { supabase } from "@/lib/supabase";

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

        {/* Upcoming */}
        <section className="mt-10">
          <div className="flex items-end justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-sky-600">
                Fixtures
              </p>

              <h2 className="mt-1 text-2xl font-black text-slate-900">
                Upcoming Matches
              </h2>
            </div>
          </div>

          <div className="mt-5 space-y-3">
            {upcoming.length === 0 ? (
              <div className="rounded-2xl border border-sky-100 bg-white p-8 text-center text-sm text-slate-400">
                No upcoming matches.
              </div>
            ) : (
              upcoming.map((match) => (
                <MatchRow key={match.id} match={match} />
              ))
            )}
          </div>
        </section>

        {/* Results */}
        <section className="mt-12">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-sky-600">
              Results
            </p>

            <h2 className="mt-1 text-2xl font-black text-slate-900">
              Recent Results
            </h2>
          </div>

          <div className="mt-5 space-y-3">
            {results.length === 0 ? (
              <div className="rounded-2xl border border-sky-100 bg-white p-8 text-center text-sm text-slate-400">
                No results available.
              </div>
            ) : (
              results
                .slice()
                .reverse()
                .slice(0, 20)
                .map((match) => (
                  <MatchRow key={match.id} match={match} />
                ))
            )}
          </div>
        </section>
      </main>
    </>
  );
}

function MatchRow({ match }: { match: any }) {
  const home = match.home_team;
  const away = match.away_team;

  const date = new Date(`${match.date}T${match.time || "00:00:00"}`);

  return (
    <a
      href={`/matches/${match.id}`}
      className="block rounded-2xl border border-sky-100 bg-white p-4 transition hover:border-sky-300 hover:shadow-sm sm:p-5"
    >
      <div className="flex items-center justify-between gap-3">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-sky-600">
            {match.competition}
          </span>

          {match.matchday && (
            <span className="ml-2 text-xs font-medium text-slate-400">
              {match.matchday}
            </span>
          )}
        </div>

        <span className="text-xs font-semibold text-slate-400">
          {date.toLocaleDateString("en-IN", {
            day: "numeric",
            month: "short",
            year: "numeric",
          })}
        </span>
      </div>

      <div className="mt-5 grid grid-cols-[1fr_auto_1fr] items-center gap-3">
        <TeamDisplay team={home} align="right" />

        <div className="min-w-[70px] text-center">
          {match.home_score !== null && match.away_score !== null ? (
            <span className="text-xl font-black text-slate-900">
              {match.home_score} - {match.away_score}
            </span>
          ) : (
            <>
              <span className="block text-sm font-black text-slate-400">
                VS
              </span>

              {match.time && (
                <span className="mt-1 block text-xs font-semibold text-slate-400">
                  {match.time.slice(0, 5)}
                </span>
              )}
            </>
          )}
        </div>

        <TeamDisplay team={away} align="left" />
      </div>

      {match.venue && (
        <div className="mt-4 border-t border-slate-100 pt-3 text-center text-xs text-slate-400">
          {match.venue}
        </div>
      )}
    </a>
  );
}

function TeamDisplay({
  team,
  align,
}: {
  team: any;
  align: "left" | "right";
}) {
  if (!team) {
    return (
      <div className={`text-${align}`}>
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
      <span
        className={`text-sm font-bold text-slate-800 ${
          align === "right" ? "order-1" : "order-2"
        }`}
      >
        {team.short_name || team.name}
      </span>

      {team.crest_url && (
        <img
          src={team.crest_url}
          alt=""
          className={`h-9 w-9 object-contain ${
            align === "right" ? "order-2" : "order-1"
          }`}
        />
      )}
    </div>
  );
}
