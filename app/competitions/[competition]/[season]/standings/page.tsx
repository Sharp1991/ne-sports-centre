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
  status: string | null;
  group_name: string | null;
  matchday?: number | null;
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
      "id, home_team_id, away_team_id, home_score, away_score, status, group_name, matchday"
    )
    .eq("competition", competition)
    .eq("season", season);

  const { data: teams } = await supabase
    .from("teams")
    .select("id, name, short_name, crest_url");

  const allMatches = (matches || []) as Match[];
  const allTeams = (teams || []) as Team[];

  // SSA Super Cup 2026 is a knockout tournament, not a league.
  // This isolated branch leaves every other competition unchanged.
  const isSsaSuperCup2026 =
    competition.trim().toLowerCase() === "ssa super cup" &&
    season.trim() === "2026";

  if (isSsaSuperCup2026) {
    const cupMatches = [...allMatches].sort((a, b) => a.id - b.id);
    const teamById = new Map(allTeams.map((team) => [team.id, team]));

    const stageText = (match: Match) =>
      `${match.group_name || ""} ${String(match.matchday ?? "")}`
        .toLowerCase()
        .replace(/[_-]+/g, " ")
        .replace(/\s+/g, " ")
        .trim();

    const findStage = (
      stage: "po1" | "po2" | "sf1" | "sf2" | "final",
      fallbackIndex: number
    ): Match | null => {
      const found = cupMatches.find((match) => {
        const label = stageText(match);

        if (stage === "po1") return /\b(po\s*1|play off 1|playoff 1)\b/.test(label);
        if (stage === "po2") return /\b(po\s*2|play off 2|playoff 2)\b/.test(label);
        if (stage === "sf1") return /\b(sf\s*1|semi final 1|semifinal 1)\b/.test(label);
        if (stage === "sf2") return /\b(sf\s*2|semi final 2|semifinal 2)\b/.test(label);
        return /\bfinal\b/.test(label) && !/\bsemi\b/.test(label);
      });

      return found || cupMatches[fallbackIndex] || null;
    };

    const playOff1 = findStage("po1", 0);
    const playOff2 = findStage("po2", 1);
    const semi1 = findStage("sf1", 2);
    const semi2 = findStage("sf2", 3);
    const finalMatch = findStage("final", 4);

    const matchWinner = (match: Match | null): Team | null => {
      if (
        !match ||
        match.status?.toLowerCase() !== "finished" ||
        match.home_score === null ||
        match.away_score === null ||
        match.home_score === match.away_score
      ) return null;

      const winnerId =
        match.home_score > match.away_score
          ? match.home_team_id
          : match.away_team_id;

      return winnerId === null ? null : teamById.get(winnerId) || null;
    };

    const playOffWinner1 = matchWinner(playOff1);
    const playOffWinner2 = matchWinner(playOff2);
    const semiWinner1 = matchWinner(semi1);
    const semiWinner2 = matchWinner(semi2);
    const champion = matchWinner(finalMatch);

    const findTeamByName = (name: string): Team | null => {
      const normalized = name.trim().toLowerCase();
      if (!normalized || normalized.startsWith("winner of ")) return null;

      return allTeams.find(
        (team) =>
          team.name.trim().toLowerCase() === normalized ||
          team.short_name.trim().toLowerCase() === normalized
      ) || null;
    };

    const renderCupMatch = (
      match: Match | null,
      title: string,
      fallbackHome: string,
      fallbackAway: string
    ) => {
      const home = (
        match?.home_team_id == null
          ? null
          : teamById.get(match.home_team_id) || null
      ) || findTeamByName(fallbackHome);

      const away = (
        match?.away_team_id == null
          ? null
          : teamById.get(match.away_team_id) || null
      ) || findTeamByName(fallbackAway);
      const complete =
        match !== null &&
        match.status?.toLowerCase() === "finished" &&
        match.home_score !== null &&
        match.away_score !== null;
      const homeWon =
        complete && match!.home_score! > match!.away_score!;
      const awayWon =
        complete && match!.away_score! > match!.home_score!;

      const renderCupTeam = (
        team: Team | null,
        fallback: string,
        won: boolean
      ) => (
        <span className="flex min-w-0 items-center gap-2">
          {team?.crest_url ? (
            <img
              src={team.crest_url}
              alt={`${team.name} crest`}
              className="h-8 w-8 shrink-0 object-contain"
              loading="lazy"
            />
          ) : (
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-black text-slate-500">
              {(team?.short_name || fallback).slice(0, 2).toUpperCase()}
            </span>
          )}
          <span className="min-w-0 break-words font-bold">
            {team?.name || fallback}
            {won ? " ✓" : ""}
          </span>
        </span>
      );

      return (
        <article
          key={match?.id ?? title}
          className="rounded-2xl border border-sky-100 bg-white p-4 shadow-sm"
        >
          <p className="mb-4 text-xs font-black uppercase tracking-widest text-sky-700">
            {title}
          </p>

          <div className={`flex items-center justify-between gap-3 ${homeWon ? "text-emerald-700" : "text-slate-900"}`}>
            {renderCupTeam(home, fallbackHome, homeWon)}
            <span className="shrink-0 font-black tabular-nums">
              {complete ? match!.home_score : "–"}
            </span>
          </div>

          <div className="my-3 border-t border-slate-100" />

          <div className={`flex items-center justify-between gap-3 ${awayWon ? "text-emerald-700" : "text-slate-900"}`}>
            {renderCupTeam(away, fallbackAway, awayWon)}
            <span className="shrink-0 font-black tabular-nums">
              {complete ? match!.away_score : "–"}
            </span>
          </div>

          <p className="mt-4 text-xs font-semibold capitalize text-slate-500">
            {match?.status || "Scheduled"}
          </p>
        </article>
      );
    };

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
                Knockout tournament
              </p>
              <h1 className="mt-2 text-4xl font-black tracking-tight text-slate-900 sm:text-5xl">
                {competition}
              </h1>
              <p className="mt-2 text-sm font-bold text-slate-500">
                {season} · Win to advance
              </p>
            </div>
          </section>

          <section className="mx-auto max-w-7xl px-5 py-8 sm:py-12">
            <div className="mb-8 rounded-2xl border border-sky-100 bg-white p-5">
              <h2 className="text-lg font-black text-slate-900">Tournament bracket</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Play-off winners advance to the semi-finals. The semi-final winners
                meet in the final. This competition has no league table or points ranking.
              </p>
            </div>

            <div className="grid gap-8 lg:grid-cols-3">
              <section>
                <h2 className="mb-4 text-xl font-black text-slate-900">1. Play-offs</h2>
                <div className="space-y-4">
                  {renderCupMatch(playOff1, "Play-off 1", "Nongkseh SS CC", "Sawmer SCC")}
                  {renderCupMatch(playOff2, "Play-off 2", "Langsning FC", "Meghalaya Police")}
                </div>
              </section>

              <section>
                <h2 className="mb-4 text-xl font-black text-slate-900">2. Semi-finals</h2>
                <div className="space-y-4">
                  {renderCupMatch(semi1, "Semi-final 1", "Mawlai SC", playOffWinner1?.name || "Winner of Play-off 1")}
                  {renderCupMatch(semi2, "Semi-final 2", "Shillong Lajong FC", playOffWinner2?.name || "Winner of Play-off 2")}
                </div>
              </section>

              <section>
                <h2 className="mb-4 text-xl font-black text-slate-900">3. Final</h2>
                {renderCupMatch(finalMatch, "Final", semiWinner1?.name || "Winner of Semi-final 1", semiWinner2?.name || "Winner of Semi-final 2")}

                {champion && (
                  <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4">
                    <p className="text-xs font-black uppercase tracking-widest text-amber-800">
                      Champions
                    </p>
                    <p className="mt-1 text-lg font-black text-slate-900">
                      {champion.name}
                    </p>
                  </div>
                )}
              </section>
            </div>

            {cupMatches.length === 0 && (
              <p className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
                No Super Cup fixtures were found for this season.
              </p>
            )}
          </section>
        </main>
      </>
    );
  }

  const groups = [
    ...new Set(
      allMatches
        .map((match) => match.group_name)
        .filter(
          (group): group is string =>
            Boolean(group && group.trim())
        )
    ),
  ];

  const isSsaFirstDivision =
    competition.trim().toLowerCase() === "ssa first division";

  const phaseNames = ["bottom league", "semi-final", "final"];
  const leagueGroups = isSsaFirstDivision
    ? groups.filter((group) => !phaseNames.includes(group.trim().toLowerCase()))
    : groups;
  const isGrouped = leagueGroups.length > 0;

  function calculateTable(groupMatches: Match[]) {
    const finishedMatches = groupMatches.filter(
      (match) =>
        match.status === "finished" &&
        match.home_team_id !== null &&
        match.away_team_id !== null &&
        match.home_score !== null &&
        match.away_score !== null
    );

    const teamIds = new Set<number>();

    groupMatches.forEach((match) => {
      if (match.home_team_id !== null) {
        teamIds.add(match.home_team_id);
      }

      if (match.away_team_id !== null) {
        teamIds.add(match.away_team_id);
      }
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

    finishedMatches.forEach((match) => {
      const home = tableMap.get(match.home_team_id!);
      const away = tableMap.get(match.away_team_id!);

      if (!home || !away) return;

      home.played += 1;
      away.played += 1;

      home.goalsFor += match.home_score!;
      home.goalsAgainst += match.away_score!;

      away.goalsFor += match.away_score!;
      away.goalsAgainst += match.home_score!;

      if (match.home_score! > match.away_score!) {
        home.wins += 1;
        home.points += 3;
        away.losses += 1;
      } else if (match.home_score! < match.away_score!) {
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

    if (competition.trim().toLowerCase() !== "ssa first division") {
      // Preserve the existing ranking for every other competition.
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
    } else {
      // SSA 1st Division: points first, then head-to-head points.
      table.sort((a, b) => b.points - a.points);

      const rankedTable: typeof table = [];

      for (let start = 0; start < table.length;) {
        let end = start + 1;

        while (
          end < table.length &&
          table[end].points === table[start].points
        ) {
          end++;
        }

        const tiedTeams = table.slice(start, end);

        if (tiedTeams.length > 1) {
          const tiedIds = new Set(
            tiedTeams.map((row) => row.team.id)
          );

          const h2hPoints = new Map<number, number>(
            tiedTeams.map((row) => [row.team.id, 0])
          );

          finishedMatches.forEach((match) => {
            const homeId = match.home_team_id!;
            const awayId = match.away_team_id!;

            if (!tiedIds.has(homeId) || !tiedIds.has(awayId)) {
              return;
            }

            if (match.home_score! > match.away_score!) {
              h2hPoints.set(homeId, h2hPoints.get(homeId)! + 3);
            } else if (match.home_score! < match.away_score!) {
              h2hPoints.set(awayId, h2hPoints.get(awayId)! + 3);
            } else {
              h2hPoints.set(homeId, h2hPoints.get(homeId)! + 1);
              h2hPoints.set(awayId, h2hPoints.get(awayId)! + 1);
            }
          });

          tiedTeams.sort(
            (a, b) =>
              h2hPoints.get(b.team.id)! - h2hPoints.get(a.team.id)! ||
              a.team.name.localeCompare(b.team.name)
          );
        }

        rankedTable.push(...tiedTeams);
        start = end;
      }

      table.splice(0, table.length, ...rankedTable);
    }

    return table;
  }

  const regularStandingsTables = isGrouped
    ? leagueGroups.map((group) => ({
        group,
        table: calculateTable(
          allMatches.filter(
            (match) => match.group_name?.trim() === group
          )
        ),
      }))
    : [{ group: null, table: calculateTable(allMatches) }];

  const bottomLeagueMatches = isSsaFirstDivision
    ? allMatches.filter(
        (match) => match.group_name?.trim().toLowerCase() === "bottom league"
      )
    : [];

  const bottomLeagueFinishedMatches = bottomLeagueMatches.filter(
    (match) =>
      match.status === "finished" &&
      match.home_team_id !== null &&
      match.away_team_id !== null &&
      match.home_score !== null &&
      match.away_score !== null
  );

  const bottomLeagueComplete =
    bottomLeagueMatches.length > 0 &&
    bottomLeagueFinishedMatches.length === bottomLeagueMatches.length;


  // SSA First Division promotion play-offs: derive teams and outcomes from fixtures.
  const promotionMatches = isSsaFirstDivision
    ? allMatches.filter((match) =>
        ["semi-final", "final"].includes(
          String(match.group_name || "").trim().toLowerCase()
        )
      )
    : [];

  const semiFinals = promotionMatches
    .filter(
      (match) =>
        String(match.group_name || "").trim().toLowerCase() === "semi-final"
    )
    .sort((a, b) => Number(a.matchday || 0) - Number(b.matchday || 0));

  const finalMatch = promotionMatches.find(
    (match) =>
      String(match.group_name || "").trim().toLowerCase() === "final"
  );

  const teamsById = new Map(allTeams.map((team) => [team.id, team]));
  const promotionContenders = new Map<number, Team>();

  for (const match of semiFinals) {
    for (const id of [match.home_team_id, match.away_team_id]) {
      if (id !== null) {
        const team = teamsById.get(id);
        if (team) promotionContenders.set(id, team);
      }
    }
  }

  const promotedTeamIds = new Set<number>();
  const eliminatedTeamIds = new Set<number>();
  let championTeamId: number | null = null;

  for (const match of semiFinals) {
    const complete =
      match.status === "finished" &&
      match.home_team_id !== null &&
      match.away_team_id !== null &&
      match.home_score !== null &&
      match.away_score !== null;

    if (!complete || match.home_score === match.away_score) continue;

    const homeWon = match.home_score! > match.away_score!;
    const winnerId = homeWon ? match.home_team_id! : match.away_team_id!;
    const loserId = homeWon ? match.away_team_id! : match.home_team_id!;

    promotedTeamIds.add(winnerId);
    eliminatedTeamIds.add(loserId);
  }

  if (finalMatch) {
    if (finalMatch.home_team_id !== null) {
      promotedTeamIds.add(finalMatch.home_team_id);
    }
    if (finalMatch.away_team_id !== null) {
      promotedTeamIds.add(finalMatch.away_team_id);
    }

    if (
      finalMatch.status === "finished" &&
      finalMatch.home_team_id !== null &&
      finalMatch.away_team_id !== null &&
      finalMatch.home_score !== null &&
      finalMatch.away_score !== null &&
      finalMatch.home_score !== finalMatch.away_score
    ) {
      championTeamId =
        finalMatch.home_score > finalMatch.away_score
          ? finalMatch.home_team_id
          : finalMatch.away_team_id;
    }
  }

  function promotionTeamName(
    teamId: number | null,
    fallback: string
  ): string {
    return teamId === null
      ? fallback
      : teamsById.get(teamId)?.name || fallback;
  }

  function PromotionTeamCell({
    teamId,
    fallback,
  }: {
    teamId: number | null;
    fallback: string;
  }) {
    const team = teamId === null ? undefined : teamsById.get(teamId);

    return (
      <div className="flex items-center gap-3">
        {team?.crest_url ? (
          <img
            src={team.crest_url}
            alt={`${team.name} crest`}
            className="h-8 w-8 shrink-0 object-contain"
            loading="lazy"
          />
        ) : (
          <div className="h-8 w-8 shrink-0 rounded-full bg-slate-100" aria-hidden="true" />
        )}
        <span>{team?.name || fallback}</span>
      </div>
    );
  }

  function promotionMatchStatus(match: Match): string {
    if (
      match.status === "finished" &&
      match.home_score !== null &&
      match.away_score !== null
    ) {
      return "Full time";
    }
    return match.status || "Scheduled";
  }

  const standingsTables = isSsaFirstDivision
    ? [
        ...regularStandingsTables,
        ...(bottomLeagueMatches.length > 0
          ? [{
              group: "Bottom League",
              table: calculateTable(bottomLeagueMatches),
            }]
          : []),
      ]
    : regularStandingsTables;

  const finishedMatches = allMatches.filter(
    (match) =>
      match.status === "finished" &&
      match.home_score !== null &&
      match.away_score !== null
  );

  const matchIds = finishedMatches.map((match) => match.id);

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
          <div className="space-y-8">
            {standingsTables.map(({ group, table }) => (
              <div key={group || "overall"}>
                {group && (
                  <div className="mb-4">
                    <h2 className="text-2xl font-black tracking-tight text-slate-900">
                      {group}
                    </h2>
                  </div>
                )}

                {isSsaFirstDivision && group === "Bottom League" && (
                  <p className="mb-4 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900">
                    This table counts Bottom League fixtures only. The bottom
                    two teams are relegated when the league is complete.
                    {bottomLeagueComplete
                      ? " Final relegation positions are shown below."
                      : " Relegation positions remain provisional."}
                  </p>
                )}

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
                                    {isSsaFirstDivision &&
                                      group === "Bottom League" &&
                                      index >= table.length - 2 && (
                                        <span className="ml-2 inline-block rounded-full bg-amber-100 px-2 py-1 text-[10px] font-black uppercase tracking-wide text-amber-800">
                                          {bottomLeagueComplete ? "Relegated" : "Relegation zone"}
                                        </span>
                                      )}
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
              </div>
            ))}
          </div>
        </section>


        {isSsaFirstDivision && semiFinals.length > 0 && (
          <section className="mx-auto max-w-7xl px-5 pb-12">
            <div className="rounded-3xl border border-sky-100 bg-white p-5 shadow-sm sm:p-8">
              <p className="text-xs font-black uppercase tracking-[0.2em] text-sky-600">
                SSA First Division
              </p>
              <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">
                Promotion Race &amp; Champions
              </h2>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
                Both semi-final winners earn promotion. Both finalists are promoted;
                the final winner is crowned SSA First Division champion.
              </p>

              <div className="mt-6 overflow-x-auto rounded-2xl border border-sky-100">
                <table className="w-full min-w-[620px] border-collapse">
                  <thead>
                    <tr className="bg-sky-50 text-left">
                      {["Stage", "Home team", "Score", "Away team", "Status"].map((heading) => (
                        <th key={heading} className="px-4 py-3 text-xs font-black uppercase tracking-wider text-slate-500">
                          {heading}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {semiFinals.map((match, index) => (
                      <tr key={match.id} className="border-t border-slate-100">
                        <td className="px-4 py-4 text-sm font-black text-slate-700">
                          Semi-final {index + 1}
                        </td>
                        <td className="px-4 py-4 text-sm font-bold text-slate-900">
                          <PromotionTeamCell teamId={match.home_team_id} fallback="TBD" />
                        </td>
                        <td className="px-4 py-4 text-sm font-black text-sky-700">
                          {match.home_score !== null && match.away_score !== null
                            ? `${match.home_score} – ${match.away_score}`
                            : "vs"}
                        </td>
                        <td className="px-4 py-4 text-sm font-bold text-slate-900">
                          <PromotionTeamCell teamId={match.away_team_id} fallback="TBD" />
                        </td>
                        <td className="px-4 py-4 text-xs font-bold text-slate-500">
                          {promotionMatchStatus(match)}
                        </td>
                      </tr>
                    ))}
                    {finalMatch && (
                      <tr key={finalMatch.id} className="border-t-2 border-sky-100 bg-amber-50/50">
                        <td className="px-4 py-4 text-sm font-black text-amber-800">
                          Final
                        </td>
                        <td className="px-4 py-4 text-sm font-bold text-slate-900">
                          <PromotionTeamCell teamId={finalMatch.home_team_id} fallback="Winner of Semi-final 1" />
                        </td>
                        <td className="px-4 py-4 text-sm font-black text-sky-700">
                          {finalMatch.home_score !== null && finalMatch.away_score !== null
                            ? `${finalMatch.home_score} – ${finalMatch.away_score}`
                            : "vs"}
                        </td>
                        <td className="px-4 py-4 text-sm font-bold text-slate-900">
                          <PromotionTeamCell teamId={finalMatch.away_team_id} fallback="Winner of Semi-final 2" />
                        </td>
                        <td className="px-4 py-4 text-xs font-bold text-slate-500">
                          {championTeamId !== null
                            ? "Champion decided"
                            : promotionMatchStatus(finalMatch)}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

            </div>
          </section>
        )}

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
