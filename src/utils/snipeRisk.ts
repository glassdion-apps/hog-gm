import type { DraftManager } from '../types/draft'

export function getManagerSnipeRisk(
  currentPickIndex: number,
  position: string,
  managers: DraftManager[],
) {
  const managersBeforeNextTurn = managers.slice(
    (currentPickIndex + 1) % managers.length,
  )

  const interestedManagers = managersBeforeNextTurn.filter(
    (manager) =>
      manager.preferredPositions[0] === position ||
      manager.preferredPositions[1] === position,
  )

  const interestRate =
    managersBeforeNextTurn.length === 0
      ? 0
      : interestedManagers.length / managersBeforeNextTurn.length

  if (interestRate >= 0.75) {
    return 'Very High'
  }

  if (interestRate >= 0.5) {
    return 'High'
  }

  if (interestRate >= 0.25) {
    return 'Medium'
  }

  return 'Low'
}