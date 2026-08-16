import type { Player } from '../data/players'
import type { DraftManager } from '../types/draft'

export function getManagerDraftScore(
    player: Player,
    manager: DraftManager,
) {
    let score = player.score

    // Manager tendency
    if (
        manager.tendency === 'RB Heavy' &&
        player.position === 'RB'
    ) {
        score += 8
    }

    if (
        manager.tendency === 'WR Heavy' &&
        player.position === 'WR'
    ) {
        score += 8
    }

    if (
        manager.tendency === 'QB Early' &&
        player.position === 'QB'
    ) {
        score += 10
    }

    // Lower risk players
    if (player.risk === 'Low') {
        score += 2
    }

    // Franchise players get a bump
    if (player.tier === 'Franchise') {
        score += 3
    }

    return score
}
