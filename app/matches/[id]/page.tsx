import type { Metadata } from "next";
import Link from "next/link";
import Header from "@/components/Header";
import { supabase } from "@/lib/supabase";
import Breadcrumbs from "@/components/seo/Breadcrumbs";
import BreadcrumbJsonLd from "@/components/seo/BreadcrumbJsonLd";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const statLabels: Record<string, string> = {
  possession: "Possession",
  expected_goals: "Expected goals",
  total_shots: "Total shots",
  shots_on_target: "Shots on target",
  shots_inside_box: "Shots inside box",
  shots_outside_box: "Shots outside box",
  shots_missed: "Shots missed",
  passing_accuracy: "Passing accuracy",
  total_passes_attempted: "Passes attempted",
  total_passes_completed: "Passes completed",
  forward_passes_completed: "Forward passes completed",
  key_passes: "Key passes",
  crosses: "Crosses",
  corners: "Corners",
  fouls: "Fouls",
  interceptions: "Interceptions",
  tackles_accuracy: "Tackles accuracy",
  successful_tackles: "Successful tackles",
  clearances: "Clearances",
  headers: "Headers",
  goal_kicks: "Goal kicks",
  goal_kick_accuracy: "Goal-kick accuracy",
  goalkeeper_throws: "Goalkeeper throws",
  goalkeeper_throw_accuracy: "Goalkeeper throw accuracy",
  total_saves: "Saves",
  successful_handling: "Successful handling",
  throw_ins: "Throw-ins",
  ppda: "PPDA",
  shot_accuracy: "Shot accuracy",
  shot_conversion: "Shot conversion",
  possession_retained: "Possession retained",
  avg_passing_chain_length: "Avg. passing chain length",
  defensive_actions_outside_box: "Defensive actions outside box",
  total_goal_kicks: "Total goal kicks",
};

function formatStatName(name: string) {
  return (
    statLabels[name] ||
    name
      .replace(/_/g, " ")
      .replace(/\b\w/g, (letter) => letter.toUpperCase())
  );
}

function minuteValue(minute: string | null) {
  if (!minute) return 999;

  const match = minute.match(/^(\d+)/);
  return match ? Number(match[1]) : 999;
}

