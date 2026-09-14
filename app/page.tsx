import Header from "@/components/Header";
import { supabase } from "@/lib/supabase";

export default async function Home() {
  const today = new Date().toISOString().split("T")[0];

  const [
    { data: articles },
    { data: matches },
  ] = await Promise.all([
    supabase
      .from("articles")
      .select(
        "id, title, slug, excerpt, image_url, category, published_at, match_id"
      )
      .order("published_at", { ascending: false })
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
  ]);

  const featuredArticle = articles?.[0] || null;
  const latestArticles = articles?.slice(1, 7) || [];

  const upcoming =
    matches
      ?.filter(
        (match) =>
          match.date >= today &&
          match.status !== "completed" &&
          match.home_score === null &&
          match.away_score === null
      )
      .slice(0, 3) || [];

  const results =
    matches
      ?.filter(
        (match) =>
          match.home_score !== null &&
          match.away_score !== null
      )
      .sort(
        (a, b) =>
          new Date(b.date).getTime() -
          new Date(a.date).getTime()
      )
      .slice(0, 3) || [];

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
                  <div className="aspect-[16/9]">
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

                  <div className="absolute inset-x-0 bottom-0 p-6 sm:p-8">
                    <span className="inline-flex rounded-full bg-sky-500 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-white">
                      {featuredArticle.category || "Latest Story"}
                    </span>

                    <h1 className="mt-3 max-w-3xl text-3xl font-black leading-tight text-white sm:text-5xl">
                      {featuredArticle.title}
                    </h1>

                    {featuredArticle.excerpt && (
                      <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-200 sm:text-base">
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
                    NE Sports Centre
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

              <div className="flex flex-col justify-between rounded-3xl border border-sky-100 bg-sky-50 p-6 sm:p-7">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.2em] text-sky-600">
                    Latest from the Centre
                  </p>

                  <h2 className="mt-3 text-3xl font-black leading-tight text-slate-900">
                    Stories,
                    <br />
                    scores & data.
                  </h2>

                  <p className="mt-4 text-sm leading-6 text-slate-500">
                    Follow football and other sports across Northeast India,
                    with the numbers behind the stories.
                  </p>
                </div>

                <div className="mt-8">
                  <a
                    href="/articles"
                    className="inline-flex rounded-xl bg-sky-500 px-5 py-3 text-xs font-black uppercase tracking-wider text-white transition hover:bg-sky-600"
                  >
                    Explore News →
                  </a>
                </div>
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
                    <MatchCard key={match.id} match={match} />
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

        {/* LATEST STORIES */}
        {latestArticles.length > 0 && (
          <section className="border-y border-sky-100 bg-white">
            <div className="mx-auto max-w-7xl px-5 py-10">
              <div className="flex items-end justify-between gap-4">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.2em] text-sky-600">
                    From the Centre
                  </p>

                  <h2 className="mt-1 text-2xl font-black text-slate-900 sm:text-3xl">
                    Latest Stories
                  </h2>
                </div>

                <a
                  href="/articles"
                  className="text-xs font-bold uppercase tracking-wider text-sky-600 hover:text-sky-700"
                >
                  All stories →
                </a>
              </div>

              <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {latestArticles.map((article) => (
                  <a
                    key={article.id}
                    href={`/articles/${article.slug}`}
                    className="group overflow-hidden rounded-2xl border border-sky-100 bg-white transition hover:-translate-y-0.5 hover:border-sky-300 hover:shadow-md"
                  >
                    <div className="aspect-[16/10] overflow-hidden bg-slate-100">
                      {article.image_url ? (
                        <img
                          src={article.image_url}
                          alt=""
                          className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center bg-sky-50 text-xs font-bold uppercase tracking-widest text-sky-300">
                          NE Sports Centre
                        </div>
                      )}
                    </div>

                    <div className="p-5">
                      <p className="text-[10px] font-black uppercase tracking-widest text-sky-600">
                        {article.category || "Sports"}
                      </p>

                      <h3 className="mt-2 line-clamp-3 text-lg font-black leading-snug text-slate-900">
                        {article.title}
                      </h3>

                      {article.excerpt && (
                        <p className="mt-2 line-clamp-2 text-sm leading-5 text-slate-500">
                          {article.excerpt}
                        </p>
                      )}

                      <p className="mt-4 text-xs font-bold text-slate-400">
                        Read story →
                      </p>
                    </div>
                  </a>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* DATA HUB */}
        <section className="mx-auto max-w-7xl px-5 py-10">
          <div className="rounded-3xl bg-slate-900 p-6 sm:p-8">
            <div className="max-w-2xl">
              <p className="text-xs font-black uppercase tracking-[0.2em] text-sky-400">
                The Data Centre
              </p>

              <h2 className="mt-2 text-2xl font-black text-white sm:text-3xl">
                Follow the numbers behind the stories.
              </h2>

              <p className="mt-3 text-sm leading-6 text-slate-400">
                Explore teams, matches, standings and competitions from
                football across Northeast India.
              </p>
            </div>

            <div className="mt-7 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <DataLink href="/teams" title="Teams" text="Clubs and squads" />
              <DataLink href="/matches" title="Matches" text="Fixtures and match centre" />
              <DataLink href="/standings" title="Standings" text="Tables and positions" />
              <DataLink
                href="/competitions"
                title="Competitions"
                text="Tournaments and leagues"
              />
            </div>
          </div>
        </section>

        {/* BRAND FOOTER STRIP */}
        <section className="border-t border-sky-100 bg-sky-50">
          <div className="mx-auto max-w-7xl px-5 py-10">
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
              <div>
                <p className="text-lg font-black text-slate-900">
                  NE SPORTS CENTRE
                </p>

                <p className="mt-1 text-sm text-slate-500">
                  Northeast India · Stories · Scores · Data
                </p>
              </div>

              <a
                href="/articles"
                className="w-fit rounded-xl bg-sky-500 px-5 py-3 text-xs font-black uppercase tracking-wider text-white hover:bg-sky-600"
              >
                Explore the Centre →
              </a>
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
}: {
  match: any;
  upcoming?: boolean;
}) {
  const home = match.home_team;
  const away = match.away_team;

  return (
    <a
      href={`/matches/${match.id}`}
      className="block rounded-2xl border border-sky-100 bg-white p-4 transition hover:border-sky-300 hover:shadow-sm"
    >
      <div className="flex items-center justify-between gap-3">
        <span className="truncate text-[10px] font-black uppercase tracking-wider text-sky-600">
          {match.competition}
        </span>

        <span className="shrink-0 text-[10px] font-semibold text-slate-400">
          {new Date(match.date).toLocaleDateString("en-IN", {
            day: "numeric",
            month: "short",
          })}
        </span>
      </div>

      <div className="mt-4 grid grid-cols-[1fr_auto_1fr] items-center gap-3">
        <Team team={home} align="right" />

        <div className="min-w-[60px] text-center">
          {upcoming ? (
            <>
              <div className="text-xs font-black uppercase text-slate-400">
                VS
              </div>

              {match.time && (
                <div className="mt-1 text-[10px] font-bold text-slate-400">
                  {match.time.slice(0, 5)}
                </div>
              )}
            </>
          ) : (
            <div className="text-xl font-black text-slate-900">
              {match.home_score} - {match.away_score}
            </div>
          )}
        </div>

        <Team team={away} align="left" />
      </div>
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
