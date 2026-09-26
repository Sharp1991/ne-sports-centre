"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Team = {
  id: string;
  name: string;
  short_name: string;
  crest_url: string | null;
};

type Match = {
  id: string;
  competition: string;
  season: string;
  date: string;
  time: string | null;
  home_score: number | null;
  away_score: number | null;
  home_team: Team | null;
  away_team: Team | null;
};

function getMatchDate(match: Match) {
  const time = match.time ? match.time.slice(0, 5) : "12:00";
  return new Date(`${match.date}T${time}:00+05:30`);
}

function formatTime(time: string | null) {
  if (!time) return "TBC";

  const [hour, minute] = time.split(":").map(Number);

  if (Number.isNaN(hour) || Number.isNaN(minute)) {
    return time.slice(0, 5);
  }

  const d = new Date();
  d.setHours(hour, minute);

  return d.toLocaleTimeString("en-IN", {
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatDate(date: string) {
  const d = new Date(`${date}T00:00:00`);

  return {
    weekday: d.toLocaleDateString("en-IN", { weekday: "short" }),
    fullDate: d.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "long",
      year: "numeric",
    }),
  };
}

function Crest({ team }: { team: Team | null }) {
  if (!team?.crest_url) {
    return (
      <div className="h-10 w-10 shrink-0 rounded-full bg-slate-100 sm:h-12 sm:w-12" />
    );
  }

  return (
    <img
      src={team.crest_url}
      alt=""
      className="h-10 w-10 shrink-0 object-contain sm:h-12 sm:w-12"
    />
  );
}

function Countdown({ match }: { match: Match }) {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const target = getMatchDate(match);
  const diff = target.getTime() - now.getTime();

  if (diff <= 0) {
    return (
      <p className="mt-1 text-[10px] font-black uppercase tracking-wider text-sky-600">
        Starting soon
      </p>
    );
  }

  const totalMinutes = Math.floor(diff / 60000);
  const days = Math.floor(totalMinutes / 1440);
  const hours = Math.floor((totalMinutes % 1440) / 60);
  const minutes = totalMinutes % 60;

  let label = "";

  if (days > 0) {
    label = `${days} ${days === 1 ? "day" : "days"} to go`;
  } else if (hours > 0) {
    label = `${hours}h ${minutes}m to go`;
  } else {
    label = `${Math.max(1, minutes)}m to go`;
  }

  return (
    <p className="mt-1 text-[10px] font-black uppercase tracking-wider text-sky-600">
      {label}
    </p>
  );
}

function MatchCard({
  match,
  upcoming,
}: {
  match: Match;
  upcoming: boolean;
}) {
  const finished =
    match.home_score !== null &&
    match.away_score !== null;

  return (
    <Link
      href={`/matches/${match.id}`}
      className="group block rounded-2xl border border-sky-100 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-sky-300 hover:shadow-md sm:p-5"
    >
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 sm:gap-6">
        <div className="flex min-w-0 items-center gap-3">
          <Crest team={match.home_team} />

          <span className="truncate text-sm font-black text-slate-900 sm:text-base">
            {match.home_team?.name ||
              match.home_team?.short_name ||
              "TBC"}
          </span>
        </div>

        <div className="text-center">
          <div className="text-xl font-black tracking-tight text-slate-900 sm:text-2xl">
            {finished
              ? `${match.home_score} – ${match.away_score}`
              : "VS"}
          </div>

          <p className="mt-1 text-[10px] font-black uppercase tracking-wider text-slate-400">
            {upcoming ? formatTime(match.time) : "Full Time"}
          </p>

          {upcoming ? (
            <Countdown match={match} />
          ) : (
            <p className="mt-1 text-[10px] font-black uppercase tracking-wider text-sky-600">
              View match →
            </p>
          )}
        </div>

        <div className="flex min-w-0 items-center justify-end gap-3">
          <span className="truncate text-right text-sm font-black text-slate-900 sm:text-base">
            {match.away_team?.name ||
              match.away_team?.short_name ||
              "TBC"}
          </span>

          <Crest team={match.away_team} />
        </div>
      </div>
    </Link>
  );
}

function DateGroup({
  match,
  children,
}: {
  match: Match;
  children: React.ReactNode;
}) {
  const { weekday, fullDate } = formatDate(match.date);

  return (
    <section>
      <div className="mb-3 flex items-baseline gap-2 border-b border-sky-100 pb-2">
        <span className="text-xs font-black uppercase tracking-widest text-sky-600">
          {weekday}
        </span>

        <h3 className="text-lg font-black text-slate-900 sm:text-xl">
          {fullDate}
        </h3>
      </div>

      <div className="space-y-3">{children}</div>
    </section>
  );
}

export default function MatchCalendar({
  matches,
}: {
  matches: Match[];
}) {
  const now = new Date();

  const upcomingMatches = matches
    .filter((match) => getMatchDate(match).getTime() > now.getTime())
    .sort(
      (a, b) =>
        getMatchDate(a).getTime() - getMatchDate(b).getTime()
    );

  const finishedMatches = matches
    .filter((match) => getMatchDate(match).getTime() <= now.getTime())
    .sort(
      (a, b) =>
        getMatchDate(b).getTime() - getMatchDate(a).getTime()
    );

  const [upcomingOpen, setUpcomingOpen] = useState(false);
  const [finishedOpen, setFinishedOpen] = useState(false);

  function groupByDate(items: Match[]) {
    const groups: { date: string; matches: Match[] }[] = [];

    items.forEach((match) => {
      const last = groups[groups.length - 1];

      if (last?.date === match.date) {
        last.matches.push(match);
      } else {
        groups.push({
          date: match.date,
          matches: [match],
        });
      }
    });

    return groups;
  }

  const upcomingGroups = groupByDate(upcomingMatches);
  const finishedGroups = groupByDate(finishedMatches);

  if (matches.length === 0) {
    return (
      <div className="rounded-2xl border border-sky-100 bg-white p-10 text-center">
        <p className="text-sm font-bold text-slate-500">
          No matches available for this competition season.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <section>
        <button
          onClick={() => setUpcomingOpen((open) => !open)}
          className="flex w-full items-center justify-between border-b-2 border-sky-500 pb-3 text-left"
        >
          <div>
            <p className="text-xs font-black uppercase tracking-[0.2em] text-sky-600">
              Fixtures
            </p>
            <h2 className="mt-1 text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">
              Upcoming
            </h2>
          </div>

          <span className="text-2xl font-black text-sky-500">
            {upcomingOpen ? "−" : "+"}
          </span>
        </button>

        {upcomingOpen && (
          <div className="mt-6 space-y-8">
            {upcomingGroups.length > 0 ? (
              upcomingGroups.map((group) => (
                <DateGroup
                  key={group.date}
                  match={group.matches[0]}
                >
                  {group.matches.map((match) => (
                    <MatchCard
                      key={match.id}
                      match={match}
                      upcoming
                    />
                  ))}
                </DateGroup>
              ))
            ) : (
              <p className="rounded-2xl border border-sky-100 bg-white p-6 text-sm font-bold text-slate-500">
                No upcoming matches.
              </p>
            )}
          </div>
        )}
      </section>

      <section>
        <button
          onClick={() => setFinishedOpen((open) => !open)}
          className="flex w-full items-center justify-between border-b-2 border-slate-200 pb-3 text-left"
        >
          <div>
            <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">
              Completed
            </p>
            <h2 className="mt-1 text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">
              Finished
            </h2>
          </div>

          <span className="text-2xl font-black text-slate-400">
            {finishedOpen ? "−" : "+"}
          </span>
        </button>

        {finishedOpen && (
          <div className="mt-6 space-y-8">
            {finishedGroups.length > 0 ? (
              finishedGroups.map((group) => (
                <DateGroup
                  key={group.date}
                  match={group.matches[0]}
                >
                  {group.matches.map((match) => (
                    <MatchCard
                      key={match.id}
                      match={match}
                      upcoming={false}
                    />
                  ))}
                </DateGroup>
              ))
            ) : (
              <p className="rounded-2xl border border-sky-100 bg-white p-6 text-sm font-bold text-slate-500">
                No finished matches.
              </p>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
