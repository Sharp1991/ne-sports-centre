import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Header from "@/components/Header";
import { supabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

type Team = {
  id: number;
  name: string;
  short_name: string | null;
  crest_url: string | null;
};

type MatchTeam = {
  id: number;
  name: string;
  short_name: string | null;
  crest_url: string | null;
};

type Match = {
  id: number;
  competition: string | null;
  season: string | null;
  matchday: number | null;
  date: string;
  venue: string | null;
  time: string | null;
  home_team_id: number | null;
  away_team_id: number | null;
  home_score: number | null;
  away_score: number | null;
  result_type: string | null;
  status: string | null;
  home_team: MatchTeam | MatchTeam[] | null;
  away_team: MatchTeam | MatchTeam[] | null;
};

type GoalEvent = {
  player_id: number | string | null;
  player_name_raw: string | null;
};

type PlayerRow = {
  id: number | string;
  name: string | null;
  photo_url: string | null;
  Jersey: number | string | null;
};

type TopScorer = {
  key: string;
  name: string;
  goals: number;
  photoUrl: string | null;
  jersey: number | string | null;
};

type CompetitionEdition = {
  id: number;
  competition: string;
  season: string;
  status: string;
  champion_team_id: number | null;
  runner_up_team_id: number | null;
};

type CompetitionMovement = {
  id: number;
  competition_edition_id: number;
  team_id: number;
  movement_type: string;
  destination_edition_id: number | null;
  notes: string | null;
};

type PageProps = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{
    season?: string | string[];
    competition?: string | string[];
    historySeason?: string | string[];
  }>;
};

function getTeamId(slug: string) {
  const match = slug.match(/-(\d+)$/);
  return match ? Number(match[1]) : null;
}

function getRelatedTeam(
  team: MatchTeam | MatchTeam[] | null
): MatchTeam | null {
  return Array.isArray(team) ? team[0] || null : team;
}

function isCompleted(match: Match) {
  const status = match.status?.toLowerCase();

  return (
    (status === "finished" || status === "completed") &&
    match.home_score !== null &&
    match.away_score !== null
  );
}

function formatDate(date: string) {
  return new Date(`${date}T00:00:00`).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const id = getTeamId(slug);

  if (!id) return { title: "Club" };

  const { data: team } = await supabase
    .from("teams")
    .select("id, name, short_name")
    .eq("id", id)
    .maybeSingle();

  if (!team) return { title: "Club" };

  return {
    title: `${team.name} - Club Profile`,
    description: `Follow ${team.name} on Highland Football. View club statistics, football results and upcoming fixtures.`,
    alternates: {
      canonical: `/teams/${slug}`,
    },
    openGraph: {
      title: `${team.name} | Highland Football`,
      description: `Club statistics, results and fixtures for ${team.name}.`,
      type: "website",
    },
  };
}

