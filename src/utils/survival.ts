export function getSurvivalChance(
  currentPickIndex: number,
  publicAdp: string,
) {
  const publicAdpNumber = Number(
    publicAdp.replace(/[^\d.]/g, ''),
  )

  if (Number.isNaN(publicAdpNumber)) {
    return 50
  }

  const currentPick = currentPickIndex + 1

  const distanceFromAdp =
    publicAdpNumber - currentPick

  if (distanceFromAdp <= 0) {
    return 10
  }

  if (distanceFromAdp <= 2) {
    return 25
  }

  if (distanceFromAdp <= 5) {
    return 45
  }

  if (distanceFromAdp <= 10) {
    return 70
  }

  return 85
}