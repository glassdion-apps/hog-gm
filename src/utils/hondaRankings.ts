import { players } from '../data/players'
import { getRosterFitScore } from './rosterFit'

export function getHondaRankings(
  draftedPlayerNames: string[],
) {
  const availablePlayers = players.filter(
    (player) => !draftedPlayerNames.includes(player.name),
  )

  const rankings = availablePlayers.map((player) => {
    const rosterFit = getRosterFitScore(
      draftedPlayerNames,
      player.position,
    )

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
      hondaEdge

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