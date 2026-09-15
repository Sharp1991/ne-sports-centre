"use client";

import { useState } from "react";

export default function StandingsGroups({
  groups,
}: {
  groups: any[];
}) {
  return (
    <div className="mt-10 space-y-4">
      {groups.length === 0 ? (
        <div className="rounded-2xl border border-sky-100 bg-white p-8 text-center text-sm text-slate-400">
          No standings available yet.
        </div>
      ) : (
        groups.map((group) => (
          <details
            key={`${group.competition}|||${group.season}`}
            className="group overflow-hidden rounded-2xl border border-sky-100 bg-slate-50"
          >
            <summary className="cursor-pointer list-none p-5 sm:p-6">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-sky-600">
                    {group.competition}
                  </p>

                  <h2 className="mt-1 text-2xl font-black text-slate-900">
                    {group.season}
                  </h2>
                </div>

                <span className="text-xl font-black text-slate-400 transition-transform group-open:rotate-180">
                  ↓
                </span>
              </div>
            </summary>

            <div className="space-y-8 border-t border-sky-100 p-4 sm:p-6">
              <StandingsTable table={group.table} />

              <TopScorers
                scorers={group.scorers}
                teams={group.teams}
              />
            </div>
          </details>
        ))
      )}
    </div>
  );
}

function StandingsTable({ table }: { table: any[] }) {
  return (
    <section>
      <div className="mb-5">
        <p className="text-xs font-black uppercase tracking-[0.2em] text-sky-600">
          Standings
        </p>

        <h3 className="mt-1 text-2xl font-black tracking-tight text-slate-900">
          Table
        </h3>
      </div>

      <div className="overflow-hidden rounded-2xl border border-sky-100 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] border-collapse">
            <thead>
              <tr className="bg-sky-50 text-left">
                {["Pos", "Team", "P", "W", "D", "L", "GF", "GA", "GD", "Pts"].map(
                  (heading, index) => (
                    <th
                      key={heading}
                      className={`px-4 py-4 text-xs font-black uppercase tracking-wider text-slate-500 ${
                        index >= 2 ? "text-center" : ""
                      }`}
                    >
                      {heading}
                    </th>
                  )
                )}
              </tr>
            </thead>

            <tbody>
              {table.map((row, index) => {
                const gd = row.goalsFor - row.goalsAgainst;

                return (
                  <tr
                    key={row.team.id}
                    className="border-t border-slate-100"
                  >
                    <td className="px-4 py-4 text-sm font-black text-slate-500">
                      {index + 1}
                    </td>

                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        {row.team.crest_url ? (
                          <img
                            src={row.team.crest_url}
                            alt=""
                            className="h-8 w-8 object-contain"
                          />
                        ) : (
                          <div className="h-8 w-8 rounded-full bg-slate-100" />
                        )}

                        <span className="font-black text-slate-900">
                          {row.team.name}
                        </span>
                      </div>
                    </td>

                    <td className="px-4 py-4 text-center text-sm font-bold text-slate-700">
                      {row.played}
                    </td>
                    <td className="px-4 py-4 text-center text-sm font-bold text-slate-700">
                      {row.wins}
                    </td>
                    <td className="px-4 py-4 text-center text-sm font-bold text-slate-700">
                      {row.draws}
                    </td>
                    <td className="px-4 py-4 text-center text-sm font-bold text-slate-700">
                      {row.losses}
                    </td>
                    <td className="px-4 py-4 text-center text-sm font-bold text-slate-700">
                      {row.goalsFor}
                    </td>
                    <td className="px-4 py-4 text-center text-sm font-bold text-slate-700">
                      {row.goalsAgainst}
                    </td>
                    <td className="px-4 py-4 text-center text-sm font-bold text-slate-700">
                      {gd > 0 ? `+${gd}` : gd}
                    </td>
                    <td className="px-4 py-4 text-center text-base font-black text-sky-700">
                      {row.points}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

function TopScorers({
  scorers,
  teams,
}: {
  scorers: any[];
  teams: any[];
}) {
  return (
    <section>
      <div className="mb-5">
        <p className="text-xs font-black uppercase tracking-[0.2em] text-sky-600">
          Scorers
        </p>

        <h3 className="mt-1 text-2xl font-black tracking-tight text-slate-900">
          Top Scorers
        </h3>
      </div>

      <div className="overflow-hidden rounded-2xl border border-sky-100 bg-white shadow-sm">
        {scorers.length > 0 ? (
          <div className="divide-y divide-slate-100">
            {scorers.map((scorer, index) => {
              const team = teams.find(
                (item: any) => item.id === scorer.teamId
              );

              return (
                <div
                  key={`${scorer.playerId}-${index}`}
                  className="flex items-center gap-4 px-4 py-4 sm:px-6"
                >
                  <span className="w-6 text-sm font-black text-slate-400">
                    {index + 1}
                  </span>

                  {scorer.photoUrl ? (
                    <img
                      src={scorer.photoUrl}
                      alt=""
                      className="h-11 w-11 shrink-0 rounded-full object-cover"
                    />
                  ) : (
                    <div className="h-11 w-11 shrink-0 rounded-full bg-slate-100" />
                  )}

                  <div className="min-w-0 flex-1">
                    <p className="truncate font-black text-slate-900">
                      {scorer.name}
                    </p>

                    <p className="mt-0.5 text-xs font-bold text-slate-400">
                      {team?.short_name || team?.name || "Unknown team"}
                    </p>
                  </div>

                  <div className="text-right">
                    <p className="text-xl font-black text-sky-700">
                      {scorer.goals}
                    </p>

                    <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                      {scorer.goals === 1 ? "Goal" : "Goals"}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="p-8 text-sm font-bold text-slate-500">
            No scorer data available yet.
          </p>
        )}
      </div>
    </section>
  );
}
