import { supabase } from "@/lib/supabase";
import Header from "@/components/Header";

export const dynamic = "force-dynamic";

function minuteNumber(value: any) {
  const match = String(value ?? "").match(/^(\d+)/);
  return match ? Number(match[1]) : null;
}

function goalPeriod(value: any) {
  const minute = minuteNumber(value);

  if (minute === null) return null;
  if (minute <= 15) return "1–15";
  if (minute <= 30) return "16–30";
  if (minute <= 45) return "31–45+";
  if (minute <= 60) return "46–60";
  if (minute <= 75) return "61–75";
  return "76–90+";
}

function percentage(value: number, total: number) {
  return total ? `${((value / total) * 100).toFixed(1)}%` : "0.0%";
}

function resultForTeam(
  teamId: number,
  homeTeamId: number,
  awayTeamId: number,
  homeScore: number,
  awayScore: number
) {
  const isHome = teamId === homeTeamId;
  const scored = isHome ? homeScore : awayScore;
  const conceded = isHome ? awayScore : homeScore;

  if (scored > conceded) return "W";
  if (scored < conceded) return "L";
  return "D";
}

export default async function DataCentrePage() {
  const { data: matches, error } = await supabase
    .from("matches")
    .select(`
      id,
      competition,
      season,
      date,
      venue,
      home_score,
      away_score,
      status,
      home_team_id,
      away_team_id,
      home_team:teams!matches_home_team_id_fkey (
        id,
        name,
        short_name
      ),
      away_team:teams!matches_away_team_id_fkey (
        id,
        name,
        short_name
      )
    `)
    .eq("competition", "Shillong Premier League")
    .eq("season", "2026")
    .not("home_score", "is", null)
    .not("away_score", "is", null)
    .order("date", { ascending: true });

  if (error) {
    return (
      <>
        <Header />
        <main className="mx-auto max-w-7xl px-5 py-12">
          <h1 className="text-2xl font-black">Data Centre</h1>
          <p className="mt-3 text-red-600">
            Unable to load data from Supabase.
          </p>
        </main>
      </>
    );
  }

  const completedMatches = matches || [];
  const matchIds = completedMatches.map((match: any) => match.id);

  const { data: events } = matchIds.length
    ? await supabase
        .from("match_events")
        .select(
          "match_id, minute, team_id, player_id, player_name_raw, type"
        )
        .in("match_id", matchIds)
    : { data: [] };

  const goalEvents = (events || []).filter(
    (event: any) => event.type?.toLowerCase() === "goal"
  );

  /*
   * TEAM SET
   */
  const teams = new Map<number, any>();

  for (const match of completedMatches) {
    const home = Array.isArray(match.home_team)
      ? match.home_team[0]
      : match.home_team;
    const away = Array.isArray(match.away_team)
      ? match.away_team[0]
      : match.away_team;

    if (home?.id != null && !teams.has(home.id)) {
      teams.set(home.id, {
        id: home.id,
        name: home.name,
        shortName: home.short_name,
      });
    }

    if (away?.id != null && !teams.has(away.id)) {
      teams.set(away.id, {
        id: away.id,
        name: away.name,
        shortName: away.short_name,
      });
    }
  }

  /*
   * TEAM PERFORMANCE
   */
  const teamStats = new Map<number, any>();

  for (const team of teams.values()) {
    teamStats.set(team.id, {
      ...team,
      played: 0,
      wins: 0,
      draws: 0,
      losses: 0,
      points: 0,
      goalsFor: 0,
      goalsAgainst: 0,
      cleanSheets: 0,
      failedToScore: 0,
      bothScored: 0,
      threePlus: 0,
      fourPlus: 0,
      scoredFirst: 0,
      concededFirst: 0,
      firstHalfGoals: 0,
      secondHalfGoals: 0,
      goalsByPeriod: {
        "1–15": 0,
        "16–30": 0,
        "31–45+": 0,
        "46–60": 0,
        "61–75": 0,
        "76–90+": 0,
      },
      concededByPeriod: {
        "1–15": 0,
        "16–30": 0,
        "31–45+": 0,
        "46–60": 0,
        "61–75": 0,
        "76–90+": 0,
      },
      marginsWon: [],
      marginsLost: [],
      results: [],
    });
  }

  /*
   * MATCH RESULT DATA
   */
  for (const match of completedMatches) {
    const homeId = match.home_team_id;
    const awayId = match.away_team_id;

    const home = teamStats.get(homeId);
    const away = teamStats.get(awayId);

    if (!home || !away) continue;

    const hs = Number(match.home_score);
    const as = Number(match.away_score);

    home.played++;
    away.played++;

    home.goalsFor += hs;
    home.goalsAgainst += as;

    away.goalsFor += as;
    away.goalsAgainst += hs;

    if (as === 0) home.cleanSheets++;
    if (hs === 0) away.cleanSheets++;

    if (hs === 0) home.failedToScore++;
    if (as === 0) away.failedToScore++;

    if (hs > 0 && as > 0) {
      home.bothScored++;
      away.bothScored++;
    }

    if (hs + as >= 3) {
      home.threePlus++;
      away.threePlus++;
    }

    if (hs + as >= 4) {
      home.fourPlus++;
      away.fourPlus++;
    }

    const homeResult = resultForTeam(
      homeId,
      homeId,
      awayId,
      hs,
      as
    );

    const awayResult = resultForTeam(
      awayId,
      homeId,
      awayId,
      hs,
      as
    );

    home.results.push(homeResult);
    away.results.push(awayResult);

    if (homeResult === "W") {
      home.wins++;
      home.points += 3;
      home.marginsWon.push(hs - as);
      away.losses++;
      away.marginsLost.push(hs - as);
    } else if (homeResult === "L") {
      home.losses++;
      home.marginsLost.push(as - hs);
      away.wins++;
      away.points += 3;
      away.marginsWon.push(as - hs);
    } else {
      home.draws++;
      away.draws++;
      home.points++;
      away.points++;
    }
  }

  /*
   * EVENT DATA
   *
   * We sort each match's goal events by recorded minute before
   * determining which team scored first.
   */
  const goalsByMatch = new Map<number, any[]>();

  for (const event of goalEvents) {
    const list = goalsByMatch.get(event.match_id) || [];
    list.push(event);
    goalsByMatch.set(event.match_id, list);
  }

  for (const [matchId, goalList] of goalsByMatch) {
    goalList.sort((a, b) => {
      const am = minuteNumber(a.minute);
      const bm = minuteNumber(b.minute);

      if (am === null && bm === null) return 0;
      if (am === null) return 1;
      if (bm === null) return -1;

      return am - bm;
    });

    const match = completedMatches.find(
      (item: any) => item.id === matchId
    );

    if (!match) continue;

    const firstGoal = goalList.find(
      (event: any) => event.team_id != null
    );

    if (firstGoal) {
      const firstTeam = teamStats.get(firstGoal.team_id);

      if (firstTeam) {
        firstTeam.scoredFirst++;
      }

      const otherTeamId =
        firstGoal.team_id === match.home_team_id
          ? match.away_team_id
          : match.home_team_id;

      const otherTeam = teamStats.get(otherTeamId);

      if (otherTeam) {
        otherTeam.concededFirst++;
      }
    }

    for (const event of goalList) {
      if (event.team_id == null) continue;

      const team = teamStats.get(event.team_id);
      if (!team) continue;

      const period = goalPeriod(event.minute);

      if (period) {
        team.goalsByPeriod[period]++;

        const minute = minuteNumber(event.minute);

        if (minute !== null && minute <= 45) {
          team.firstHalfGoals++;
        }

        if (minute !== null && minute > 45) {
          team.secondHalfGoals++;
        }
      }

      const matchForEvent = completedMatches.find(
        (item: any) => item.id === event.match_id
      );

      if (!matchForEvent) continue;

      const opponentId =
        event.team_id === matchForEvent.home_team_id
          ? matchForEvent.away_team_id
          : matchForEvent.home_team_id;

      const opponent = teamStats.get(opponentId);

      if (opponent && period) {
        opponent.concededByPeriod[period]++;
      }
    }
  }

  /*
   * STREAKS
   */
  function longestStreak(results: string[], accepted: string[]) {
    let current = 0;
    let longest = 0;

    for (const result of results) {
      if (accepted.includes(result)) {
        current++;
        longest = Math.max(longest, current);
      } else {
        current = 0;
      }
    }

    return longest;
  }

  function currentStreak(results: string[], accepted: string[]) {
    let count = 0;

    for (let i = results.length - 1; i >= 0; i--) {
      if (!accepted.includes(results[i])) break;
      count++;
    }

    return count;
  }

  /*
   * COMPETITION SUMMARY
   */
  const totalMatches = completedMatches.length;

  const totalGoals = completedMatches.reduce(
    (sum: number, match: any) =>
      sum +
      Number(match.home_score || 0) +
      Number(match.away_score || 0),
    0
  );

  const draws = completedMatches.filter(
    (match: any) =>
      Number(match.home_score) === Number(match.away_score)
  ).length;

  const threePlusMatches = completedMatches.filter(
    (match: any) =>
      Number(match.home_score) + Number(match.away_score) >= 3
  ).length;

  const fourPlusMatches = completedMatches.filter(
    (match: any) =>
      Number(match.home_score) + Number(match.away_score) >= 4
  ).length;

  const bttsMatches = completedMatches.filter(
    (match: any) =>
      Number(match.home_score) > 0 &&
      Number(match.away_score) > 0
  ).length;

  const firstHalfGoals = goalEvents.filter((event: any) => {
    const minute = minuteNumber(event.minute);
    return minute !== null && minute <= 45;
  }).length;

  const secondHalfGoals = goalEvents.filter((event: any) => {
    const minute = minuteNumber(event.minute);
    return minute !== null && minute > 45;
  }).length;

  const periodLabels = [
    "1–15",
    "16–30",
    "31–45+",
    "46–60",
    "61–75",
    "76–90+",
  ];

  const periodTotals = periodLabels.map((label) => ({
    label,
    count: goalEvents.filter(
      (event: any) => goalPeriod(event.minute) === label
    ).length,
  }));

  const sortedTeams = [...teamStats.values()].sort(
    (a, b) =>
      b.points - a.points ||
      b.goalsFor - b.goalsAgainst -
        (a.goalsFor - a.goalsAgainst) ||
      b.goalsFor - a.goalsFor ||
      a.name.localeCompare(b.name)
  );

  const highestScoringMatch = [...completedMatches].sort(
    (a: any, b: any) =>
      Number(b.home_score) +
      Number(b.away_score) -
      (Number(a.home_score) + Number(a.away_score))
  )[0];

  const allScoringMargins = completedMatches
    .map((match: any) =>
      Math.abs(
        Number(match.home_score) -
          Number(match.away_score)
      )
    )
    .sort((a, b) => b - a);

  const biggestMargin = allScoringMargins[0] || 0;

  return (
    <>
      <Header />

      <main className="min-h-screen bg-slate-50">
        <section className="border-b border-slate-200 bg-white">
          <div className="mx-auto max-w-7xl px-5 py-8 sm:py-10">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-sky-600">
              The Data Centre
            </p>

            <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
              Shillong Premier League 2026
            </h1>

            <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-500">
              Team performance, scoring patterns and match trends
              calculated directly from recorded competition data.
            </p>
          </div>
        </section>

        <div className="mx-auto max-w-7xl px-5 py-8">

          {/* COMPETITION SNAPSHOT */}
          <section>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {[
                ["Matches played", totalMatches],
                ["Goals", totalGoals],
                [
                  "Goals / match",
                  totalMatches
                    ? (totalGoals / totalMatches).toFixed(2)
                    : "0.00",
                ],
                ["Draws", draws],
                ["3+ goal matches", threePlusMatches],
                ["4+ goal matches", fourPlusMatches],
                ["Both teams scored", bttsMatches],
                [
                  "Recorded goal events",
                  goalEvents.length,
                ],
              ].map(([label, value]) => (
                <div
                  key={label}
                  className="rounded-2xl border border-slate-200 bg-white p-5"
                >
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    {label}
                  </p>
                  <p className="mt-2 text-3xl font-black text-slate-950">
                    {value}
                  </p>
                </div>
              ))}
            </div>
          </section>

          {/* TEAM PERFORMANCE TABLE */}
          <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-6">
            <div>
              <p className="text-xs font-black uppercase tracking-wider text-sky-600">
                Team performance
              </p>
              <h2 className="mt-1 text-xl font-black text-slate-950">
                Competition-wide team comparison
              </h2>
            </div>

            <div className="mt-5 overflow-x-auto">
              <table className="w-full min-w-[1100px] text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-[11px] font-black uppercase tracking-wide text-slate-400">
                    <th className="px-3 py-3">Team</th>
                    <th className="px-3 py-3">P</th>
                    <th className="px-3 py-3">W</th>
                    <th className="px-3 py-3">D</th>
                    <th className="px-3 py-3">L</th>
                    <th className="px-3 py-3">GF</th>
                    <th className="px-3 py-3">GA</th>
                    <th className="px-3 py-3">GF/Match</th>
                    <th className="px-3 py-3">Clean</th>
                    <th className="px-3 py-3">Failed</th>
                    <th className="px-3 py-3">BTTS</th>
                    <th className="px-3 py-3">First</th>
                  </tr>
                </thead>

                <tbody>
                  {sortedTeams.map((team) => (
                    <tr
                      key={team.id}
                      className="border-b border-slate-100 last:border-0"
                    >
                      <td className="px-3 py-4 font-black text-slate-900">
                        {team.name}
                      </td>
                      <td className="px-3 py-4">{team.played}</td>
                      <td className="px-3 py-4">{team.wins}</td>
                      <td className="px-3 py-4">{team.draws}</td>
                      <td className="px-3 py-4">{team.losses}</td>
                      <td className="px-3 py-4 font-bold">
                        {team.goalsFor}
                      </td>
                      <td className="px-3 py-4">
                        {team.goalsAgainst}
                      </td>
                      <td className="px-3 py-4">
                        {team.played
                          ? (
                              team.goalsFor /
                              team.played
                            ).toFixed(2)
                          : "0.00"}
                      </td>
                      <td className="px-3 py-4">
                        {team.cleanSheets}
                      </td>
                      <td className="px-3 py-4">
                        {team.failedToScore}
                      </td>
                      <td className="px-3 py-4">
                        {team.bothScored}
                      </td>
                      <td className="px-3 py-4">
                        {team.scoredFirst}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* TEAM ANALYTICS */}
          <section className="mt-8">
            <div className="mb-4">
              <p className="text-xs font-black uppercase tracking-wider text-sky-600">
                Team analytics
              </p>
              <h2 className="mt-1 text-xl font-black text-slate-950">
                Performance patterns
              </h2>
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              {sortedTeams.map((team) => {
                const gd =
                  team.goalsFor - team.goalsAgainst;

                const unbeaten =
                  team.played
                    ? percentage(
                        team.wins + team.draws,
                        team.played
                      )
                    : "0.0%";

                const scoringRate =
                  team.played
                    ? percentage(
                        team.played -
                          team.failedToScore,
                        team.played
                      )
                    : "0.0%";

                const cleanRate =
                  team.played
                    ? percentage(
                        team.cleanSheets,
                        team.played
                      )
                    : "0.0%";

                const bttsRate =
                  team.played
                    ? percentage(
                        team.bothScored,
                        team.played
                      )
                    : "0.0%";

                const threePlusRate =
                  team.played
                    ? percentage(
                        team.threePlus,
                        team.played
                      )
                    : "0.0%";

                return (
                  <article
                    key={team.id}
                    className="rounded-2xl border border-slate-200 bg-white p-6"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-lg font-black text-slate-950">
                          {team.name}
                        </p>
                        <p className="mt-1 text-xs text-slate-400">
                          {team.played} matches played
                        </p>
                      </div>

                      <div className="text-right">
                        <p className="text-xs font-bold uppercase text-slate-400">
                          Goal difference
                        </p>
                        <p className="text-xl font-black">
                          {gd > 0 ? "+" : ""}
                          {gd}
                        </p>
                      </div>
                    </div>

                    <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
                      <div className="rounded-xl bg-slate-50 p-3">
                        <p className="text-[10px] font-bold uppercase text-slate-400">
                          Win
                        </p>
                        <p className="mt-1 text-lg font-black">
                          {team.played
                            ? percentage(
                                team.wins,
                                team.played
                              )
                            : "0.0%"}
                        </p>
                      </div>

                      <div className="rounded-xl bg-slate-50 p-3">
                        <p className="text-[10px] font-bold uppercase text-slate-400">
                          Unbeaten
                        </p>
                        <p className="mt-1 text-lg font-black">
                          {unbeaten}
                        </p>
                      </div>

                      <div className="rounded-xl bg-slate-50 p-3">
                        <p className="text-[10px] font-bold uppercase text-slate-400">
                          Scoring
                        </p>
                        <p className="mt-1 text-lg font-black">
                          {scoringRate}
                        </p>
                      </div>

                      <div className="rounded-xl bg-slate-50 p-3">
                        <p className="text-[10px] font-bold uppercase text-slate-400">
                          Clean
                        </p>
                        <p className="mt-1 text-lg font-black">
                          {cleanRate}
                        </p>
                      </div>

                      <div className="rounded-xl bg-slate-50 p-3">
                        <p className="text-[10px] font-bold uppercase text-slate-400">
                          BTTS
                        </p>
                        <p className="mt-1 text-lg font-black">
                          {bttsRate}
                        </p>
                      </div>

                      <div className="rounded-xl bg-slate-50 p-3">
                        <p className="text-[10px] font-bold uppercase text-slate-400">
                          3+ goals
                        </p>
                        <p className="mt-1 text-lg font-black">
                          {threePlusRate}
                        </p>
                      </div>

                      <div className="rounded-xl bg-slate-50 p-3">
                        <p className="text-[10px] font-bold uppercase text-slate-400">
                          First scored
                        </p>
                        <p className="mt-1 text-lg font-black">
                          {team.scoredFirst}
                        </p>
                      </div>

                      <div className="rounded-xl bg-slate-50 p-3">
                        <p className="text-[10px] font-bold uppercase text-slate-400">
                          Failed
                        </p>
                        <p className="mt-1 text-lg font-black">
                          {team.failedToScore}
                        </p>
                      </div>
                    </div>

                    <div className="mt-5">
                      <p className="text-xs font-black uppercase tracking-wider text-slate-400">
                        Goal timing
                      </p>

                      <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-6">
                        {periodLabels.map((label) => (
                          <div
                            key={label}
                            className="rounded-lg bg-slate-50 p-2 text-center"
                          >
                            <p className="text-[10px] font-bold text-slate-400">
                              {label}
                            </p>
                            <p className="mt-1 font-black">
                              {team.goalsByPeriod[label]}
                            </p>
                          </div>
                        ))}
                      </div>

                      <div className="mt-3 flex justify-between text-xs text-slate-500">
                        <span>
                          1st half:{" "}
                          <strong className="text-slate-900">
                            {team.firstHalfGoals}
                          </strong>
                        </span>
                        <span>
                          2nd half:{" "}
                          <strong className="text-slate-900">
                            {team.secondHalfGoals}
                          </strong>
                        </span>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>

          {/* GOAL TIMING */}
          <section className="mt-8 grid gap-6 lg:grid-cols-2">
            <div className="rounded-2xl border border-slate-200 bg-white p-6">
              <p className="text-xs font-black uppercase tracking-wider text-sky-600">
                Goal timing
              </p>
              <h2 className="mt-1 text-xl font-black">
                When are goals being scored?
              </h2>

              <div className="mt-5 grid grid-cols-2 gap-3">
                <div className="rounded-xl bg-slate-50 p-4">
                  <p className="text-xs font-bold uppercase text-slate-400">
                    First half
                  </p>
                  <p className="mt-1 text-3xl font-black">
                    {firstHalfGoals}
                  </p>
                  <p className="mt-1 text-xs text-slate-400">
                    {percentage(
                      firstHalfGoals,
                      firstHalfGoals + secondHalfGoals
                    )}
                  </p>
                </div>

                <div className="rounded-xl bg-slate-50 p-4">
                  <p className="text-xs font-bold uppercase text-slate-400">
                    Second half
                  </p>
                  <p className="mt-1 text-3xl font-black">
                    {secondHalfGoals}
                  </p>
                  <p className="mt-1 text-xs text-slate-400">
                    {percentage(
                      secondHalfGoals,
                      firstHalfGoals + secondHalfGoals
                    )}
                  </p>
                </div>
              </div>

              <div className="mt-6 space-y-3">
                {periodTotals.map((item) => {
                  const total = Math.max(
                    ...periodTotals.map(
                      (period) => period.count
                    ),
                    1
                  );

                  return (
                    <div key={item.label}>
                      <div className="mb-1 flex justify-between text-xs font-bold">
                        <span>{item.label}</span>
                        <span>{item.count}</span>
                      </div>

                      <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                        <div
                          className="h-full rounded-full bg-sky-500"
                          style={{
                            width: `${(
                              (item.count / total) *
                              100
                            ).toFixed(1)}%`,
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-6">
              <p className="text-xs font-black uppercase tracking-wider text-sky-600">
                Competition records
              </p>
              <h2 className="mt-1 text-xl font-black">
                Match records
              </h2>

              <div className="mt-5 space-y-3">
                <div className="rounded-xl bg-slate-50 p-4">
                  <p className="text-xs font-bold uppercase text-slate-400">
                    Highest-scoring match
                  </p>

                  {highestScoringMatch ? (
                    <>
                      <p className="mt-2 font-black">
                        {(Array.isArray(highestScoringMatch.home_team)
                          ? highestScoringMatch.home_team[0]
                          : highestScoringMatch.home_team)?.name}{" "}
                        {highestScoringMatch.home_score}–{" "}
                        {highestScoringMatch.away_score}{" "}
                        {(Array.isArray(highestScoringMatch.away_team)
                          ? highestScoringMatch.away_team[0]
                          : highestScoringMatch.away_team)?.name}
                      </p>

                      <p className="mt-1 text-xs text-slate-400">
                        {Number(
                          highestScoringMatch.home_score
                        ) +
                          Number(
                            highestScoringMatch.away_score
                          )}{" "}
                        total goals
                      </p>
                    </>
                  ) : (
                    <p className="mt-2 text-sm text-slate-400">
                      No recorded match data.
                    </p>
                  )}
                </div>

                <div className="rounded-xl bg-slate-50 p-4">
                  <p className="text-xs font-bold uppercase text-slate-400">
                    Biggest winning margin
                  </p>
                  <p className="mt-2 text-2xl font-black">
                    {biggestMargin}
                  </p>
                </div>

                <div className="rounded-xl bg-slate-50 p-4">
                  <p className="text-xs font-bold uppercase text-slate-400">
                    Matches with both teams scoring
                  </p>
                  <p className="mt-2 text-2xl font-black">
                    {bttsMatches}
                  </p>
                  <p className="mt-1 text-xs text-slate-400">
                    {percentage(
                      bttsMatches,
                      totalMatches
                    )}{" "}
                    of completed matches
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* STREAKS */}
          <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-6">
            <p className="text-xs font-black uppercase tracking-wider text-sky-600">
              Streaks
            </p>
            <h2 className="mt-1 text-xl font-black">
              Team runs
            </h2>

            <div className="mt-5 overflow-x-auto">
              <table className="w-full min-w-[900px] text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-[11px] font-black uppercase text-slate-400">
                    <th className="px-3 py-3">Team</th>
                    <th className="px-3 py-3">Current unbeaten</th>
                    <th className="px-3 py-3">Longest unbeaten</th>
                    <th className="px-3 py-3">Current wins</th>
                    <th className="px-3 py-3">Longest wins</th>
                  </tr>
                </thead>

                <tbody>
                  {sortedTeams.map((team) => (
                    <tr
                      key={team.id}
                      className="border-b border-slate-100 last:border-0"
                    >
                      <td className="px-3 py-4 font-black">
                        {team.name}
                      </td>
                      <td className="px-3 py-4">
                        {currentStreak(
                          team.results,
                          ["W", "D"]
                        )}
                      </td>
                      <td className="px-3 py-4">
                        {longestStreak(
                          team.results,
                          ["W", "D"]
                        )}
                      </td>
                      <td className="px-3 py-4">
                        {currentStreak(
                          team.results,
                          ["W"]
                        )}
                      </td>
                      <td className="px-3 py-4">
                        {longestStreak(
                          team.results,
                          ["W"]
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <p className="mt-6 text-xs leading-5 text-slate-400">
            Match-result statistics are calculated from recorded
            scores in Supabase. Goal-timing and first-scoring
            statistics use recorded goal events. Where an event has
            no recorded minute or team, it is not used for timing
            calculations.
          </p>
        </div>
      </main>
    </>
  );
}
