export function getCompetitionMatchesHref(
  competition: string,
  season: string
) {
  return `/competitions/${encodeURIComponent(
    competition
  )}/${encodeURIComponent(season)}/matches`;
}
