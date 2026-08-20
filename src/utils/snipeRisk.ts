import type {
  DraftManager,
} from '../types/draft'

import {
  getManagerRoundPositionRate,
} from './managerRoundTendencies'

import {
  getManagerPickZonePositionRate,
} from './managerPickTendencies'

import {
  getManagerPositionRate,
} from './managerHistoricalTendencies'

import {
  getUpcomingSnakePicks,
} from './snakeDraftOrder'

import {
  isHondaManager,
} from './hondaManager'

export type SnipeRiskLevel =
  | 'Low'
  | 'Medium'
  | 'High'
  | 'Very High'

function clamp(
  value: number,
  min: number,
  max: number,
) {
  return Math.max(
    min,
    Math.min(
      max,
      value,
    ),
  )
}

function getManagerPositionInterest(
  manager: DraftManager,
  position: string,
  round: number,
  pickInRound: number,
) {
  const historicalRate =
    getManagerPositionRate(
      manager.name,
      position,
    )

  const roundRate =
    getManagerRoundPositionRate(
      manager.name,
      round,
      position,
    )

  const zoneRate =
    getManagerPickZonePositionRate(
      manager.name,
      pickInRound,
      position,
    )

  const staticPreference =
    manager.preferredPositions.includes(
      position,
    )
      ? 1
      : 0

  return clamp(
    historicalRate * 0.25 +
    roundRate * 0.4 +
    zoneRate * 0.25 +
    staticPreference * 0.1,
    0,
    1,
  )
}

/*
 * Return only the selections that occur
 * before Honda ("You") is on the clock again.
 *
 * We deliberately walk farther than one round
 * because a snake turn can cause the same
 * manager to pick again very quickly.
 */
function getPicksBeforeNextHondaPick(
  managers: DraftManager[],
  currentPickIndex: number,
) {
  if (managers.length === 0) {
    return []
  }

  const maximumSearch =
    managers.length * 2

  const upcomingPicks =
    getUpcomingSnakePicks(
      managers,
      currentPickIndex,
      maximumSearch,
    )

  const picksBeforeHonda = []

  for (const upcoming of upcomingPicks) {
    if (
      isHondaManager(
        upcoming.manager.name,
      )
    ) {
      break
    }

    picksBeforeHonda.push(
      upcoming,
    )
  }

  return picksBeforeHonda
}

function getInterestScores(
  currentPickIndex: number,
  position: string,
  managers: DraftManager[],
) {
  const upcomingPicks =
    getPicksBeforeNextHondaPick(
      managers,
      currentPickIndex,
    )

  return upcomingPicks.map(
    (upcoming) =>
      getManagerPositionInterest(
        upcoming.manager,
        position,
        upcoming.round,
        upcoming.pickInRound,
      ),
  )
}

export function getManagerSnipeRiskScore(
  currentPickIndex: number,
  position: string,
  managers: DraftManager[],
) {
  const interestScores =
    getInterestScores(
      currentPickIndex,
      position,
      managers,
    )

  if (interestScores.length === 0) {
    return 0
  }

  const averageInterest =
    interestScores.reduce(
      (total, score) =>
        total + score,
      0,
    ) /
    interestScores.length

  const strongestInterest =
    Math.max(
      ...interestScores,
    )

  const strongInterestRate =
    interestScores.filter(
      (score) =>
        score >= 0.5,
    ).length /
    interestScores.length

  return clamp(
    averageInterest * 0.45 +
    strongestInterest * 0.35 +
    strongInterestRate * 0.2,
    0,
    1,
  )
}

export function getManagerSnipeRisk(
  currentPickIndex: number,
  position: string,
  managers: DraftManager[],
): SnipeRiskLevel {
  const interestScores =
    getInterestScores(
      currentPickIndex,
      position,
      managers,
    )

  if (interestScores.length === 0) {
    return 'Low'
  }

  const averageInterest =
    interestScores.reduce(
      (total, score) =>
        total + score,
      0,
    ) /
    interestScores.length

  const strongInterestCount =
    interestScores.filter(
      (score) =>
        score >= 0.5,
    ).length

  const strongInterestRate =
    strongInterestCount /
    interestScores.length

  if (
    averageInterest >= 0.65 ||
    strongInterestRate >= 0.75
  ) {
    return 'Very High'
  }

  if (
    averageInterest >= 0.45 ||
    strongInterestRate >= 0.5
  ) {
    return 'High'
  }

  if (
    averageInterest >= 0.25 ||
    strongInterestRate >= 0.25
  ) {
    return 'Medium'
  }

  return 'Low'
}