export type ProjectedStats = {
  // Passing
  passingAttempts?: number
  passingCompletions?: number
  passingYards?: number
  passingTouchdowns?: number
  interceptions?: number
  passingTwoPointConversions?: number

  // Rushing
  rushingAttempts?: number
  rushingYards?: number
  rushingTouchdowns?: number
  rushingTwoPointConversions?: number
  rushing100YardGames?: number

  // Receiving
  receptions?: number
  receivingYards?: number
  receivingTouchdowns?: number
  receivingTwoPointConversions?: number

  // Misc offense
  fumblesLost?: number
  offensiveFumbleRecoveryTouchdowns?: number

  // Kicking
  fieldGoalsMade?: number
  fieldGoals50Plus?: number
  extraPointsMade?: number
  kickingTwoPointRecoveries?: number

  // DST
  sacks?: number
  defensiveInterceptions?: number
  defensiveFumbleRecoveries?: number
  defensiveTouchdowns?: number
  kickReturnTouchdowns?: number
  puntReturnTouchdowns?: number
  safeties?: number
  specialTeamsTwoPointReturns?: number
  specialTeamsOnePointSafeties?: number

  // DST game-based scoring
  gamesPointsAllowed0to6?: number
  gamesPointsAllowed7to13?: number
  gamesPointsAllowed14to20?: number
  gamesPointsAllowed21to27?: number

  gamesYardsAllowed0to49?: number
  gamesYardsAllowed50to99?: number
  gamesYardsAllowed100to149?: number
  gamesYardsAllowed150to199?: number
  gamesYardsAllowed200to249?: number
  gamesYardsAllowed250to299?: number
}

export function calculateProjectedFantasyPoints(
  stats: ProjectedStats,
) {
  let points = 0

  // Passing
  points += (stats.passingYards ?? 0) * 0.04
  points += (stats.passingTouchdowns ?? 0) * 6
  points += (stats.interceptions ?? 0) * -2
  points += (stats.passingTwoPointConversions ?? 0) * 2

  // Rushing
  points += (stats.rushingYards ?? 0) * 0.1
  points += (stats.rushingTouchdowns ?? 0) * 6
  points += (stats.rushingTwoPointConversions ?? 0) * 2
  points += (stats.rushing100YardGames ?? 0) * 5

  // Receiving
  points += (stats.receptions ?? 0) * 1
  points += (stats.receivingYards ?? 0) * 0.1
  points += (stats.receivingTouchdowns ?? 0) * 6
  points += (stats.receivingTwoPointConversions ?? 0) * 2

  // Misc offense
  points += (stats.fumblesLost ?? 0) * -2
  points +=
    (stats.offensiveFumbleRecoveryTouchdowns ?? 0) * 6

  // Kicking
  points += (stats.fieldGoalsMade ?? 0) * 3

  // 50+ FGs receive two ADDITIONAL points
  points += (stats.fieldGoals50Plus ?? 0) * 2

  points += (stats.extraPointsMade ?? 0) * 1
  points += (stats.kickingTwoPointRecoveries ?? 0) * 2

  // DST standard stats
  points += (stats.sacks ?? 0) * 1
  points += (stats.defensiveInterceptions ?? 0) * 2
  points += (stats.defensiveFumbleRecoveries ?? 0) * 2
  points += (stats.defensiveTouchdowns ?? 0) * 6
  points += (stats.kickReturnTouchdowns ?? 0) * 6
  points += (stats.puntReturnTouchdowns ?? 0) * 6
  points += (stats.safeties ?? 0) * 2
  points += (stats.specialTeamsTwoPointReturns ?? 0) * 2
  points += (stats.specialTeamsOnePointSafeties ?? 0) * 1

  // DST points allowed
  points += (stats.gamesPointsAllowed0to6 ?? 0) * 8
  points += (stats.gamesPointsAllowed7to13 ?? 0) * 6
  points += (stats.gamesPointsAllowed14to20 ?? 0) * 4
  points += (stats.gamesPointsAllowed21to27 ?? 0) * 2

  // DST yards allowed
  points += (stats.gamesYardsAllowed0to49 ?? 0) * 12
  points += (stats.gamesYardsAllowed50to99 ?? 0) * 10
  points += (stats.gamesYardsAllowed100to149 ?? 0) * 8
  points += (stats.gamesYardsAllowed150to199 ?? 0) * 6
  points += (stats.gamesYardsAllowed200to249 ?? 0) * 4
  points += (stats.gamesYardsAllowed250to299 ?? 0) * 2

  return Number(points.toFixed(1))
}