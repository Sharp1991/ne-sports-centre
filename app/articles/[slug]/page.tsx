import Header from "@/components/Header";
import { supabase } from "@/lib/supabase";
import { notFound } from "next/navigation";

export default async function ArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const { data: article } = await supabase
    .from("articles")
    .select(
      "id, title, slug, excerpt, content, image_url, category, published_at, source"
    )
    .eq("slug", slug)
    .single();

  if (!article) {
    notFound();
  }

  return (
    <>
      <Header />

      <main>
        <article>
          {/* HEADER */}
          <section className="border-b border-sky-100 bg-white">
            <div className="mx-auto max-w-4xl px-5 py-10 sm:py-14">
              <p className="text-xs font-black uppercase tracking-[0.2em] text-sky-600">
                {article.category || "Sports"}
              </p>

              <h1 className="mt-3 text-3xl font-black leading-tight tracking-tight text-slate-900 sm:text-5xl">
                {article.title}
              </h1>

              {article.excerpt && (
                <p className="mt-5 text-base leading-7 text-slate-500 sm:text-lg">
                  {article.excerpt}
                </p>
              )}

              <div className="mt-6 flex flex-wrap items-center gap-3 text-xs font-bold text-slate-400">
                {article.published_at && (
                  <span>
                    {new Date(article.published_at).toLocaleDateString(
                      "en-IN",
                      {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      }
                    )}
                  </span>
                )}

                {article.source && (
                  <>
                    <span>•</span>
                    <span>{article.source}</span>
                  </>
                )}
              </div>
            </div>
          </section>

          {/* IMAGE */}
          {article.image_url && (
            <section className="bg-slate-950">
              <div className="mx-auto max-w-5xl">
                <img
                  src={article.image_url}
                  alt={article.title}
                  className="max-h-[620px] w-full object-cover"
                />
              </div>
            </section>
          )}

          {/* CONTENT */}
          <section className="mx-auto max-w-3xl px-5 py-10 sm:py-14">
            <div className="whitespace-pre-wrap text-base leading-8 text-slate-700 sm:text-lg">
              {article.content}
            </div>

            <div className="mt-12 border-t border-sky-100 pt-6">
              <a
                href="/articles"
                className="text-xs font-black uppercase tracking-widest text-sky-600 hover:text-sky-700"
              >
                ← Back to News
              </a>
            </div>
          </section>
        </article>
      </main>
    </>
  );
}
