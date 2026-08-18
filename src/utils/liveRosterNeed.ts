export type LiveRosterCounts = {
  QB: number
  RB: number
  WR: number
  TE: number
}

export function getLiveRosterNeedScore(
  position: 'QB' | 'RB' | 'WR' | 'TE',
  liveRosterCounts: LiveRosterCounts,
) {
  const rosterTargets = {
    QB: 2,
    RB: 5,
    WR: 6,
    TE: 2,
  } as const

  const remainingNeed =
    rosterTargets[position] -
    liveRosterCounts[position]

  if (remainingNeed <= 0) {
    return -10
  }

  if (remainingNeed === 1) {
    return position === 'RB' ||
      position === 'WR'
      ? 5
      : 2
  }

  if (remainingNeed === 2) {
    return 4
  }

  return 6
}