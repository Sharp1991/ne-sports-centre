import Header from "@/components/Header";

export default function AboutPage() {
  return (
    <>
      <Header />

      <main className="bg-white">
        <section className="mx-auto max-w-4xl px-5 py-12 sm:py-16">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-sky-600">
            About us
          </p>

          <h1 className="mt-2 text-4xl font-black tracking-tight text-slate-900 sm:text-5xl">
            About Highland Football
          </h1>

          <div className="mt-10 space-y-10 text-slate-700">
            <section>
              <h2 className="text-xl font-black text-slate-900">
                Who we are
              </h2>
              <p className="mt-3 leading-7">
                Highland Football is an independent football platform focused
                on bringing fans closer to the game through football stories,
                news, and data from Meghalaya and across Northeast India.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-black text-slate-900">
                What we cover
              </h2>
              <p className="mt-3 leading-7">
                Our coverage includes football news, match reports, player and
                team stories, competition updates, features, analysis, and
                football statistics. We also provide structured information on
                matches, standings, players, and competitions to make football
                data easier for fans to explore.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-black text-slate-900">
                Our goal
              </h2>
              <p className="mt-3 leading-7">
                Our goal is to build a reliable and accessible football
                platform for supporters who want to follow, understand, and
                discover football from the region.
              </p>
              <p className="mt-3 leading-7">
                We aim to combine quality football journalism with useful data,
                creating a platform that serves both everyday fans and people
                looking for deeper information about the game.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-black text-slate-900">
                Editorial independence
              </h2>
              <p className="mt-3 leading-7">
                Highland Football operates independently and is committed to
                providing coverage that is accurate, transparent, and relevant
                to football supporters. We aim to distinguish factual reporting
                from analysis and opinion, and we welcome corrections when
                errors are identified.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-black text-slate-900">
                Get in touch
              </h2>
              <p className="mt-3 leading-7">
                For enquiries, feedback, corrections, contributions, or
                partnership opportunities, please contact us through our
                Contact page.
              </p>
            </section>
          </div>
        </section>
      </main>
    </>
  );
}
