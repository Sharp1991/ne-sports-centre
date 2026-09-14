import Header from "@/components/Header";
import FeaturedStory from "@/components/FeaturedStory";
import { supabase } from "@/lib/supabase";

export default async function Home() {
  const { data: featuredArticle } = await supabase
    .from("articles")
    .select("title, slug, excerpt, image_url, category, published_at")
    .order("published_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return (
    <>
      <Header />

      <main>
        {featuredArticle && (
          <FeaturedStory article={featuredArticle} />
        )}

        <section className="mx-auto max-w-7xl px-5 py-12">
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-sky-600">
            Northeast India
          </p>

          <h1 className="mt-2 text-4xl font-black tracking-tight text-slate-900">
            Sports stories backed by data.
          </h1>

          <p className="mt-4 max-w-2xl text-slate-600">
            News, scores, statistics, teams and stories from sports across
            the Northeast.
          </p>
        </section>
      </main>
    </>
  );
}
