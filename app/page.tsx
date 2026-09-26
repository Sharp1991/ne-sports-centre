import Image from "next/image";
import Header from "@/components/Header";
import { supabase } from "@/lib/supabase";
import { getCompetitionMatchesHref } from "@/lib/match-links";
export const dynamic = "force-dynamic";

export default async function Home() {
  const now = new Date();

  const [
    { data: articles },
    { data: matches },
    { data: standingsMatches },
  ] = await Promise.all([
    supabase
      .from("articles")
      .select(
        "id, title, slug, excerpt, image_url, category, published_at, match_id"
      )
      .order("id", { ascending: false })
      .limit(7),

    supabase
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
      .order("date", { ascending: true }),

    supabase
      .from("matches")
      .select(`
        home_score,
        away_score,
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
      .eq("competition", "Shillong Premier League")
      .eq("season", "2026-27")
      .eq("status", "finished")
      .not("home_score", "is", null)
      .not("away_score", "is", null),
  ]);

  const featuredArticle = articles?.[0] || null;
  const latestArticles = articles?.slice(1, 7) || [];

  function matchDate(match: any) {
    const time = match.time ? match.time.slice(0, 5) : "12:00";
    return new Date(`${match.date}T${time}:00+05:30`);
  }

  const futureMatches = (matches || [])
    .filter(
      (match: any) =>
        match.status !== "completed" &&
        match.home_score === null &&
        match.away_score === null &&
        matchDate(match).getTime() > now.getTime()
    )
    .sort(
      (a: any, b: any) =>
        matchDate(a).getTime() - matchDate(b).getTime()
    );

  const finishedMatches = (matches || [])
    .filter(
      (match: any) =>
        match.home_score !== null &&
        match.away_score !== null
    )
    .sort(
      (a: any, b: any) =>
        matchDate(b).getTime() - matchDate(a).getTime()
    );

  function onePerCompetition(list: any[]) {
    const seen = new Set<string>();

    return list.filter((match) => {
      if (seen.has(match.competition)) return false;

      seen.add(match.competition);
      return true;
    });
  }

  const upcoming = onePerCompetition(futureMatches);
  const results = onePerCompetition(finishedMatches);

  const resultIds = results.map((match: any) => match.id);

  const { data: goalEvents } = resultIds.length
    ? await supabase
        .from("match_events")
        .select(
          "match_id, minute, team_id, player_id, player_name_raw, type"
        )
        .in("match_id", resultIds)
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
        .select("id, name")
        .in("id", playerIds)
    : { data: [] };

  const playerMap = new Map(
    (scorerPlayers || []).map((player: any) => [
      player.id,
      player.name,
    ])
  );

  const scorersByMatch = new Map<number, any[]>();

  (goalEvents || [])
    .filter(
      (event: any) =>
        event.type?.toLowerCase() === "goal"
    )
    .forEach((event: any) => {
      const list = scorersByMatch.get(event.match_id) || [];

      list.push({
        minute: event.minute,
        name:
          playerMap.get(event.player_id) ||
          event.player_name_raw ||
          "Unknown Player",
      });

      scorersByMatch.set(event.match_id, list);
    });

  const standings = buildStandings(standingsMatches || []);

  return (
    <>
      <Header />

      <main>
        {/* HERO */}
        <section className="border-b border-sky-100 bg-white">
          <div className="mx-auto max-w-7xl px-5 py-8 sm:py-10">
            <div className="grid gap-6 lg:grid-cols-[1.7fr_1fr]">
              {featuredArticle ? (
                <a
                  href={`/articles/${featuredArticle.slug}`}
                  className="group relative overflow-hidden rounded-3xl bg-slate-900"
                >
                  <div className="aspect-[4/3] sm:aspect-[16/9]">
                    {featuredArticle.image_url ? (
                      <img
                        src={featuredArticle.image_url}
                        alt=""
                        className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <div className="h-full w-full bg-slate-800" />
                    )}
                  </div>

                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/35 to-transparent" />

                  <div className="absolute inset-x-0 bottom-0 p-4 sm:p-8">
                    <span className="inline-flex rounded-full bg-sky-500 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-white">
                      {featuredArticle.category || "Latest Story"}
                    </span>

                    <h1 className="mt-3 max-w-3xl text-xl font-black leading-tight text-white sm:text-5xl">
                      {featuredArticle.title}
                    </h1>

                    {featuredArticle.excerpt && (
                      <p className="mt-3 hidden max-w-2xl text-sm leading-6 text-slate-200 sm:block sm:text-base">
                        {featuredArticle.excerpt}
                      </p>
                    )}

                    <div className="mt-5 text-xs font-bold uppercase tracking-widest text-sky-300">
                      Read Story →
                    </div>
                  </div>
                </a>
              ) : (
                <div className="rounded-3xl bg-slate-900 p-8 text-white">
                  <p className="text-sm font-bold uppercase tracking-widest text-sky-400">
                    Highland Football
                  </p>
                  <h1 className="mt-4 text-4xl font-black">
                    Sports stories backed by data.
                  </h1>
                  <p className="mt-4 max-w-xl text-slate-300">
                    News, scores, statistics, teams and stories from
                    sports across Northeast India.
                  </p>
                </div>
              )}

              <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-1">
                {latestArticles.slice(0, 3).map((article) => (
                  <a
                    key={article.id}
                    href={`/articles/${article.slug}`}
                    className="group grid grid-cols-[110px_1fr] gap-4 overflow-hidden rounded-2xl border border-sky-100 bg-white p-3 transition hover:border-sky-300 hover:shadow-sm"
                  >
                    <div className="relative aspect-[4/3] overflow-hidden rounded-xl bg-slate-100">
                      {article.image_url ? (
                        <Image
                          src={article.image_url}
                          alt=""
                          fill
                          sizes="110px"
                          className="object-cover transition duration-300 group-hover:scale-105"
                          priority={latestArticles[0]?.id === article.id}
                        />
                      ) : (
                        <div className="h-full w-full bg-slate-200" />
                      )}
                    </div>

                    <div className="min-w-0 py-1">
                      <p className="text-[9px] font-black uppercase tracking-widest text-sky-600">
                        {article.category || "News"}
                      </p>

                      <h2 className="mt-1 line-clamp-3 text-sm font-black leading-5 text-slate-900 group-hover:text-sky-700">
                        {article.title}
                      </h2>

                      <p className="mt-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        Read story →
                      </p>
                    </div>
                  </a>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* MATCHES */}
        <section className="mx-auto max-w-7xl px-5 py-10">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.2em] text-sky-600">
                On the pitch
              </p>

              <h2 className="mt-1 text-2xl font-black text-slate-900 sm:text-3xl">
                Matches
              </h2>
            </div>

            <a
              href="/matches"
              className="text-xs font-bold uppercase tracking-wider text-sky-600 hover:text-sky-700"
            >
              View all →
            </a>
          </div>

          <div className="mt-5 grid gap-6 lg:grid-cols-2">
            {/* RESULTS */}
            <div>
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-sm font-black uppercase tracking-wider text-slate-500">
                  Latest Results
                </h3>

                <a
                  href="/results"
                  className="text-xs font-semibold text-slate-400 hover:text-sky-600"
                >
                  All results
                </a>
              </div>

              <div className="space-y-3">
                {results.length > 0 ? (
                  results.map((match) => (
                    <MatchCard key={match.id} match={match} scorersByMatch={scorersByMatch} />
                  ))
                ) : (
                  <Empty text="No results available yet." />
                )}
              </div>
            </div>

            {/* UPCOMING */}
            <div>
              <div className="mb-3">
                <h3 className="text-sm font-black uppercase tracking-wider text-slate-500">
                  Upcoming
                </h3>
              </div>

              <div className="space-y-3">
                {upcoming.length > 0 ? (
                  upcoming.map((match) => (
                    <MatchCard key={match.id} match={match} upcoming />
                  ))
                ) : (
                  <Empty text="No upcoming matches." />
                )}
              </div>
            </div>
          </div>
        </section>

        {/* SPL 2026 STANDINGS */}
        <section className="mx-auto max-w-7xl px-5 py-8">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-sky-600">
                Shillong Premier League
              </p>

              <h2 className="mt-1 text-2xl font-black text-slate-900">
                2026-27 Standings
              </h2>
            </div>

            <a
              href="/standings"
              className="shrink-0 text-sm font-bold text-sky-600"
            >
              View full standings →
            </a>
          </div>

          <div className="mt-5 overflow-hidden rounded-2xl border border-sky-100 bg-white">
            <style>{`
              #standings-toggle { position: absolute; opacity: 0; pointer-events: none; }
              #standings-toggle:not(:checked) ~ .standings-table tbody tr:nth-child(n+6) { display: none; }
              #standings-toggle:checked ~ .standings-toggle-label .show-all { display: none; }
              #standings-toggle:not(:checked) ~ .standings-toggle-label .show-less { display: none; }
            `}</style>

            <input id="standings-toggle" type="checkbox" />

            <div className="overflow-x-auto standings-table">
              <table className="w-full min-w-[560px]">
                <thead className="bg-sky-50">
                  <tr className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                    <th className="px-4 py-3 text-left">#</th>
                    <th className="px-4 py-3 text-left">Team</th>
                    <th className="px-3 py-3 text-center">P</th>
                    <th className="px-3 py-3 text-center">W</th>
                    <th className="px-3 py-3 text-center">D</th>
                    <th className="px-3 py-3 text-center">L</th>
                    <th className="px-3 py-3 text-center">GD</th>
                    <th className="px-4 py-3 text-center">Pts</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {standings.map((team, index) => (
                    <tr key={team.id} className="transition hover:bg-sky-50/50">
                      <td className="px-4 py-4 text-sm font-black text-slate-400">
                        {index + 1}
                      </td>

                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          {team.crest_url ? (
                            <img src={team.crest_url} alt="" className="h-8 w-8 object-contain" />
                          ) : (
                            <div className="h-8 w-8 rounded-full bg-slate-100" />
                          )}

                          <span className="text-sm font-bold text-slate-800">
                            {team.name}
                          </span>
                        </div>
                      </td>

                      <td className="px-3 py-4 text-center text-sm text-slate-600">{team.p}</td>
                      <td className="px-3 py-4 text-center text-sm text-slate-600">{team.w}</td>
                      <td className="px-3 py-4 text-center text-sm text-slate-600">{team.d}</td>
                      <td className="px-3 py-4 text-center text-sm text-slate-600">{team.l}</td>

                      <td className={`px-3 py-4 text-center text-sm font-bold ${
                        team.gd > 0
                          ? "text-emerald-600"
                          : team.gd < 0
                            ? "text-red-500"
                            : "text-slate-500"
                      }`}>
                        {team.gd > 0 ? `+${team.gd}` : team.gd}
                      </td>

                      <td className="px-4 py-4 text-center text-sm font-black text-slate-900">
                        {team.pts}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {standings.length > 5 && (
              <label
                htmlFor="standings-toggle"
                className="standings-toggle-label block cursor-pointer border-t border-sky-100 px-4 py-3 text-center text-sm font-bold text-sky-600 hover:bg-sky-50"
              >
                <span className="show-all">Show all teams ↓</span>
                <span className="show-less">Show less ↑</span>
              </label>
            )}

            {standings.length === 0 && (
              <div className="p-8 text-center text-sm text-slate-400">
                No finished Shillong Premier League matches available.
              </div>
            )}
          </div>
        </section>

        {/* DATA CENTRE */}
        <section className="border-t border-slate-800 bg-slate-950">
          <div className="mx-auto max-w-7xl px-5 py-14 sm:py-20">
            <div className="relative min-h-[460px] overflow-hidden rounded-[2rem] border border-white/10 bg-slate-950 shadow-2xl">
              {/* Technical pitch-line artwork */}
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 overflow-hidden"
              >
                <div className="absolute -right-24 -top-24 h-[520px] w-[520px] rounded-full border border-sky-400/10" />
                <div className="absolute -right-10 -top-10 h-[360px] w-[360px] rounded-full border border-sky-400/10" />
                <div className="absolute right-20 top-20 h-28 w-28 rounded-full border border-sky-400/10" />
                <div className="absolute right-0 top-1/2 h-px w-[62%] bg-sky-400/10" />
                <div className="absolute right-[31%] top-0 h-full w-px bg-sky-400/10" />
                <div className="absolute bottom-0 left-0 h-1/2 w-[42%] border-r border-t border-sky-400/10" />
                <div className="absolute inset-0 opacity-[0.035]"
                  style={{
                    backgroundImage:
                      "linear-gradient(rgba(56,189,248,1) 1px, transparent 1px), linear-gradient(90deg, rgba(56,189,248,1) 1px, transparent 1px)",
                    backgroundSize: "44px 44px",
                  }}
                />
                <div className="absolute -bottom-32 -left-32 h-96 w-96 rounded-full bg-sky-500/10 blur-3xl" />
                <div className="absolute right-[-10%] top-[15%] h-96 w-96 rounded-full bg-sky-500/[0.07] blur-3xl" />
              </div>

              <div className="relative flex min-h-[460px] flex-col justify-between p-7 sm:p-10 lg:p-14">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="h-2 w-2 rounded-full bg-sky-400 shadow-[0_0_12px_rgba(56,189,248,0.8)]" />
                    <p className="text-[10px] font-black uppercase tracking-[0.28em] text-sky-400">
                      Highland Football · Data
                    </p>
                  </div>

                  <span className="hidden text-[9px] font-black uppercase tracking-[0.25em] text-slate-600 sm:block">
                    Explore the game
                  </span>
                </div>

                <div className="max-w-4xl py-16 sm:py-20">
                  <p className="text-[11px] font-black uppercase tracking-[0.3em] text-slate-500">
                    The Data Centre
                  </p>

                  <h2 className="mt-4 max-w-4xl text-5xl font-black leading-[0.92] tracking-[-0.04em] text-white sm:text-7xl lg:text-8xl">
                    Beyond
                    <span className="block text-sky-400">
                      the score.
                    </span>
                  </h2>

                  <p className="mt-7 max-w-xl text-sm leading-7 text-slate-400 sm:text-base">
                    Results tell you what happened. Our data helps you
                    explore everything around it.
                  </p>
                </div>

                <div className="flex flex-col gap-6 border-t border-white/10 pt-6 sm:flex-row sm:items-end sm:justify-between">
                  <div className="flex flex-wrap gap-x-5 gap-y-2 text-[9px] font-black uppercase tracking-[0.2em] text-slate-600">
                    <span>Players</span>
                    <span>Teams</span>
                    <span>Matches</span>
                    <span>Competitions</span>
                  </div>

                  <a
                    href="/data-centre"
                    className="group inline-flex w-fit items-center gap-4 text-sm font-black uppercase tracking-[0.12em] text-white transition"
                  >
                    <span className="border-b border-sky-400 pb-1">
                      Explore Data Centre
                    </span>
                    <span className="flex h-10 w-10 items-center justify-center rounded-full border border-sky-400/40 text-lg text-sky-400 transition group-hover:translate-x-1 group-hover:bg-sky-400 group-hover:text-slate-950">
                      →
                    </span>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}

function MatchCard({
  match,
  upcoming = false,
  scorersByMatch,
}: {
  match: any;
  upcoming?: boolean;
  scorersByMatch?: Map<number, any[]>;
}) {
  const home = match.home_team;
  const away = match.away_team;

  const matchTime = match.time ? match.time.slice(0, 5) : null;

  const today = new Date();
  const todayDate = new Date(
    today.toLocaleDateString("en-CA", {
      timeZone: "Asia/Kolkata",
    })
  );

  const matchDateOnly = new Date(
    `${match.date}T00:00:00+05:30`
  );

  const daysToGo = Math.round(
    (matchDateOnly.getTime() - todayDate.getTime()) /
      (1000 * 60 * 60 * 24)
  );

  let countdown = "";

  if (upcoming) {
    if (daysToGo <= 0) {
      countdown = "TODAY";
    } else if (daysToGo === 1) {
      countdown = "1 DAY TO GO";
    } else {
      countdown = `${daysToGo} DAYS TO GO`;
    }
  }

  const scorers = scorersByMatch?.get(match.id) || [];

  return (
    <a
      href={getCompetitionMatchesHref(
        match.competition,
        match.season
      )}
      className="block rounded-2xl border border-sky-100 bg-white p-4 transition hover:border-sky-300 hover:shadow-sm"
    >
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <span className="block truncate text-[10px] font-black uppercase tracking-wider text-sky-600">
            {match.competition}
          </span>

          <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
            {match.season}
          </span>
        </div>

        <span className="shrink-0 text-[10px] font-semibold text-slate-400">
          {new Date(match.date).toLocaleDateString("en-IN", {
            day: "numeric",
            month: "short",
          })}
        </span>
      </div>

      <div className="mt-4 grid grid-cols-[1fr_auto_1fr] items-center gap-3">
        <Team team={home} align="right" />

        <div className="min-w-[70px] text-center">
          {upcoming ? (
            <>
              <div className="text-xs font-black uppercase text-slate-400">
                VS
              </div>

              <div className="mt-1 text-[10px] font-bold text-slate-400">
                {matchTime
                  ? new Date(
                      `1970-01-01T${matchTime}:00`
                    ).toLocaleTimeString("en-IN", {
                      hour: "numeric",
                      minute: "2-digit",
                    })
                  : "TBC"}
              </div>

              <div className="mt-1 text-[9px] font-black uppercase tracking-wider text-sky-600">
                {countdown}
              </div>
            </>
          ) : (
            <div className="text-xl font-black text-slate-900">
              {match.home_score} - {match.away_score}
            </div>
          )}
        </div>

        <Team team={away} align="left" />
      </div>

      {!upcoming && (
        <div className="mt-3 border-t border-slate-100 pt-2 text-center text-[10px] font-semibold text-slate-400">
          {scorers.length > 0
            ? scorers
                .map(
                  (scorer: any) =>
                    `${scorer.minute || ""} ${scorer.name}`.trim()
                )
                .join(" · ")
            : "No goals"}
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
  const name = team?.short_name || team?.name || "TBD";

  return (
    <div
      className={`flex items-center gap-2 ${
        align === "right" ? "justify-end" : "justify-start"
      }`}
    >
      {align === "right" && (
        <span className="text-xs font-bold text-slate-800">
          {name}
        </span>
      )}

      {team?.crest_url ? (
        <img
          src={team.crest_url}
          alt=""
          className="h-8 w-8 shrink-0 object-contain"
        />
      ) : (
        <div className="h-8 w-8 shrink-0 rounded-full bg-slate-100" />
      )}

      {align === "left" && (
        <span className="text-xs font-bold text-slate-800">
          {name}
        </span>
      )}
    </div>
  );
}

function DataLink({
  href,
  title,
  text,
}: {
  href: string;
  title: string;
  text: string;
}) {
  return (
    <a
      href={href}
      className="rounded-2xl border border-white/10 bg-white/5 p-5 transition hover:bg-white/10"
    >
      <p className="text-lg font-black text-white">{title}</p>
      <p className="mt-1 text-xs text-slate-400">{text}</p>
    </a>
  );
}

function Empty({ text }: { text: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-sky-100 bg-white p-6 text-center text-xs font-semibold text-slate-400">
      {text}
    </div>
  );
}


function buildStandings(matches: any[]) {
  const table = new Map<number, any>();

  for (const match of matches) {
    const home = match.home_team;
    const away = match.away_team;

    if (!home || !away) continue;

    const homeScore = match.home_score;
    const awayScore = match.away_score;

    if (homeScore === null || awayScore === null) continue;

    if (!table.has(home.id)) {
      table.set(home.id, {
        id: home.id,
        name: home.name,
        short_name: home.short_name,
        crest_url: home.crest_url,
        p: 0,
        w: 0,
        d: 0,
        l: 0,
        gf: 0,
        ga: 0,
        gd: 0,
        pts: 0,
      });
    }

    if (!table.has(away.id)) {
      table.set(away.id, {
        id: away.id,
        name: away.name,
        short_name: away.short_name,
        crest_url: away.crest_url,
        p: 0,
        w: 0,
        d: 0,
        l: 0,
        gf: 0,
        ga: 0,
        gd: 0,
        pts: 0,
      });
    }

    const homeTeam = table.get(home.id);
    const awayTeam = table.get(away.id);

    homeTeam.p++;
    awayTeam.p++;

    homeTeam.gf += homeScore;
    homeTeam.ga += awayScore;

    awayTeam.gf += awayScore;
    awayTeam.ga += homeScore;

    if (homeScore > awayScore) {
      homeTeam.w++;
      homeTeam.pts += 3;
      awayTeam.l++;
    } else if (homeScore < awayScore) {
      awayTeam.w++;
      awayTeam.pts += 3;
      homeTeam.l++;
    } else {
      homeTeam.d++;
      awayTeam.d++;
      homeTeam.pts++;
      awayTeam.pts++;
    }
  }

  return [...table.values()]
    .map((team) => ({
      ...team,
      gd: team.gf - team.ga,
    }))
    .sort(
      (a, b) =>
        b.pts - a.pts ||
        b.gd - a.gd ||
        b.gf - a.gf
    );
}
