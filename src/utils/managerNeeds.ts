import { players } from '../data/players'
import type { PlayerPosition } from '../data/players'

export function getManagerNeeds(
  roster: string[],
) {
  const positionCounts: Record<PlayerPosition, number> = {
    QB: 0,
    RB: 0,
    WR: 0,
    TE: 0,
    K: 0,
    DST: 0,
  }

  roster.forEach((playerName) => {
    const player = players.find(
      (p) => p.name === playerName,
    )

    if (player) {
      positionCounts[player.position]++
    }
  })

  return [
    {
      position: 'QB',
      need:
        positionCounts.QB === 0
          ? 'High'
          : 'Low',
    },
    {
      position: 'RB',
      need:
        positionCounts.RB < 2
          ? 'High'
          : positionCounts.RB < 4
            ? 'Medium'
            : 'Low',
    },
    {
      position: 'WR',
      need:
        positionCounts.WR < 2
          ? 'High'
          : positionCounts.WR < 4
            ? 'Medium'
            : 'Low',
    },
    {
      position: 'TE',
      need:
        positionCounts.TE === 0
          ? 'High'
          : 'Low',
    },
    {
      position: 'K',
      need:
        positionCounts.K === 0
          ? 'High'
          : 'Low',
    },
    {
      position: 'DST',
      need:
        positionCounts.DST === 0
          ? 'High'
          : 'Low',
    },

  ]
}