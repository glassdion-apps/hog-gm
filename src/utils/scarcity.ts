import { players } from '../data/players'

export function getPositionalScarcity(
  draftedPlayerNames: string[],
  position: string,
) {
  const remaining = players.filter(
    (player) =>
      player.position === position &&
      !draftedPlayerNames.includes(player.name),
  )

  if (remaining.length <= 2) {
    return 'Critical'
  }

  if (remaining.length <= 5) {
    return 'Very High'
  }

  if (remaining.length <= 8) {
    return 'High'
  }

  if (remaining.length <= 12) {
    return 'Medium'
  }

  return 'Low'
}