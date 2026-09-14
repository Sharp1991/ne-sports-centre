type Article = {
  title: string;
  excerpt?: string | null;
  image_url?: string | null;
  category?: string | null;
  published_at?: string | null;
  slug: string;
};

export default function FeaturedStory({ article }: { article: Article }) {
  return (
    <section className="mx-auto max-w-7xl px-5 py-8">
      <div className="rounded-2xl bg-slate-900 p-8">
        <p className="text-sm font-bold uppercase tracking-widest text-sky-400">
          {article.category || "Latest Story"}
        </p>

        <h2 className="mt-3 max-w-3xl text-3xl font-black text-white sm:text-5xl">
          {article.title}
        </h2>

        {article.excerpt && (
          <p className="mt-5 max-w-2xl text-slate-300">
            {article.excerpt}
          </p>
        )}

        <a
          href={`/articles/${article.slug}`}
          className="mt-6 inline-block rounded-lg bg-sky-500 px-5 py-3 text-sm font-bold text-white"
        >
          Read Story →
        </a>
      </div>
    </section>
  );
}
