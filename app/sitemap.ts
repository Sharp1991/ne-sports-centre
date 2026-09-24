import type { MetadataRoute } from "next";
import { supabase } from "@/lib/supabase";

const BASE_URL = "https://ne-sports-centre.vercel.app";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [{ data: articles }, { data: matches }] = await Promise.all([
    supabase
      .from("articles")
      .select("slug, published_at")
      .order("published_at", { ascending: false }),

    supabase
      .from("matches")
      .select("id, competition, season, date")
      .order("date", { ascending: false }),
  ]);

  const urls: MetadataRoute.Sitemap = [
    {
      url: BASE_URL,
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: `${BASE_URL}/about`,
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: `${BASE_URL}/articles`,
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/standings`,
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/competitions`,
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/matches`,
      changeFrequency: "daily",
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/results`,
      changeFrequency: "daily",
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/data-centre`,
      changeFrequency: "daily",
      priority: 0.7,
    },
  ];

  for (const article of articles || []) {
    if (!article.slug) continue;

    urls.push({
      url: `${BASE_URL}/articles/${encodeURIComponent(article.slug)}`,
      lastModified: article.published_at
        ? new Date(article.published_at)
        : undefined,
      changeFrequency: "weekly",
      priority: 0.8,
    });
  }

  const competitionMap = new Map<
    string,
    { competition: string; seasons: Set<string> }
  >();

  for (const match of matches || []) {
    if (!match.competition) continue;

    if (!competitionMap.has(match.competition)) {
      competitionMap.set(match.competition, {
        competition: match.competition,
        seasons: new Set(),
      });
    }

    if (match.season) {
      competitionMap.get(match.competition)!.seasons.add(match.season);
    }
  }

  for (const item of competitionMap.values()) {
    const competitionUrl = `${BASE_URL}/competitions/${encodeURIComponent(
      item.competition
    )}`;

    urls.push({
      url: competitionUrl,
      changeFrequency: "daily",
      priority: 0.8,
    });

    for (const season of item.seasons) {
      const seasonUrl = `${competitionUrl}/${encodeURIComponent(season)}`;

      urls.push({
        url: seasonUrl,
        changeFrequency: "daily",
        priority: 0.8,
      });

      urls.push({
        url: `${seasonUrl}/matches`,
        changeFrequency: "daily",
        priority: 0.7,
      });

      urls.push({
        url: `${seasonUrl}/standings`,
        changeFrequency: "daily",
        priority: 0.8,
      });
    }
  }

  for (const match of matches || []) {
    if (!match.id) continue;

    urls.push({
      url: `${BASE_URL}/matches/${match.id}`,
      lastModified: match.date ? new Date(match.date) : undefined,
      changeFrequency: "daily",
      priority: 0.7,
    });
  }

  return urls;
}