export default async function TeamProfilePage({
  params,
  searchParams,
}: PageProps) {
  const { slug } = await params;
  const filters = await searchParams;
  const teamId = getTeamId(slug);

  if (!teamId) notFound();

  const { data: teamData, error: teamError } = await supabase
    .from("teams")
    .select("id, name, short_name, crest_url")
    .eq("id", teamId)
    .maybeSingle();

  if (teamError || !teamData) notFound();

  const team = teamData as Team;

  const { data: matchData, error: matchError } = await supabase
    .from("matches")
    .select(`
      id,
      competition,
      season,
      matchday,
      date,
      venue,
      time,
      home_team_id,
      away_team_id,
      home_score,
      away_score,
      result_type,
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
    .or(`home_team_id.eq.${teamId},away_team_id.eq.${teamId}`)
    .order("date", { ascending: false });

  const matches = (matchData || []) as Match[];

  // Club history records are loaded independently of the statistics filters.
  const [
    { data: editionData, error: editionError },
    { data: movementData, error: movementError },
  ] = await Promise.all([
    supabase
      .from("competition_editions")
      .select("id, competition, season, status, champion_team_id, runner_up_team_id"),
    supabase
      .from("competition_edition_movements")
      .select("id, competition_edition_id, team_id, movement_type, destination_edition_id, notes")
      .eq("team_id", team.id),
  ]);

  const editions = (editionData || []) as CompetitionEdition[];
  const movements = (movementData || []) as CompetitionMovement[];
  const editionsById = new Map(editions.map((edition) => [edition.id, edition]));

  const historySeasons = [...new Set([
    ...matches.map((match) => match.season),
    ...editions
      .filter((edition) =>
        edition.champion_team_id === team.id ||
        edition.runner_up_team_id === team.id
      )
      .map((edition) => edition.season),
    ...movements.map((movement) =>
      editionsById.get(movement.competition_edition_id)?.season
    ),
  ].filter((season): season is string => Boolean(season)))].sort(
    (a, b) => b.localeCompare(a, undefined, { numeric: true })
  );

  const requestedHistorySeason =
    typeof filters.historySeason === "string"
      ? filters.historySeason
      : "all";

  const selectedHistorySeason = historySeasons.includes(requestedHistorySeason)
    ? requestedHistorySeason
    : "all";

  const honours = editions
    .filter((edition) =>
      edition.status === "completed" &&
      (edition.champion_team_id === team.id ||
        edition.runner_up_team_id === team.id)
    )
    .sort((a, b) =>
      b.season.localeCompare(a.season, undefined, { numeric: true }) ||
      a.competition.localeCompare(b.competition)
    );

  const filteredHonours = honours.filter((edition) =>
    selectedHistorySeason === "all" ||
    edition.season === selectedHistorySeason
  );

  const competitionHistoryMap = new Map<
    string,
    { competition: string; season: string; matchCount: number }
  >();

  for (const match of matches) {
    if (!match.competition || !match.season) continue;

    const key = `${match.competition}::${match.season}`;
    const existing = competitionHistoryMap.get(key);

    if (existing) {
      existing.matchCount += 1;
    } else {
      competitionHistoryMap.set(key, {
        competition: match.competition,
        season: match.season,
        matchCount: 1,
      });
    }
  }

  const competitionHistory = [...competitionHistoryMap.values()].sort(
    (a, b) =>
      b.season.localeCompare(a.season, undefined, { numeric: true }) ||
      a.competition.localeCompare(b.competition)
  );

  const filteredCompetitionHistory = competitionHistory.filter((item) =>
    selectedHistorySeason === "all" ||
    item.season === selectedHistorySeason
  );

  const teamMovements = movements
    .map((movement) => ({
      ...movement,
      sourceEdition: editionsById.get(movement.competition_edition_id),
      destinationEdition: movement.destination_edition_id
        ? editionsById.get(movement.destination_edition_id)
        : undefined,
    }))
    .filter((movement) => Boolean(movement.sourceEdition))
    .sort((a, b) =>
      (b.sourceEdition?.season || "").localeCompare(
        a.sourceEdition?.season || "",
        undefined,
        { numeric: true }
      )
    );

  const filteredTeamMovements = teamMovements.filter((movement) =>
    selectedHistorySeason === "all" ||
    movement.sourceEdition?.season === selectedHistorySeason
  );

  const championshipCount = honours.filter(
    (edition) => edition.champion_team_id === team.id
  ).length;

  const runnerUpCount = honours.filter(
    (edition) => edition.runner_up_team_id === team.id
  ).length;

  const promotionCount = teamMovements.filter(
    (movement) => movement.movement_type === "promoted"
  ).length;

  const relegationCount = teamMovements.filter(
    (movement) => movement.movement_type === "relegated"
  ).length;

  const seasons = [...new Set(
    matches.map((match) => match.season).filter(
      (season): season is string => Boolean(season)
    )
  )].sort((a, b) => b.localeCompare(a, undefined, { numeric: true }));

  const competitions = [...new Set(
    matches.map((match) => match.competition).filter(
      (competition): competition is string => Boolean(competition)
    )
  )].sort((a, b) => a.localeCompare(b));

  const requestedSeason =
    typeof filters.season === "string" ? filters.season : "all";

  const requestedCompetition =
    typeof filters.competition === "string"
      ? filters.competition
      : "all";

  const selectedSeason = seasons.includes(requestedSeason)
    ? requestedSeason
    : "all";

  const selectedCompetition = competitions.includes(requestedCompetition)
    ? requestedCompetition
    : "all";

  const filteredMatches = matches.filter((match) => {
    const seasonMatches =
      selectedSeason === "all" || match.season === selectedSeason;

    const competitionMatches =
      selectedCompetition === "all" ||
      match.competition === selectedCompetition;

    return seasonMatches && competitionMatches;
  });


  const completedMatches = filteredMatches.filter(isCompleted);

  // Top scorers: count recorded goals in the selected completed matches.
  // Own goals are excluded by selecting only goal/GOAL events.
  const completedMatchIds = completedMatches.map((match) => match.id);
  let topScorers: TopScorer[] = [];
  let scorerLoadError = false;

  if (completedMatchIds.length > 0) {
    const { data: goalData, error: goalError } = await supabase
      .from("match_events")
      .select("player_id, player_name_raw")
      .eq("team_id", team.id)
      .in("match_id", completedMatchIds)
      .in("type", ["goal", "GOAL"]);

    if (goalError) {
      scorerLoadError = true;
    } else if (goalData?.length) {
      const events = goalData as GoalEvent[];
      const playerIds = [
        ...new Set(
          events
            .map((event) => event.player_id)
            .filter((id) => id !== null && id !== undefined)
        ),
      ];

      let playerRows: PlayerRow[] = [];

      if (playerIds.length > 0) {
        const { data: players } = await supabase
          .from("players")
          .select("id, name, photo_url, Jersey")
          .in("id", playerIds);

        playerRows = (players || []) as PlayerRow[];
      }

      const playersById = new Map(
        playerRows.map((player) => [String(player.id), player])
      );

      const normalizeName = (name: string) =>
        name.trim().toLowerCase().replace(/\\s+/g, " ");

      const playersByName = new Map(
        playerRows
          .filter((player) => player.name)
          .map((player) => [normalizeName(player.name!), player])
      );

      const scorerMap = new Map<string, TopScorer>();

      for (const event of events) {
        const rawName = event.player_name_raw?.trim() || "";
        const linkedPlayer =
          event.player_id !== null
            ? playersById.get(String(event.player_id))
            : undefined;

        const player =
          linkedPlayer ||
          (rawName ? playersByName.get(normalizeName(rawName)) : undefined);

        const name = player?.name?.trim() || rawName;
        if (!name) continue;

        const key = player
          ? `player:${player.id}`
          : event.player_id !== null
            ? `id:${event.player_id}`
            : `name:${normalizeName(name)}`;

        const existing = scorerMap.get(key);

        if (existing) {
          existing.goals += 1;
        } else {
          scorerMap.set(key, {
            key,
            name,
            goals: 1,
            photoUrl: player?.photo_url || null,
            jersey: player?.Jersey ?? null,
          });
        }
      }

      const allScorers = [...scorerMap.values()];
      const highestGoals = Math.max(
        0,
        ...allScorers.map((scorer) => scorer.goals)
      );

      topScorers = allScorers
        .filter((scorer) => scorer.goals === highestGoals)
        .sort((a, b) => a.name.localeCompare(b.name));
    }
  }

  const statistics = completedMatches.reduce(
    (stats, match) => {
      const isHome = match.home_team_id === team.id;
      const goalsFor = isHome ? match.home_score! : match.away_score!;
      const goalsAgainst = isHome ? match.away_score! : match.home_score!;

      stats.played += 1;
      stats.goalsFor += goalsFor;
      stats.goalsAgainst += goalsAgainst;

      if (match.id === 80 && match.result_type === "penalties_home") {
        if (isHome) {
          stats.wins += 1;
        } else {
          stats.losses += 1;
        }
      } else if (goalsFor > goalsAgainst) {
        stats.wins += 1;
      } else if (goalsFor < goalsAgainst) {
        stats.losses += 1;
      } else {
        stats.draws += 1;
      }

      return stats;
    },
    {
      played: 0,
      wins: 0,
      draws: 0,
      losses: 0,
      goalsFor: 0,
      goalsAgainst: 0,
    }
  );

  const goalDifference =
    statistics.goalsFor - statistics.goalsAgainst;

  const recentResults = completedMatches
    .slice()
    .sort((a, b) =>
      b.date.localeCompare(a.date) || b.id - a.id
    )
    .slice(0, 10);

  const today = new Date().toLocaleDateString("en-CA", {
    timeZone: "Asia/Kolkata",
  });

  const upcomingFixtures = filteredMatches
    .filter((match) => {
      const status = match.status?.toLowerCase();

      return (
        match.date >= today &&
        status !== "finished" &&
        status !== "completed" &&
        status !== "cancelled"
      );
    })
    .sort((a, b) =>
      a.date.localeCompare(b.date) || a.id - b.id
    )
    .slice(0, 10);

  return (
    <>
      <Header />

      <main className="mx-auto min-h-screen w-full max-w-7xl px-5 py-10">
        <Link
          href="/teams"
          className="text-sm font-bold text-[var(--primary-dark)] hover:underline"
        >
          ← All Teams
        </Link>

        {/* Club identity */}
        <section className="mt-6 rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-6 sm:p-8">
          <div className="flex flex-col items-center gap-6 sm:flex-row">
            <div className="flex h-28 w-28 shrink-0 items-center justify-center rounded-2xl bg-[var(--background)] p-4">
              {team.crest_url ? (
                <img
                  src={team.crest_url}
                  alt={`${team.name} crest`}
                  className="h-full w-full object-contain"
                />
              ) : (
                <span className="text-3xl font-black text-[var(--primary-dark)]">
                  {(team.short_name || team.name)
                    .slice(0, 2)
                    .toUpperCase()}
                </span>
              )}
            </div>

            <div className="text-center sm:text-left">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--primary-dark)]">
                Highland Football · Club Profile
              </p>

              <h1 className="mt-2 text-3xl font-black tracking-tight text-[var(--foreground)] sm:text-4xl">
                {team.name}
              </h1>

              {team.short_name && team.short_name !== team.name && (
                <p className="mt-2 text-sm text-[var(--foreground)] opacity-60">
                  {team.short_name}
                </p>
              )}
            </div>
          </div>

          <div className="mt-7 border-t border-[var(--border)] pt-5">
            <h2 className="font-black text-[var(--foreground)]">
              About the club
            </h2>
            <p className="mt-2 max-w-3xl text-sm leading-7 text-[var(--foreground)] opacity-70">
              Follow {team.name} on Highland Football. Explore its recorded
              match history, competition statistics, results and upcoming
              fixtures.
            </p>
          </div>
        </section>

        {/* Filters */}
        <section className="mt-10">
          <div>
            <h2 className="text-2xl font-black text-[var(--foreground)]">
              Club Statistics
            </h2>
            <p className="mt-2 text-sm text-[var(--foreground)] opacity-60">
              Filter recorded results by season and competition.
            </p>
          </div>

          <form
            action={`/teams/${slug}`}
            method="GET"
            className="mt-5 flex flex-col gap-4 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 sm:flex-row sm:items-end"
          >
            <input
              type="hidden"
              name="historySeason"
              value={selectedHistorySeason}
            />
            <div className="flex-1">
              <label
                htmlFor="season"
                className="mb-2 block text-xs font-bold uppercase tracking-wider text-[var(--foreground)] opacity-70"
              >
                Season
              </label>
              <select
                id="season"
                name="season"
                defaultValue={selectedSeason}
                className="w-full rounded-xl border border-[var(--border)] bg-[var(--background)] px-4 py-3 text-sm text-[var(--foreground)] outline-none focus:border-[var(--primary)]"
              >
                <option value="all">All Seasons</option>
                {seasons.map((season) => (
                  <option key={season} value={season}>
                    {season}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex-1">
              <label
                htmlFor="competition"
                className="mb-2 block text-xs font-bold uppercase tracking-wider text-[var(--foreground)] opacity-70"
              >
                Competition
              </label>
              <select
                id="competition"
                name="competition"
                defaultValue={selectedCompetition}
                className="w-full rounded-xl border border-[var(--border)] bg-[var(--background)] px-4 py-3 text-sm text-[var(--foreground)] outline-none focus:border-[var(--primary)]"
              >
                <option value="all">All Competitions</option>
                {competitions.map((competition) => (
                  <option key={competition} value={competition}>
                    {competition}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="submit"
              className="rounded-xl bg-[var(--primary-dark)] px-6 py-3 text-sm font-bold text-white transition hover:opacity-90"
            >
              Apply Filters
            </button>
          </form>

          {/* Statistics cards */}
          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
            {[
              { label: "Played", value: statistics.played },
              { label: "Won", value: statistics.wins },
              { label: "Drawn", value: statistics.draws },
              { label: "Lost", value: statistics.losses },
              { label: "Goals For", value: statistics.goalsFor },
              { label: "Goals Against", value: statistics.goalsAgainst },
              {
                label: "Goal Difference",
                value: goalDifference > 0 ? `+${goalDifference}` : goalDifference,
              },
            ].map((item) => (
              <div
                key={item.label}
                className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4"
              >
                <p className="text-xs font-bold text-[var(--foreground)] opacity-60">
                  {item.label}
                </p>
                <p className="mt-2 text-2xl font-black text-[var(--foreground)]">
                  {item.value}
                </p>
              </div>
            ))}
          </div>

          <p className="mt-3 text-xs text-[var(--foreground)] opacity-50">
            Statistics are calculated from {statistics.played} completed
            matches with recorded scores.
          </p>
        </section>

        {/* Top scorer */}
        <section className="mt-10">
          <div className="border-b border-[var(--border)] pb-4">
            <h2 className="text-xl font-black text-[var(--foreground)]">
              {topScorers.length > 1 ? "Top Scorers" : "Top Scorer"}
            </h2>
            <p className="mt-1 text-xs text-[var(--foreground)] opacity-60">
              Leading goal scorer{topScorers.length > 1 ? "s" : ""} for {team.name}
            </p>
          </div>

          <div className="mt-5">
            {scorerLoadError ? (
              <EmptyMessage message="Unable to load top scorer statistics." />
            ) : topScorers.length === 0 ? (
              <EmptyMessage message="No recorded goals found for these filters." />
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {topScorers.map((scorer) => (
                  <div
                    key={scorer.key}
                    className="flex items-center gap-4 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5"
                  >
                    <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[var(--background)]">
                      {scorer.photoUrl ? (
                        <img
                          src={scorer.photoUrl}
                          alt={scorer.name}
                          className="h-full w-full object-cover"
                          loading="lazy"
                        />
                      ) : (
                        <svg
                          viewBox="0 0 64 64"
                          className="h-14 w-14 text-[var(--primary-dark)] opacity-60"
                          fill="currentColor"
                          aria-hidden="true"
                        >
                          <circle cx="32" cy="21" r="12" />
                          <path d="M10 57c1-13 10-21 22-21s21 8 22 21H10z" />
                        </svg>
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold uppercase tracking-wider text-[var(--primary-dark)]">
                        {topScorers.length > 1 ? "Joint top scorer" : "Top scorer"}
                      </p>
                      <h3 className="mt-1 break-words text-base font-black text-[var(--foreground)]">
                        {scorer.name}
                      </h3>
                      {scorer.jersey !== null &&
                        String(scorer.jersey).trim() !== "" && (
                          <p className="mt-1 text-xs text-[var(--foreground)] opacity-60">
                            No. {scorer.jersey}
                          </p>
                        )}
                      <p className="mt-2 text-sm font-bold text-[var(--primary-dark)]">
                        {scorer.goals} {scorer.goals === 1 ? "Goal" : "Goals"}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Results and fixtures */}
        <div className="mt-12 grid grid-cols-1 gap-10 lg:grid-cols-2">
          <section>
            <div className="flex items-center justify-between border-b border-[var(--border)] pb-4">
              <div>
                <h2 className="text-xl font-black text-[var(--foreground)]">
                  Recent Results
                </h2>
                <p className="mt-1 text-xs text-[var(--foreground)] opacity-60">
                  Latest completed matches
                </p>
              </div>
              <span className="text-xs font-bold text-[var(--primary-dark)]">
                {recentResults.length} matches
              </span>
            </div>

            <div className="mt-5 space-y-3">
              {matchError ? (
                <EmptyMessage message="Unable to load club results." />
              ) : recentResults.length === 0 ? (
                <EmptyMessage message="No completed results found for these filters." />
              ) : (
                recentResults.map((match) => (
                  <ClubMatchCard
                    key={match.id}
                    match={match}
                    teamId={team.id}
                    completed
                  />
                ))
              )}
            </div>
          </section>

          <section>
            <div className="flex items-center justify-between border-b border-[var(--border)] pb-4">
              <div>
                <h2 className="text-xl font-black text-[var(--foreground)]">
                  Upcoming Fixtures
                </h2>
                <p className="mt-1 text-xs text-[var(--foreground)] opacity-60">
                  Scheduled matches
                </p>
              </div>
              <span className="text-xs font-bold text-[var(--primary-dark)]">
                {upcomingFixtures.length} fixtures
              </span>
            </div>

            <div className="mt-5 space-y-3">
              {matchError ? (
                <EmptyMessage message="Unable to load club fixtures." />
              ) : upcomingFixtures.length === 0 ? (
                <EmptyMessage message="No upcoming fixtures found for these filters." />
              ) : (
                upcomingFixtures.map((match) => (
                  <ClubMatchCard
                    key={match.id}
                    match={match}
                    teamId={team.id}
                    completed={false}
                  />
                ))
              )}
            </div>
          </section>
        </div>

        {/* Club history */}
        <section className="mt-12">
          <div className="border-b border-[var(--border)] pb-4">
            <h2 className="text-2xl font-black text-[var(--foreground)]">
              Club History
            </h2>
            <p className="mt-2 text-sm text-[var(--foreground)] opacity-60">
              Honours, competitions played, promotions and relegations.
            </p>
          </div>

          <form
            action={`/teams/${slug}`}
            method="GET"
            className="mt-5 flex flex-col gap-4 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 sm:flex-row sm:items-end"
          >
            <input type="hidden" name="season" value={selectedSeason} />
            <input
              type="hidden"
              name="competition"
              value={selectedCompetition}
            />

            <div className="flex-1">
              <label
                htmlFor="historySeason"
                className="mb-2 block text-xs font-bold uppercase tracking-wider text-[var(--foreground)] opacity-70"
              >
                History Year
              </label>
              <select
                id="historySeason"
                name="historySeason"
                defaultValue={selectedHistorySeason}
                className="w-full rounded-xl border border-[var(--border)] bg-[var(--background)] px-4 py-3 text-sm text-[var(--foreground)] outline-none focus:border-[var(--primary)]"
              >
                <option value="all">All Seasons</option>
                {historySeasons.map((season) => (
                  <option key={season} value={season}>
                    {season}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="submit"
              className="rounded-xl bg-[var(--primary-dark)] px-6 py-3 text-sm font-bold text-white transition hover:opacity-90"
            >
              Apply Year
            </button>
          </form>

          {/* Overall history totals remain visible for every year selection. */}
          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { label: "Championships", value: championshipCount },
              { label: "Runner-up Finishes", value: runnerUpCount },
              { label: "Promotions", value: promotionCount },
              { label: "Relegations", value: relegationCount },
            ].map((item) => (
              <div
                key={item.label}
                className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4"
              >
                <p className="text-xs font-bold text-[var(--foreground)] opacity-60">
                  {item.label}
                </p>
                <p className="mt-2 text-2xl font-black text-[var(--foreground)]">
                  {item.value}
                </p>
              </div>
            ))}
          </div>

          {/* Honours */}
          <div className="mt-10">
            <h3 className="text-xl font-black text-[var(--foreground)]">
              Honours
            </h3>
            <p className="mt-1 text-xs text-[var(--foreground)] opacity-60">
              Confirmed championships and runner-up finishes.
            </p>

            <div className="mt-4 space-y-3">
              {editionError ? (
                <EmptyMessage message="Unable to load club honours." />
              ) : filteredHonours.length === 0 ? (
                <EmptyMessage message="No honours recorded for this year." />
              ) : (
                filteredHonours.map((edition) => {
                  const isChampion = edition.champion_team_id === team.id;

                  return (
                    <div
                      key={edition.id}
                      className="flex flex-col justify-between gap-2 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 sm:flex-row sm:items-center"
                    >
                      <div>
                        <p className="font-bold text-[var(--foreground)]">
                          {edition.competition}
                        </p>
                        <p className="mt-1 text-xs text-[var(--foreground)] opacity-60">
                          {edition.season}
                        </p>
                      </div>
                      <span className="text-sm font-bold text-[var(--primary-dark)]">
                        {isChampion ? "Champions" : "Runner-up"}
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Competitions played */}
          <div className="mt-10">
            <h3 className="text-xl font-black text-[var(--foreground)]">
              Competitions Played
            </h3>
            <p className="mt-1 text-xs text-[var(--foreground)] opacity-60">
              Competition participation based on the club's recorded matches.
            </p>

            <div className="mt-4 space-y-3">
              {matchError ? (
                <EmptyMessage message="Unable to load competition history." />
              ) : filteredCompetitionHistory.length === 0 ? (
                <EmptyMessage message="No competition participation recorded for this year." />
              ) : (
                filteredCompetitionHistory.map((item) => (
                  <div
                    key={`${item.competition}-${item.season}`}
                    className="flex flex-col justify-between gap-2 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 sm:flex-row sm:items-center"
                  >
                    <div>
                      <p className="font-bold text-[var(--foreground)]">
                        {item.competition}
                      </p>
                      <p className="mt-1 text-xs text-[var(--foreground)] opacity-60">
                        {item.season}
                      </p>
                    </div>
                    <span className="text-sm font-bold text-[var(--primary-dark)]">
                      {item.matchCount} recorded{" "}
                      {item.matchCount === 1 ? "match" : "matches"}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Promotions and relegations */}
          <div className="mt-10">
            <h3 className="text-xl font-black text-[var(--foreground)]">
              Promotions and Relegations
            </h3>
            <p className="mt-1 text-xs text-[var(--foreground)] opacity-60">
              Recorded division movements, shown against the source season.
            </p>

            <div className="mt-4 space-y-3">
              {movementError || editionError ? (
                <EmptyMessage message="Unable to load promotion and relegation records." />
              ) : filteredTeamMovements.length === 0 ? (
                <EmptyMessage message="No promotion or relegation recorded for this year." />
              ) : (
                filteredTeamMovements.map((movement) => (
                  <div
                    key={movement.id}
                    className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4"
                  >
                    <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
                      <p className="font-bold text-[var(--foreground)]">
                        {movement.movement_type === "promoted"
                          ? "Promoted"
                          : movement.movement_type === "relegated"
                            ? "Relegated"
                            : movement.movement_type}
                      </p>
                      <span className="text-xs text-[var(--foreground)] opacity-60">
                        {movement.sourceEdition?.season}
                      </span>
                    </div>

                    <p className="mt-2 text-sm text-[var(--foreground)] opacity-70">
                      {movement.sourceEdition?.competition}
                      {movement.destinationEdition
                        ? ` → ${movement.destinationEdition.competition} ${movement.destinationEdition.season}`
                        : ""}
                    </p>

                    {movement.notes && (
                      <p className="mt-2 text-xs text-[var(--foreground)] opacity-60">
                        {movement.notes}
                      </p>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </section>
      </main>
    </>
  );
}

function EmptyMessage({ message }: { message: string }) {
  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 text-center text-sm text-[var(--foreground)] opacity-60">
      {message}
    </div>
  );
}

function ClubMatchCard({
  match,
  teamId,
  completed,
}: {
  match: Match;
  teamId: number;
  completed: boolean;
}) {
  const home = getRelatedTeam(match.home_team);
  const away = getRelatedTeam(match.away_team);

  return (
    <Link
      href={`/matches/${match.id}`}
      className="block rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 transition hover:border-[var(--primary)] hover:shadow-sm"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-xs font-bold text-[var(--primary-dark)]">
          {match.competition || "Competition"}
          {match.season ? ` · ${match.season}` : ""}
        </span>
        <span className="text-xs text-[var(--foreground)] opacity-60">
          {formatDate(match.date)}
        </span>
      </div>

      <div className="mt-4 grid grid-cols-[1fr_auto_1fr] items-center gap-2">
        <MatchSide team={home} align="right" teamId={teamId} />

        <div className="text-center">
          <p className="text-xl font-black tabular-nums text-[var(--foreground)]">
            {completed
              ? `${match.home_score} - ${match.away_score}`
              : match.time || "VS"}
          </p>
          <p className="mt-1 text-[10px] font-bold uppercase tracking-wider text-[var(--foreground)] opacity-50">
            {completed ? "Final" : "Fixture"}
          </p>
        </div>

        <MatchSide team={away} align="left" teamId={teamId} />
      </div>

      {match.venue && (
        <p className="mt-4 border-t border-[var(--border)] pt-3 text-center text-xs text-[var(--foreground)] opacity-50">
          {match.venue}
        </p>
      )}
    </Link>
  );
}

function MatchSide({
  team,
  align,
  teamId,
}: {
  team: MatchTeam | null;
  align: "left" | "right";
  teamId: number;
}) {
  const isClub = team?.id === teamId;

  return (
    <div
      className={`flex min-w-0 items-center gap-2 ${
        align === "right" ? "justify-end" : "justify-start"
      }`}
    >
      {align === "right" && (
        <span
          className={`min-w-0 break-words text-right text-xs font-bold sm:text-sm ${
            isClub
              ? "text-[var(--primary-dark)]"
              : "text-[var(--foreground)]"
          }`}
        >
          {team?.short_name || team?.name || "TBD"}
        </span>
      )}

      {team?.crest_url ? (
        <img
          src={team.crest_url}
          alt=""
          className="h-8 w-8 shrink-0 object-contain"
          loading="lazy"
        />
      ) : (
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--background)] text-xs font-black text-[var(--primary-dark)]">
          {(team?.short_name || team?.name || "T").slice(0, 2).toUpperCase()}
        </span>
      )}

      {align === "left" && (
        <span
          className={`min-w-0 break-words text-xs font-bold sm:text-sm ${
            isClub
              ? "text-[var(--primary-dark)]"
              : "text-[var(--foreground)]"
          }`}
        >
          {team?.short_name || team?.name || "TBD"}
        </span>
      )}
    </div>
  );
}