function formatDate(date: string | null) {
  if (!date) return "Date TBC";

  return new Date(date).toLocaleDateString("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatTime(time: string | null) {
  if (!time) return "TBC";

  return new Date(`1970-01-01T${time.slice(0, 5)}:00`).toLocaleTimeString(
    "en-IN",
    {
      hour: "numeric",
      minute: "2-digit",
    }
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;

  const { data: match } = await supabase
    .from("matches")
    .select(`
      competition,
      season,
      home_score,
      away_score,
      home_team:teams!matches_home_team_id_fkey (
        name,
        short_name
      ),
      away_team:teams!matches_away_team_id_fkey (
        name,
        short_name
      )
    `)
    .eq("id", id)
    .maybeSingle();

  if (!match) {
    return {};
  }

  const homeTeam = Array.isArray(match.home_team)
    ? match.home_team[0]
    : match.home_team;

  const awayTeam = Array.isArray(match.away_team)
    ? match.away_team[0]
    : match.away_team;

  const homeName = homeTeam?.name || homeTeam?.short_name || "Home";
  const awayName = awayTeam?.name || awayTeam?.short_name || "Away";

  const title = `${homeName} vs ${awayName} — ${match.competition} ${match.season}`;

  const hasScore =
    match.home_score !== null && match.away_score !== null;

  const description = hasScore
    ? `${homeName} ${match.home_score}–${match.away_score} ${awayName} in ${match.competition} ${match.season}. View the match centre, events, lineups and statistics on Highland Football.`
    : `${homeName} vs ${awayName} in ${match.competition} ${match.season}. View match details, events, lineups and statistics on Highland Football.`;

  return {
    title,
    description,
    alternates: {
      canonical: `/matches/${id}`,
    },
  };
}

export default async function MatchCentrePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const { data: match, error: matchError } = await supabase
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
    .eq("id", id)
    .maybeSingle();

  if (matchError || !match) {
    return (
      <>
        <Header />
        <main className="mx-auto max-w-4xl px-5 py-16">
          <div className="rounded-3xl border border-sky-100 bg-white p-10 text-center">
            <p className="text-sm font-bold text-slate-400">
              Match not found
            </p>
            <Link
              href="/matches"
              className="mt-5 inline-block text-sm font-black text-sky-600"
            >
              ← Back to matches
            </Link>
          </div>
        </main>
      </>
    );
  }

  const [
    { data: events },
    { data: lineups },
    { data: stats },
  ] = await Promise.all([
    supabase
      .from("match_events")
      .select(
        "id, minute, type, team_id, player_id, player_name_raw, detail"
      )
      .eq("match_id", match.id)
      .order("id", { ascending: true }),

    supabase
      .from("match_lineups")
      .select(
        "id, team_id, player_id, player_name_raw, shirt_number, position, is_starting, sub_minute"
      )
      .eq("match_id", match.id)
      .order("is_starting", { ascending: false })
      .order("shirt_number", { ascending: true }),

    supabase
      .from("match_stats")
      .select("id, stat_name, home_value, away_value, locked")
      .eq("match_id", match.id)
      .order("id", { ascending: true }),
  ]);

  const teamIds = [
    match.home_team_id,
    match.away_team_id,
    ...(lineups || []).map((item) => item.team_id),
    ...(events || []).map((item) => item.team_id),
  ].filter(Boolean);

  const uniqueTeamIds = [...new Set(teamIds)];

  const { data: lineupTeams } = uniqueTeamIds.length
    ? await supabase
        .from("teams")
        .select("id, name, short_name, crest_url")
        .in("id", uniqueTeamIds)
    : { data: [] };

  const teamMap = new Map(
    (lineupTeams || []).map((team) => [team.id, team])
  );

  const homeTeam = Array.isArray(match.home_team)
    ? match.home_team[0]
    : match.home_team;

  const awayTeam = Array.isArray(match.away_team)
    ? match.away_team[0]
    : match.away_team;

  const homeLineup = (lineups || []).filter(
    (item) => item.team_id === match.home_team_id
  );

  const awayLineup = (lineups || []).filter(
    (item) => item.team_id === match.away_team_id
  );

  const hasEvents = (events || []).length > 0;
  const hasLineups = (lineups || []).length > 0;
  const hasStats = (stats || []).length > 0;

  const isFinished =
    match.status === "finished" ||
    match.status === "completed";

  const eventList = [...(events || [])].sort((a, b) => {
    const minuteDifference =
      minuteValue(a.minute) - minuteValue(b.minute);

    return minuteDifference !== 0
      ? minuteDifference
      : a.id - b.id;
  });

  const homeName = homeTeam?.name || homeTeam?.short_name || "Home";
  const awayName = awayTeam?.name || awayTeam?.short_name || "Away";
  const matchName = `${homeName} vs ${awayName}`;

  const matchJsonLd = {
    "@context": "https://schema.org",
    "@type": "SportsEvent",
    name: matchName,
    startDate: match.date
      ? `${match.date}${match.time ? `T${match.time}` : ""}`
      : undefined,
    location: match.venue
      ? {
          "@type": "Place",
          name: match.venue,
        }
      : undefined,
    homeTeam: {
      "@type": "SportsTeam",
      name: homeName,
    },
    awayTeam: {
      "@type": "SportsTeam",
      name: awayName,
    },
    sport: "Football",
    organizer: {
      "@type": "Organization",
      name: "Highland Football",
      url: "https://ne-sports-centre.vercel.app",
    },
    ...(match.home_score !== null &&
      match.away_score !== null && {
        eventStatus: "https://schema.org/EventCompleted",
        homeTeamScore: match.home_score,
        awayTeamScore: match.away_score,
      }),
  };

  return (
    <>
      <Header />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(matchJsonLd),
        }}
      />

      <BreadcrumbJsonLd
        items={[
          { name: "Leagues & Cups", href: "/competitions" },
          {
            name: match.competition,
            href: `/competitions/${encodeURIComponent(match.competition)}`,
          },
          {
            name: match.season,
            href: `/competitions/${encodeURIComponent(
              match.competition
            )}/${encodeURIComponent(match.season)}`,
          },
          {
            name: matchName,
            href: `/matches/${match.id}`,
          },
        ]}
      />

      <main className="min-h-screen bg-sky-50">
        <Breadcrumbs
          items={[
            { name: "Leagues & Cups", href: "/competitions" },
            {
              name: match.competition,
              href: `/competitions/${encodeURIComponent(match.competition)}`,
            },
            {
              name: match.season,
              href: `/competitions/${encodeURIComponent(
                match.competition
              )}/${encodeURIComponent(match.season)}`,
            },
            { name: matchName },
          ]}
        />
        <section className="border-b border-sky-100 bg-white">
          <div className="mx-auto max-w-6xl px-5 py-8 sm:py-12">
            <Link
              href="/matches"
              className="text-xs font-black uppercase tracking-wider text-sky-600"
            >
              ← All matches
            </Link>

            <div className="mt-6 text-center">
              <p className="text-xs font-black uppercase tracking-[0.2em] text-sky-600">
                {match.competition}
              </p>

              <p className="mt-1 text-xs font-bold text-slate-400">
                {match.season}
                {match.matchday
                  ? ` · Matchday ${match.matchday}`
                  : ""}
              </p>

              <div className="mx-auto mt-7 grid max-w-3xl grid-cols-[1fr_auto_1fr] items-center gap-4">
                <MatchTeam
                  team={homeTeam}
                  align="right"
                />

                <div className="min-w-[100px]">
                  {isFinished ? (
                    <div className="text-4xl font-black tracking-tight text-slate-900 sm:text-5xl">
                      {match.home_score ?? 0} -{" "}
                      {match.away_score ?? 0}
                    </div>
                  ) : (
                    <>
                      <div className="text-sm font-black uppercase text-slate-400">
                        VS
                      </div>
                      <div className="mt-1 text-xs font-bold text-sky-600">
                        {formatTime(match.time)}
                      </div>
                    </>
                  )}

                  <div className="mt-2 text-[10px] font-black uppercase tracking-wider text-slate-400">
                    {match.status || "Scheduled"}
                  </div>
                </div>

                <MatchTeam
                  team={awayTeam}
                  align="left"
                />
              </div>

              <div className="mt-7 flex flex-wrap justify-center gap-x-5 gap-y-2 text-xs font-semibold text-slate-400">
                <span>{formatDate(match.date)}</span>

                {match.venue && (
                  <>
                    <span>•</span>
                    <span>{match.venue}</span>
                  </>
                )}
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-5 py-6">
          <nav className="flex flex-wrap gap-2">
            <a
              href="#overview"
              className="rounded-full bg-sky-600 px-4 py-2 text-xs font-black text-white"
            >
              Overview
            </a>

            {hasEvents && (
              <a
                href="#events"
                className="rounded-full border border-sky-100 bg-white px-4 py-2 text-xs font-black text-slate-600 hover:border-sky-300"
              >
                Events
              </a>
            )}

            {hasLineups && (
              <a
                href="#lineups"
                className="rounded-full border border-sky-100 bg-white px-4 py-2 text-xs font-black text-slate-600 hover:border-sky-300"
              >
                Lineups
              </a>
            )}

            {hasStats && (
              <a
                href="#stats"
                className="rounded-full border border-sky-100 bg-white px-4 py-2 text-xs font-black text-slate-600 hover:border-sky-300"
              >
                Stats
              </a>
            )}
          </nav>
        </section>

        <section
          id="overview"
          className="mx-auto max-w-6xl px-5 pb-10"
        >
          {hasEvents && (
            <section
              id="events"
              className="mb-6 rounded-3xl border border-sky-100 bg-white p-5 sm:p-7"
            >
              <SectionTitle
                eyebrow="Match Centre"
                title="Events"
              />

              <div className="mt-6 space-y-3">
                {eventList.map((event) => {
                  const isHome =
                    event.team_id === match.home_team_id;

                  const type = String(event.type || "").toLowerCase();

                  let label = "Event";
                  let icon = "•";

                  if (type === "goal") {
                    label = "Goal";
                    icon = "⚽";
                  } else if (type === "own_goal") {
                    label = "Own goal";
                    icon = "⚽";
                  } else if (type === "yellow_card") {
                    label = "Yellow card";
                    icon = "🟨";
                  }

                  return (
                    <div
                      key={event.id}
                      className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 rounded-2xl bg-slate-50 px-4 py-3"
                    >
                      <div className="text-right">
                        {isHome && (
                          <>
                            <p className="text-sm font-black text-slate-800">
                              {event.player_name_raw ||
                                "Unknown player"}
                            </p>
                            {event.detail && (
                              <p className="mt-0.5 text-[10px] font-semibold text-slate-400">
                                {event.detail}
                              </p>
                            )}
                          </>
                        )}
                      </div>

                      <div className="text-center">
                        <div className="text-sm font-black text-slate-700">
                          {event.minute || "—"}'
                        </div>
                        <div className="mt-1 text-sm">
                          {icon}
                        </div>
                        <div className="mt-0.5 text-[9px] font-black uppercase tracking-wider text-slate-400">
                          {label}
                        </div>
                      </div>

                      <div className="text-left">
                        {!isHome && (
                          <>
                            <p className="text-sm font-black text-slate-800">
                              {event.player_name_raw ||
                                "Unknown player"}
                            </p>
                            {event.detail && (
                              <p className="mt-0.5 text-[10px] font-semibold text-slate-400">
                                {event.detail}
                              </p>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {hasLineups && (
            <section
              id="lineups"
              className="mb-6 rounded-3xl border border-sky-100 bg-white p-5 sm:p-7"
            >
              <SectionTitle
                eyebrow="Match Centre"
                title="Lineups"
              />

              <div className="mt-6 grid gap-6 lg:grid-cols-2">
                <Lineup
                  team={homeTeam}
                  fallbackTeam={teamMap.get(match.home_team_id)}
                  players={homeLineup}
                />

                <Lineup
                  team={awayTeam}
                  fallbackTeam={teamMap.get(match.away_team_id)}
                  players={awayLineup}
                />
              </div>
            </section>
          )}

          {hasStats && (
            <section
              id="stats"
              className="mb-6 rounded-3xl border border-sky-100 bg-white p-5 sm:p-7"
            >
              <SectionTitle
                eyebrow="Match Centre"
                title="Match stats"
              />

              <div className="mt-6 overflow-hidden rounded-2xl border border-slate-100">
                <div className="grid grid-cols-[1fr_90px_1fr] bg-slate-50 px-4 py-3 text-xs font-black text-slate-500">
                  <div className="text-left">
                    {homeTeam?.short_name ||
                      homeTeam?.name ||
                      "Home"}
                  </div>
                  <div className="text-center">Stat</div>
                  <div className="text-right">
                    {awayTeam?.short_name ||
                      awayTeam?.name ||
                      "Away"}
                  </div>
                </div>

                <div>
                  {(stats || []).map((stat) => (
                    <div
                      key={stat.id}
                      className="grid grid-cols-[1fr_120px_1fr] items-center border-t border-slate-100 px-4 py-3"
                    >
                      <div className="text-left text-sm font-black text-slate-800">
                        {stat.home_value ?? "—"}
                      </div>

                      <div className="text-center text-[10px] font-bold uppercase tracking-wide text-slate-400">
                        {formatStatName(stat.stat_name)}
                      </div>

                      <div className="text-right text-sm font-black text-slate-800">
                        {stat.away_value ?? "—"}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          )}

          {!hasEvents && !hasLineups && !hasStats && (
            <div className="rounded-3xl border border-sky-100 bg-white p-10 text-center">
              <p className="text-sm font-bold text-slate-400">
                Detailed match information is not available yet.
              </p>
            </div>
          )}
        </section>
      </main>
    </>
  );
}

function SectionTitle({
  eyebrow,
  title,
}: {
  eyebrow: string;
  title: string;
}) {
  return (
    <div>
      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-sky-600">
        {eyebrow}
      </p>
      <h2 className="mt-1 text-2xl font-black tracking-tight text-slate-900">
        {title}
      </h2>
    </div>
  );
}

function MatchTeam({
  team,
  align,
}: {
  team: any;
  align: "left" | "right";
}) {
  const name =
    team?.short_name ||
    team?.name ||
    "TBD";

  return (
    <div
      className={`flex items-center gap-3 ${
        align === "right"
          ? "justify-end"
          : "justify-start"
      }`}
    >
      {align === "right" && (
        <span className="text-sm font-black text-slate-900 sm:text-lg">
          {name}
        </span>
      )}

      {team?.crest_url ? (
        <img
          src={team.crest_url}
          alt=""
          className="h-12 w-12 object-contain sm:h-16 sm:w-16"
        />
      ) : (
        <div className="h-12 w-12 rounded-full bg-slate-100 sm:h-16 sm:w-16" />
      )}

      {align === "left" && (
        <span className="text-sm font-black text-slate-900 sm:text-lg">
          {name}
        </span>
      )}
    </div>
  );
}

function Lineup({
  team,
  fallbackTeam,
  players,
}: {
  team: any;
  fallbackTeam: any;
  players: any[];
}) {
  const teamData = team || fallbackTeam;

  const starters = players.filter(
    (player) => player.is_starting
  );

  const substitutes = players.filter(
    (player) => !player.is_starting
  );

  return (
    <div className="rounded-2xl border border-slate-100 p-4">
      <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
        {teamData?.crest_url ? (
          <img
            src={teamData.crest_url}
            alt=""
            className="h-9 w-9 object-contain"
          />
        ) : (
          <div className="h-9 w-9 rounded-full bg-slate-100" />
        )}

        <div>
          <h3 className="text-sm font-black text-slate-900">
            {teamData?.short_name ||
              teamData?.name ||
              "Team"}
          </h3>
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            {starters.length} starters
          </p>
        </div>
      </div>

      <div className="mt-4">
        <p className="text-[10px] font-black uppercase tracking-wider text-sky-600">
          Starting XI
        </p>

        <div className="mt-2 divide-y divide-slate-100">
          {starters.map((player) => (
            <PlayerRow
              key={player.id}
              player={player}
            />
          ))}
        </div>
      </div>

      {substitutes.length > 0 && (
        <div className="mt-6">
          <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">
            Substitutes
          </p>

          <div className="mt-2 divide-y divide-slate-100">
            {substitutes.map((player) => (
              <PlayerRow
                key={player.id}
                player={player}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function PlayerRow({
  player,
}: {
  player: any;
}) {
  return (
    <div className="flex items-center gap-3 py-2.5">
      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-100 text-[10px] font-black text-slate-500">
        {player.shirt_number ?? "—"}
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate text-xs font-black text-slate-800">
          {player.player_name_raw ||
            "Unknown player"}
        </p>

        <div className="flex flex-wrap gap-2 text-[9px] font-bold text-slate-400">
          {player.position && (
            <span>{player.position}</span>
          )}

          {player.sub_minute !== null &&
            player.sub_minute !== undefined && (
              <span>
                Substituted {player.sub_minute}'
              </span>
            )}
        </div>
      </div>
    </div>
  );
}
