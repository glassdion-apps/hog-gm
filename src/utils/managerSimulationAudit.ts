import {
  players,
  type PlayerPosition,
} from '../data/players'

import {
  buildManagerHistoricalTendencies,
} from './managerHistoricalTendencies'

const offensivePositions: PlayerPosition[] = [
  'QB',
  'RB',
  'WR',
  'TE',
]

export type ManagerPositionAudit = {
  position: PlayerPosition
  currentCount: number
  currentRate: number
  historicalRate: number
  difference: number
}

export type ManagerSimulationAudit = {
  manager: string
  rosterSize: number
  historicalSampleSize: number
  positionFitScore: number
  positions: ManagerPositionAudit[]
}

export function auditManagerSimulation(
  manager: string,
  roster: string[],
): ManagerSimulationAudit {
  const historical =
    buildManagerHistoricalTendencies(manager)

  const rosterPlayers = roster
    .map((playerName) =>
      players.find(
        (player) => player.name === playerName,
      ),
    )
    .filter((player) => player !== undefined)

  const offensiveRoster = rosterPlayers.filter(
    (player) =>
      offensivePositions.includes(player.position),
  )

  const historicalOffensiveTotal =
    offensivePositions.reduce(
      (total, position) => {
        const tendency =
          historical.positionTendencies.find(
            (item) => item.position === position,
          )

        return total + (tendency?.rate ?? 0)
      },
      0,
    )

  const positions =
    offensivePositions.map(
      (position): ManagerPositionAudit => {
        const currentCount =
          offensiveRoster.filter(
            (player) => player.position === position,
          ).length

        const currentRate =
          offensiveRoster.length > 0
            ? currentCount / offensiveRoster.length
            : 0

        const rawHistoricalRate =
          historical.positionTendencies.find(
            (item) => item.position === position,
          )?.rate ?? 0

        const historicalRate =
          historicalOffensiveTotal > 0
            ? rawHistoricalRate / historicalOffensiveTotal
            : 0

        return {
          position,
          currentCount,
          currentRate,
          historicalRate,
          difference: currentRate - historicalRate,
        }
      },
    )

  const averageDifference =
    positions.reduce(
      (total, position) =>
        total + Math.abs(position.difference),
      0,
    ) / positions.length

  const positionFitScore =
    Math.round(
      Math.max(
        0,
        Math.min(
          100,
          (1 - averageDifference) * 100,
        ),
      ),
    )

  return {
    manager,
    rosterSize: roster.length,
    historicalSampleSize: historical.totalPicks,
    positionFitScore,
    positions,
  }
}
