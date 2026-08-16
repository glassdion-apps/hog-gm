import { players } from '../data/players'

export function getRosterFitScore(
  draftedPlayerNames: string[],
  playerPosition: string,
) {
  const draftedPlayers = players.filter((player) =>
    draftedPlayerNames.includes(player.name),
  )

  const positionCounts = draftedPlayers.reduce<Record<string, number>>(
    (counts, player) => {
      counts[player.position] = (counts[player.position] ?? 0) + 1
      return counts
    },
    {},
  )

  const currentCount = positionCounts[playerPosition] ?? 0

  if (playerPosition === 'QB') {
    return currentCount === 0 ? 8 : -6
  }

  if (playerPosition === 'TE') {
    return currentCount === 0 ? 7 : -4
  }

  if (playerPosition === 'RB') {
    if (currentCount === 0) return 8
    if (currentCount === 1) return 6
    if (currentCount === 2) return 2
    return -3
  }

  if (playerPosition === 'WR') {
    if (currentCount === 0) return 8
    if (currentCount === 1) return 6
    if (currentCount === 2) return 3
    return 0
  }

  return 0
}