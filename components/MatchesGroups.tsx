"use client";

import { useEffect, useState } from "react";

export default function MatchesGroups({
  upcoming,
  results,
}: {
  upcoming: any[];
  results: any[];
}) {
  const groupMatches = (list: any[]) => {
    const groups = new Map<string, any[]>();

    list.forEach((match) => {
      const key = `${match.competition}|||${match.season}`;
      const group = groups.get(key) || [];
      group.push(match);
      groups.set(key, group);
    });

    return Array.from(groups.entries());
  };

  return (
    <div className="mt-10 space-y-4">
      <MatchSection
        title="Upcoming Matches"
        label="Fixtures"
        matches={upcoming}
        groups={groupMatches(upcoming)}
        upcoming
      />

      <MatchSection
        title="Recent Results"
        label="Results"
        matches={results}
        groups={groupMatches(results)}
      />
    </div>
  );
}

function MatchSection({
  title,
  label,
  matches,
  groups,
  upcoming = false,
}: {
  title: string;
  label: string;
  matches: any[];
  groups: [string, any[]][];
  upcoming?: boolean;
}) {
  return (
    <details className="group rounded-2xl border border-sky-100 bg-slate-50">
      <summary className="cursor-pointer list-none p-5 sm:p-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-sky-600">
              {label}
            </p>

            <h2 className="mt-1 text-2xl font-black text-slate-900">
              {title}
            </h2>

            <p className="mt-1 text-xs text-slate-400">
              {matches.length} {matches.length === 1 ? "match" : "matches"}
            </p>
          </div>

          <span className="text-xl font-black text-slate-400 transition-transform group-open:rotate-180">
            ↓
          </span>
        </div>
      </summary>

      <div className="space-y-3 border-t border-sky-100 p-4 sm:p-5">
        {matches.length === 0 ? (
          <div className="rounded-2xl border border-sky-100 bg-white p-8 text-center text-sm text-slate-400">
            {upcoming
              ? "No upcoming matches."
              : "No results available."}
          </div>
        ) : (
          groups.map(([key, competitionMatches]) => (
            <details
              key={key}
              className="group/competition overflow-hidden rounded-2xl border border-sky-100 bg-white"
            >
              <summary className="cursor-pointer list-none p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-black uppercase tracking-wide text-slate-900">
                      {competitionMatches[0].competition}
                    </h3>

                    <p className="mt-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      {competitionMatches[0].season} ·{" "}
                      {competitionMatches.length}{" "}
                      {competitionMatches.length === 1
                        ? "match"
                        : "matches"}
                    </p>
                  </div>

                  <span className="text-lg font-black text-slate-400 transition-transform group-open/competition:rotate-180">
                    ↓
                  </span>
                </div>
              </summary>

              <div className="space-y-3 border-t border-slate-100 p-3">
                {competitionMatches.map((match) => (
                  <MatchCard
                    key={match.id}
                    match={match}
                    upcoming={upcoming}
                  />
                ))}
              </div>
            </details>
          ))
        )}
      </div>
    </details>
  );
}

function MatchCard({
  match,
  upcoming = false,
}: {
  match: any;
  upcoming?: boolean;
}) {
  return (
    <a
      href={`/matches/${match.id}`}
      className="block rounded-2xl border border-sky-100 bg-white p-4 transition hover:border-sky-300 hover:shadow-sm"
    >
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <span className="block truncate text-[10px] font-black uppercase tracking-wider text-sky-600">
            {match.competition}
          </span>

          <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
            {match.season}
          </span>
        </div>

        <span className="shrink-0 text-[10px] font-semibold text-slate-400">
          {new Date(match.date).toLocaleDateString("en-IN", {
            day: "numeric",
            month: "short",
          })}
        </span>
      </div>

      <div className="mt-4 grid grid-cols-[1fr_auto_1fr] items-center gap-3">
        <Team team={match.home_team} align="right" />

        <div className="min-w-[70px] text-center">
          {upcoming ? (
            <Countdown match={match} />
          ) : (
            <div className="text-xl font-black text-slate-900">
              {match.home_score} - {match.away_score}
            </div>
          )}
        </div>

        <Team team={match.away_team} align="left" />
      </div>

      {match.venue && (
        <div className="mt-3 border-t border-slate-100 pt-2 text-center text-[10px] font-semibold text-slate-400">
          {match.venue}
        </div>
      )}
    </a>
  );
}

function Countdown({ match }: { match: any }) {
  const getDiff = () => {
    const time = match.time
      ? match.time.slice(0, 5)
      : "12:00";

    return (
      new Date(
        `${match.date}T${time}:00+05:30`
      ).getTime() - Date.now()
    );
  };

  const [diff, setDiff] = useState(getDiff);

  useEffect(() => {
    const timer = setInterval(() => {
      setDiff(getDiff());
    }, 60000);

    return () => clearInterval(timer);
  }, [match.date, match.time]);

  const totalMinutes = Math.max(
    0,
    Math.floor(diff / 60000)
  );

  const days = Math.floor(totalMinutes / 1440);
  const hours = Math.floor(
    (totalMinutes % 1440) / 60
  );
  const minutes = totalMinutes % 60;

  let countdown = "TODAY";

  if (days > 0) {
    countdown =
      days === 1
        ? "1 DAY TO GO"
        : `${days} DAYS TO GO`;
  }

  return (
    <>
      <div className="text-xs font-black uppercase text-slate-400">
        VS
      </div>

      <div className="mt-1 text-[10px] font-bold text-slate-400">
        {match.time
          ? new Date(
              `1970-01-01T${match.time.slice(0, 5)}:00`
            ).toLocaleTimeString("en-IN", {
              hour: "numeric",
              minute: "2-digit",
            })
          : "TBC"}
      </div>

      <div className="mt-1 text-[9px] font-black uppercase tracking-wider text-sky-600">
        {countdown}
      </div>

      {days === 0 && hours > 0 && (
        <div className="mt-0.5 text-[8px] font-bold text-slate-400">
          {hours}h {minutes}m
        </div>
      )}
    </>
  );
}

function Team({
  team,
  align,
}: {
  team: any;
  align: "left" | "right";
}) {
  const name = team?.short_name || team?.name || "TBD";

  return (
    <div
      className={`flex items-center gap-2 ${
        align === "right"
          ? "justify-end"
          : "justify-start"
      }`}
    >
      {align === "right" && (
        <span className="text-xs font-bold text-slate-800">
          {name}
        </span>
      )}

      {team?.crest_url ? (
        <img
          src={team.crest_url}
          alt=""
          className="h-8 w-8 shrink-0 object-contain"
        />
      ) : (
        <div className="h-8 w-8 shrink-0 rounded-full bg-slate-100" />
      )}

      {align === "left" && (
        <span className="text-xs font-bold text-slate-800">
          {name}
        </span>
      )}
    </div>
  );
}
