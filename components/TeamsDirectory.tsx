"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

type Team = {
  id: number;
  name: string;
  short_name: string | null;
  crest_url: string | null;
};

function teamSlug(team: Team) {
  const nameSlug = team.name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

  return `${nameSlug || "team"}-${team.id}`;
}

export default function TeamsDirectory({ teams }: { teams: Team[] }) {
  const [search, setSearch] = useState("");

  const filteredTeams = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) return teams;

    return teams.filter((team) =>
      [team.name, team.short_name]
        .filter(Boolean)
        .some((name) => name!.toLowerCase().includes(query))
    );
  }, [teams, search]);

  return (
    <>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-black text-[var(--foreground)]">
            All Clubs
          </h2>
          <p className="mt-1 text-sm text-[var(--foreground)] opacity-60">
            {filteredTeams.length} of {teams.length} teams
          </p>
        </div>

        <div className="w-full sm:max-w-sm">
          <label
            htmlFor="team-search"
            className="mb-2 block text-xs font-bold uppercase tracking-wider text-[var(--foreground)] opacity-70"
          >
            Search teams
          </label>

          <input
            id="team-search"
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Enter club name..."
            className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-sm text-[var(--foreground)] outline-none transition placeholder:text-slate-400 focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/20"
          />
        </div>
      </div>

      {filteredTeams.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-6 py-12 text-center">
          <h3 className="font-bold text-[var(--foreground)]">
            No teams found
          </h3>
          <p className="mt-2 text-sm text-[var(--foreground)] opacity-60">
            Try searching with another club name.
          </p>
        </div>
      ) : (
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredTeams.map((team) => (
            <Link
              key={team.id}
              href={`/teams/${teamSlug(team)}`}
              className="group flex min-w-0 items-center gap-4 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 transition hover:-translate-y-0.5 hover:border-[var(--primary)] hover:shadow-md"
            >
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-[var(--background)] p-2">
                {team.crest_url ? (
                  <img
                    src={team.crest_url}
                    alt={`${team.name} crest`}
                    className="h-full w-full object-contain"
                    loading="lazy"
                  />
                ) : (
                  <span className="text-lg font-black text-[var(--primary-dark)]">
                    {(team.short_name || team.name).slice(0, 2).toUpperCase()}
                  </span>
                )}
              </div>

              <div className="min-w-0 flex-1">
                <h3 className="break-words font-black text-[var(--foreground)] transition group-hover:text-[var(--primary-dark)]">
                  {team.name}
                </h3>

                {team.short_name && team.short_name !== team.name && (
                  <p className="mt-1 text-sm text-[var(--foreground)] opacity-60">
                    {team.short_name}
                  </p>
                )}

                <p className="mt-2 text-xs font-bold text-[var(--primary-dark)]">
                  View club profile →
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
