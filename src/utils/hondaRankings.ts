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

    const publicRank =
      player.fantasyProsRank ??
      player.publicAdpOverall ??
      player.rank

    const hondaRank =
      player.hondaDraftRank ??
      player.rank

    const rawHondaEdge =
      publicRank - hondaRank

    const hondaEdge =
      Math.max(
        -10,
        Math.min(
          10,
          rawHondaEdge * 0.5,
        ),
      )

    const hondaRankValue =
      Math.max(
        0,
        100 -
        (hondaRank - 1) * 0.5,
      )

    const vorBonus =
      Math.max(
        -10,
        Math.min(
          20,
          (player.valueOverReplacement ?? 0) / 10,
        ),
      )

    const score =
      hondaRankValue +
      vorBonus +
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