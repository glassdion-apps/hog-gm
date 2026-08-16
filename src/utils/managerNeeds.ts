import { players } from '../data/players'

export function getManagerNeeds(
  roster: string[],
) {
  const counts = {
    QB: 0,
    RB: 0,
    WR: 0,
    TE: 0,
  }

  roster.forEach((playerName) => {
    const player = players.find(
      (p) => p.name === playerName,
    )

    if (player) {
      counts[player.position]++
    }
  })

  return [
    {
      position: 'QB',
      need: counts.QB === 0 ? 'High' : 'Low',
    },
    {
      position: 'RB',
      need:
        counts.RB < 2
          ? 'High'
          : counts.RB < 4
          ? 'Medium'
          : 'Low',
    },
    {
      position: 'WR',
      need:
        counts.WR < 2
          ? 'High'
          : counts.WR < 4
          ? 'Medium'
          : 'Low',
    },
    {
      position: 'TE',
      need: counts.TE === 0 ? 'High' : 'Low',
    },
  ]
}