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
  status: string | null;
  home_team: MatchTeam | MatchTeam[] | null;
  away_team: MatchTeam | MatchTeam[] | null;
};

type PageProps = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{
    season?: string | string[];
    competition?: string | string[];
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

  const statistics = completedMatches.reduce(
    (stats, match) => {
      const isHome = match.home_team_id === team.id;
      const goalsFor = isHome ? match.home_score! : match.away_score!;
      const goalsAgainst = isHome ? match.away_score! : match.home_score!;

      stats.played += 1;
      stats.goalsFor += goalsFor;
      stats.goalsAgainst += goalsAgainst;

      if (goalsFor > goalsAgainst) {
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
