import Link from "next/link";
import Header from "@/components/Header";
import { supabase } from "@/lib/supabase";

type Team = {
  id: number;
  name: string;
  short_name: string;
  crest_url: string | null;
};

type Match = {
  id: number;
  home_team_id: number | null;
  away_team_id: number | null;
  home_score: number | null;
  away_score: number | null;
};

export default async function StandingsPage({
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
    .select(
      "id, home_team_id, away_team_id, home_score, away_score"
    )
    .eq("competition", competition)
    .eq("season", season)
    .eq("status", "finished")
    .not("home_score", "is", null)
    .not("away_score", "is", null);

  const { data: teams } = await supabase
    .from("teams")
    .select("id, name, short_name, crest_url");

  const allMatches = (matches || []) as Match[];
  const allTeams = (teams || []) as Team[];

  const teamIds = new Set<number>();

  allMatches.forEach((match) => {
    if (match.home_team_id) teamIds.add(match.home_team_id);
    if (match.away_team_id) teamIds.add(match.away_team_id);
  });

  const table = allTeams
    .filter((team) => teamIds.has(team.id))
    .map((team) => ({
      team,
      played: 0,
      wins: 0,
      draws: 0,
      losses: 0,
      goalsFor: 0,
      goalsAgainst: 0,
      points: 0,
    }));

  const tableMap = new Map(
    table.map((row) => [row.team.id, row])
  );

  allMatches.forEach((match) => {
    if (
      match.home_team_id === null ||
      match.away_team_id === null ||
      match.home_score === null ||
      match.away_score === null
    ) {
      return;
    }

    const home = tableMap.get(match.home_team_id);
    const away = tableMap.get(match.away_team_id);

    if (!home || !away) return;

    home.played += 1;
    away.played += 1;

    home.goalsFor += match.home_score;
    home.goalsAgainst += match.away_score;

    away.goalsFor += match.away_score;
    away.goalsAgainst += match.home_score;

    if (match.home_score > match.away_score) {
      home.wins += 1;
      home.points += 3;
      away.losses += 1;
    } else if (match.home_score < match.away_score) {
      away.wins += 1;
      away.points += 3;
      home.losses += 1;
    } else {
      home.draws += 1;
      away.draws += 1;
      home.points += 1;
      away.points += 1;
    }
  });

  table.sort((a, b) => {
    const gdA = a.goalsFor - a.goalsAgainst;
    const gdB = b.goalsFor - b.goalsAgainst;

    return (
      b.points - a.points ||
      gdB - gdA ||
      b.goalsFor - a.goalsFor ||
      a.team.name.localeCompare(b.team.name)
    );
  });

  const matchIds = allMatches.map((match) => match.id);

  const { data: goalEvents } = matchIds.length
    ? await supabase
        .from("match_events")
        .select("match_id, team_id, player_id, player_name_raw, type")
        .in("match_id", matchIds)
    : { data: [] };

  const playerIds = [
    ...new Set(
      (goalEvents || [])
        .filter(
          (event: any) =>
            event.type?.toLowerCase() === "goal" &&
            event.player_id !== null
        )
        .map((event: any) => event.player_id)
    ),
  ];

  const { data: scorerPlayers } = playerIds.length
    ? await supabase
        .from("players")
        .select("id, name, team_id, photo_url")
        .in("id", playerIds)
    : { data: [] };

  const playerMap = new Map(
    (scorerPlayers || []).map((player: any) => [
      player.id,
      player,
    ])
  );

  const scorerMap = new Map<
    string,
    {
      name: string;
      teamId: number | null;
      goals: number;
      photoUrl: string | null;
    }
  >();

  (goalEvents || [])
    .filter(
      (event: any) =>
        event.type?.toLowerCase() === "goal" &&
        event.player_id !== null
    )
    .forEach((event: any) => {
      const key = String(event.player_id);
      const existing = scorerMap.get(key);

      if (existing) {
        existing.goals += 1;
      } else {
        const player = playerMap.get(event.player_id);

        scorerMap.set(key, {
          name:
            player?.name ||
            event.player_name_raw ||
            "Unknown Player",
          teamId:
            event.team_id ??
            player?.team_id ??
            null,
          goals: 1,
          photoUrl: player?.photo_url || null,
        });
      }
    });

  const scorers = [...scorerMap.values()]
    .sort(
      (a, b) =>
        b.goals - a.goals ||
        a.name.localeCompare(b.name)
    )
    .slice(0, 20);

  return (
    <>
      <Header />

      <main className="min-h-screen bg-sky-50">
        <section className="border-b border-sky-100 bg-white">
          <div className="mx-auto max-w-7xl px-5 py-10 sm:py-14">
            <Link
              href={`/competitions/${encodeURIComponent(
                competition
              )}/${encodeURIComponent(season)}`}
              className="text-xs font-black uppercase tracking-widest text-sky-600 hover:text-sky-800"
            >
              ← {competition} · {season}
            </Link>

            <p className="mt-6 text-xs font-black uppercase tracking-[0.2em] text-sky-600">
              Standings
            </p>

            <h1 className="mt-2 text-4xl font-black tracking-tight text-slate-900 sm:text-5xl">
              Table
            </h1>

            <p className="mt-2 text-sm text-slate-500">
              {competition} · {season}
            </p>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-5 py-8 sm:py-12">
          <div className="overflow-hidden rounded-2xl border border-sky-100 bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] border-collapse">
                <thead>
                  <tr className="bg-sky-50 text-left">
                    <th className="px-4 py-4 text-xs font-black uppercase tracking-wider text-slate-500">
                      Pos
                    </th>
                    <th className="px-4 py-4 text-xs font-black uppercase tracking-wider text-slate-500">
                      Team
                    </th>
                    <th className="px-4 py-4 text-center text-xs font-black uppercase tracking-wider text-slate-500">
                      P
                    </th>
                    <th className="px-4 py-4 text-center text-xs font-black uppercase tracking-wider text-slate-500">
                      W
                    </th>
                    <th className="px-4 py-4 text-center text-xs font-black uppercase tracking-wider text-slate-500">
                      D
                    </th>
                    <th className="px-4 py-4 text-center text-xs font-black uppercase tracking-wider text-slate-500">
                      L
                    </th>
                    <th className="px-4 py-4 text-center text-xs font-black uppercase tracking-wider text-slate-500">
                      GF
                    </th>
                    <th className="px-4 py-4 text-center text-xs font-black uppercase tracking-wider text-slate-500">
                      GA
                    </th>
                    <th className="px-4 py-4 text-center text-xs font-black uppercase tracking-wider text-slate-500">
                      GD
                    </th>
                    <th className="px-4 py-4 text-center text-xs font-black uppercase tracking-wider text-slate-500">
                      Pts
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {table.map((row, index) => {
                    const gd =
                      row.goalsFor - row.goalsAgainst;

                    return (
                      <tr
                        key={row.team.id}
                        className="border-t border-slate-100"
                      >
                        <td className="px-4 py-4 text-sm font-black text-slate-500">
                          {index + 1}
                        </td>

                        <td className="px-4 py-4">
                          <div className="flex items-center gap-3">
                            {row.team.crest_url ? (
                              <img
                                src={row.team.crest_url}
                                alt=""
                                className="h-8 w-8 object-contain"
                              />
                            ) : (
                              <div className="h-8 w-8 rounded-full bg-slate-100" />
                            )}

                            <span className="font-black text-slate-900">
                              {row.team.name}
                            </span>
                          </div>
                        </td>

                        <td className="px-4 py-4 text-center text-sm font-bold text-slate-700">
                          {row.played}
                        </td>
                        <td className="px-4 py-4 text-center text-sm font-bold text-slate-700">
                          {row.wins}
                        </td>
                        <td className="px-4 py-4 text-center text-sm font-bold text-slate-700">
                          {row.draws}
                        </td>
                        <td className="px-4 py-4 text-center text-sm font-bold text-slate-700">
                          {row.losses}
                        </td>
                        <td className="px-4 py-4 text-center text-sm font-bold text-slate-700">
                          {row.goalsFor}
                        </td>
                        <td className="px-4 py-4 text-center text-sm font-bold text-slate-700">
                          {row.goalsAgainst}
                        </td>
                        <td className="px-4 py-4 text-center text-sm font-bold text-slate-700">
                          {gd > 0 ? `+${gd}` : gd}
                        </td>
                        <td className="px-4 py-4 text-center text-base font-black text-sky-700">
                          {row.points}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-5 pb-12">
          <div className="mb-5">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-sky-600">
              Scorers
            </p>
            <h2 className="mt-1 text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">
              Top Scorers
            </h2>
          </div>

          <div className="overflow-hidden rounded-2xl border border-sky-100 bg-white shadow-sm">
            {scorers.length > 0 ? (
              <div className="divide-y divide-slate-100">
                {scorers.map((scorer, index) => {
                  const team = allTeams.find(
                    (item) => item.id === scorer.teamId
                  );

                  return (
                    <div
                      key={index}
                      className="flex items-center gap-4 px-4 py-4 sm:px-6"
                    >
                      <span className="w-6 text-sm font-black text-slate-400">
                        {index + 1}
                      </span>

                      {scorer.photoUrl ? (
                        <img
                          src={scorer.photoUrl}
                          alt={scorer.name}
                          className="h-11 w-11 shrink-0 rounded-full object-cover"
                        />
                      ) : (
                        <div className="h-11 w-11 shrink-0 rounded-full bg-slate-100" />
                      )}

                      <div className="min-w-0 flex-1">
                        <p className="truncate font-black text-slate-900">
                          {scorer.name}
                        </p>
                        <p className="mt-0.5 text-xs font-bold text-slate-400">
                          {team?.short_name || team?.name || "Unknown team"}
                        </p>
                      </div>

                      <div className="text-right">
                        <p className="text-xl font-black text-sky-700">
                          {scorer.goals}
                        </p>
                        <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                          {scorer.goals === 1 ? "Goal" : "Goals"}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="p-8 text-sm font-bold text-slate-500">
                No scorer data available yet.
              </p>
            )}
          </div>
        </section>
      </main>
    </>
  );
}
