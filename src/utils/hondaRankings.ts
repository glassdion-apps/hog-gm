import { players } from '../data/players'
import { getRosterFitScore } from './rosterFit'

import {
  getLiveRosterNeedScore,
  type LiveRosterCounts,
} from './liveRosterNeed'


export function getHondaRankings(
  draftedPlayerNames: string[],
  liveRosterCounts?: LiveRosterCounts,
) {

  
  const availablePlayers = players.filter(
    (player) => !draftedPlayerNames.includes(player.name),
  )

  const rankings = availablePlayers.map((player) => {
    const rosterFit = getRosterFitScore(
      draftedPlayerNames,
      player.position,
    )

    const position =
      player.position as
      | 'QB'
      | 'RB'
      | 'WR'
      | 'TE'

    const liveRosterNeed =
      liveRosterCounts
        ? getLiveRosterNeedScore(
          position,
          liveRosterCounts,
        )
        : 0

    const publicAdpNumber = Number(
      player.publicAdp.replace(/[^\d.]/g, ''),
    )

    const hondaEdge =
      Number.isNaN(publicAdpNumber)
        ? 0
        : publicAdpNumber - player.rank

    const score =
      player.score +
      rosterFit +
      hondaEdge +
      liveRosterNeed

    return {
      player,
      score,
    }
  })

  rankings.sort(
    (a, b) => b.score - a.score,
  )

  return rankings
}