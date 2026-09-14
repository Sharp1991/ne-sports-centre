import Header from "@/components/Header";
import { supabase } from "@/lib/supabase";

export default async function ArticlesPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const params = await searchParams;
  const selectedCategory = params.category || "All";

  const { data: articles } = await supabase
    .from("articles")
    .select(
      "id, title, slug, excerpt, image_url, category, published_at"
    )
    .order("published_at", { ascending: false });

  const allArticles = articles || [];

  const filteredArticles =
    selectedCategory === "All"
      ? allArticles
      : allArticles.filter(
          (article) => article.category === selectedCategory
        );

  const categories = [
    "All",
    ...Array.from(
      new Set(
        allArticles
          .map((article) => article.category)
          .filter(Boolean)
      )
    ),
  ];

  return (
    <>
      <Header />

      <main>
        {/* PAGE HEADER */}
        <section className="border-b border-sky-100 bg-white">
          <div className="mx-auto max-w-7xl px-5 py-10 sm:py-14">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-sky-600">
              NE Sports Centre
            </p>

            <div className="mt-2 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
              <div>
                <h1 className="text-4xl font-black tracking-tight text-slate-900 sm:text-5xl">
                  News
                </h1>

                <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-500 sm:text-base">
                  The latest stories, reports and updates from sports
                  across Northeast India.
                </p>
              </div>

              <p className="text-xs font-bold uppercase tracking-widest text-slate-400">
                {allArticles.length} {allArticles.length === 1 ? "story" : "stories"}
              </p>
            </div>
          </div>
        </section>

        {/* CATEGORY NAV */}
        <section className="border-b border-sky-100 bg-sky-50/60">
          <div className="mx-auto max-w-7xl overflow-x-auto px-5">
            <div className="flex min-w-max gap-2 py-4">
              {categories.map((category) => (
                <a
                  key={category}
                  href={
                    category === "All"
                      ? "/articles"
                      : `/articles?category=${encodeURIComponent(category)}`
                  }
                  className="rounded-full border border-sky-200 bg-white px-4 py-2 text-[10px] font-black uppercase tracking-widest text-slate-600 transition hover:border-sky-400 hover:text-sky-600"
                >
                  {category}
                </a>
              ))}
            </div>
          </div>
        </section>

        {/* ARTICLES */}
        <section className="mx-auto max-w-7xl px-5 py-10">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {allArticles.map((article) => (
              <a
                key={article.id}
                href={`/articles/${article.slug}`}
                className="group overflow-hidden rounded-2xl border border-sky-100 bg-white transition hover:-translate-y-1 hover:border-sky-300 hover:shadow-md"
              >
                <div className="aspect-[16/10] overflow-hidden bg-slate-100">
                  {article.image_url ? (
                    <img
                      src={article.image_url}
                      alt=""
                      className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center bg-sky-50 text-xs font-black uppercase tracking-widest text-sky-300">
                      NE Sports Centre
                    </div>
                  )}
                </div>

                <div className="p-5">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-[10px] font-black uppercase tracking-widest text-sky-600">
                      {article.category || "Sports"}
                    </p>

                    {article.published_at && (
                      <p className="text-[10px] font-bold text-slate-400">
                        {new Date(article.published_at).toLocaleDateString(
                          "en-IN",
                          {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          }
                        )}
                      </p>
                    )}
                  </div>

                  <h2 className="mt-2 line-clamp-3 text-xl font-black leading-snug text-slate-900 group-hover:text-sky-700">
                    {article.title}
                  </h2>

                  {article.excerpt && (
                    <p className="mt-3 line-clamp-3 text-sm leading-6 text-slate-500">
                      {article.excerpt}
                    </p>
                  )}

                  <p className="mt-5 text-xs font-black uppercase tracking-wider text-sky-600">
                    Read story →
                  </p>
                </div>
              </a>
            ))}

            {filteredArticles.length === 0 && (
              <div className="sm:col-span-2 lg:col-span-3">
                <div className="rounded-2xl border border-dashed border-sky-200 bg-white p-10 text-center">
                  <p className="text-sm font-bold text-slate-400">
                    No articles available yet.
                  </p>
                </div>
              </div>
            )}
          </div>
        </section>
      </main>
    </>
  );
}
