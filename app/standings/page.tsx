import Header from "@/components/Header";
import StandingsGroups from "@/components/StandingsGroups";
import { supabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function StandingsPage() {
  const { data: matches } = await supabase
    .from("matches")
    .select(`
      id,
      competition,
      season,
      home_team_id,
      away_team_id,
      home_score,
      away_score,
      status
    `)
    .eq("status", "finished");

  const { data: teams } = await supabase
    .from("teams")
    .select("id, name, short_name, crest_url");

  const allMatches = matches || [];
  const allTeams = teams || [];

  const competitionMap = new Map<string, any[]>();

  for (const match of allMatches) {
    const key = `${match.competition}|||${match.season}`;
    const group = competitionMap.get(key) || [];
    group.push(match);
    competitionMap.set(key, group);
  }

  const groups = [];

  for (const [key, competitionMatches] of competitionMap) {
    const [competition, season] = key.split("|||");

    const teamIds = new Set<number>();

    for (const match of competitionMatches) {
      if (match.home_team_id) teamIds.add(match.home_team_id);
      if (match.away_team_id) teamIds.add(match.away_team_id);
    }

    const groupTeams = allTeams.filter((team) =>
      teamIds.has(team.id)
    );

    const table = groupTeams.map((team) => ({
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

    for (const match of competitionMatches) {
      if (
        match.home_team_id == null ||
        match.away_team_id == null ||
        match.home_score == null ||
        match.away_score == null
      ) {
        continue;
      }

      const home = tableMap.get(match.home_team_id);
      const away = tableMap.get(match.away_team_id);

      if (!home || !away) continue;

      home.played++;
      away.played++;

      home.goalsFor += match.home_score;
      home.goalsAgainst += match.away_score;

      away.goalsFor += match.away_score;
      away.goalsAgainst += match.home_score;

      if (match.home_score > match.away_score) {
        home.wins++;
        home.points += 3;
        away.losses++;
      } else if (match.home_score < match.away_score) {
        away.wins++;
        away.points += 3;
        home.losses++;
      } else {
        home.draws++;
        away.draws++;
        home.points++;
        away.points++;
      }
    }

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

    const matchIds = competitionMatches.map(
      (match) => match.id
    );

    const { data: goalEvents } = matchIds.length
      ? await supabase
          .from("match_events")
          .select(
            "match_id, team_id, player_id, player_name_raw, type"
          )
          .in("match_id", matchIds)
      : { data: [] };

    const playerIds = [
      ...new Set(
        (goalEvents || [])
          .filter(
            (event: any) =>
              event.type?.toLowerCase() === "goal" &&
              event.player_id != null
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

    const scorerMap = new Map<string, any>();

    for (const event of goalEvents || []) {
      if (
        event.type?.toLowerCase() !== "goal" ||
        event.player_id == null
      ) {
        continue;
      }

      const key = String(event.player_id);
      const existing = scorerMap.get(key);

      if (existing) {
        existing.goals++;
        continue;
      }

      const player = playerMap.get(event.player_id);

      scorerMap.set(key, {
        playerId: event.player_id,
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

    const scorers = [...scorerMap.values()]
      .sort(
        (a, b) =>
          b.goals - a.goals ||
          a.name.localeCompare(b.name)
      )
      .slice(0, 20);

    groups.push({
      competition,
      season,
      table,
      scorers,
      teams: groupTeams,
    });
  }

  groups.sort((a, b) => {
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
              NE Sports Centre
            </p>

            <h1 className="mt-2 text-4xl font-black tracking-tight text-slate-900 sm:text-5xl">
              Standings
            </h1>

            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-500">
              League tables and top scorers from football
              competitions across Northeast India.
            </p>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-5 py-8 sm:py-12">
          <StandingsGroups groups={groups} />
        </section>
      </main>
    </>
  );
}
