import { draftManagers } from '../data/managers'
import { getManagerPrediction } from './managerPrediction'

export function getLiveDraftIntel(
    currentPickIndex: number,
    managerRosters: Record<string, string[]>,
    draftedPlayerNames: string[],
) {
    const alerts = []

    for (let i = 1; i <= 3; i++) {
        const manager =
            draftManagers[
                (currentPickIndex + i) %
                    draftManagers.length
            ]

        const prediction = getManagerPrediction(
            manager,
            managerRosters[manager.name] ?? [],
            draftedPlayerNames,
        )

        if (!prediction) continue

        alerts.push({
            manager: manager.name,
            position: prediction.position,
            confidence: prediction.confidence,
            player:
                prediction.players[0]?.name ??
                'Unknown',
        })
    }

    return alerts.sort(
        (a, b) =>
            b.confidence - a.confidence,
    )
}