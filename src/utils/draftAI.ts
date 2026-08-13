import { players } from '../data/players'
import type { DraftManager } from '../types/draft'

export function getBestPlayerForManager(
  manager: DraftManager,
  draftedPlayerNames: string[],
) {
  const availablePlayers = players.filter(
    (player) => !draftedPlayerNames.includes(player.name),
  )

  if (availablePlayers.length === 0) {
    return null
  }

  const sortedPlayers = [...availablePlayers].sort((a, b) => {
    const aPreference =
      manager.preferredPositions.indexOf(a.position)

    const bPreference =
      manager.preferredPositions.indexOf(b.position)

    if (aPreference !== bPreference) {
      return aPreference - bPreference
    }

    return b.score - a.score
  })

  return sortedPlayers[0]
}