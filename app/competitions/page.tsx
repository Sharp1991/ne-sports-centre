import Header from "@/components/Header";
import { supabase } from "@/lib/supabase";

export default async function CompetitionsPage() {
  const { data: matches } = await supabase
    .from("matches")
    .select("competition, season, status")
    .order("date", { ascending: false });

  const competitionMap = new Map<
    string,
    {
      competition: string;
      seasons: Set<string>;
      matches: number;
    }
  >();

  for (const match of matches || []) {
    if (!match.competition) continue;

    if (!competitionMap.has(match.competition)) {
      competitionMap.set(match.competition, {
        competition: match.competition,
        seasons: new Set(),
        matches: 0,
      });
    }

    const item = competitionMap.get(match.competition)!;

    if (match.season) {
      item.seasons.add(match.season);
    }

    item.matches++;
  }

  const competitions = [...competitionMap.values()];

  return (
    <>
      <Header />

      <main>
        <section className="border-b border-sky-100 bg-white">
          <div className="mx-auto max-w-7xl px-5 py-10 sm:py-14">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-sky-600">
              Highland Football
            </p>

            <h1 className="mt-2 text-4xl font-black tracking-tight text-slate-900 sm:text-5xl">
              Competitions
            </h1>

            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-500 sm:text-base">
              Explore tournaments, seasons, matches, results and standings
              from football across Northeast India.
            </p>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-5 py-10">
          {competitions.length > 0 ? (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {competitions.map((item) => (
                <a
                  key={item.competition}
                  href={`/competitions/${encodeURIComponent(
                    item.competition
                  )}`}
                  className="group rounded-2xl border border-sky-100 bg-white p-6 transition hover:-translate-y-1 hover:border-sky-300 hover:shadow-md"
                >
                  <p className="text-[10px] font-black uppercase tracking-widest text-sky-600">
                    Competition
                  </p>

                  <h2 className="mt-2 text-2xl font-black leading-tight text-slate-900 group-hover:text-sky-700">
                    {item.competition}
                  </h2>

                  <p className="mt-5 text-xs font-bold text-slate-400">
                    {item.matches}{" "}
                    {item.matches === 1 ? "match" : "matches"}
                  </p>

                  <p className="mt-5 text-xs font-black uppercase tracking-wider text-sky-600">
                    View competition →
                  </p>
                </a>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-sky-200 bg-white p-10 text-center">
              <p className="text-sm font-bold text-slate-400">
                No competitions available yet.
              </p>
            </div>
          )}
        </section>
      </main>
    </>
  );
}
