import type { Metadata } from "next";
import Header from "@/components/Header";
import TeamsDirectory from "@/components/TeamsDirectory";
import { supabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Teams",
  description:
    "Explore football clubs and teams from Meghalaya and Northeast India on Highland Football.",
  alternates: {
    canonical: "/teams",
  },
};

export default async function TeamsPage() {
  const { data: teams, error } = await supabase
    .from("teams")
    .select("id, name, short_name, crest_url")
    .order("name", { ascending: true });

  return (
    <>
      <Header />

      <main className="mx-auto min-h-screen w-full max-w-7xl px-5 py-10">
        <div className="border-b border-[var(--border)] pb-7">
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-[var(--primary-dark)]">
            Highland Football
          </p>

          <h1 className="mt-2 text-4xl font-black tracking-tight text-[var(--foreground)]">
            Teams
          </h1>

          <p className="mt-3 max-w-2xl text-[var(--foreground)] opacity-70">
            Discover football clubs competing across Meghalaya and Northeast India.
          </p>
        </div>

        <section className="mt-8">
          {error ? (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">
              Unable to load teams. Please try again later.
            </div>
          ) : (
            <TeamsDirectory teams={teams || []} />
          )}
        </section>
      </main>
    </>
  );
}
