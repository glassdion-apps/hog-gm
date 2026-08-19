import {
    draftManagers,
} from '../data/managers'

import {
    getManagerPrediction,
} from './managerPrediction'

import {
    getUpcomingSnakePicks,
} from './snakeDraftOrder'

export type LiveDraftAlert = {
    manager: string
    position: string
    confidence: number
    player: string
    reasons: string[]
    round: number
    pickInRound: number
    overallPick: number
}

export function getLiveDraftIntel(
    currentPickIndex: number,
    managerRosters: Record<string, string[]>,
    draftedPlayerNames: string[],
): LiveDraftAlert[] {
    const alerts:
        LiveDraftAlert[] = []

    const upcomingPicks =
        getUpcomingSnakePicks(
            draftManagers,
            currentPickIndex,
            3,
        )

    for (
        const upcoming of
        upcomingPicks
    ) {
        const manager =
            upcoming.manager

        const prediction =
            getManagerPrediction(
                manager,
                managerRosters[
                    manager.name
                ] ?? [],
                draftedPlayerNames,
                {
                    round:
                        upcoming.round,

                    pickInRound:
                        upcoming.pickInRound,

                    overallPick:
                        upcoming.overallPick,
                },
            )

        if (
            !prediction
        ) {
            continue
        }

        alerts.push({
            manager:
                manager.name,

            position:
                prediction.position,

            confidence:
                prediction.confidence,

            player:
                prediction.players[0]
                    ?.name ??
                'Unknown',

            reasons:
                prediction.reasons,

            round:
                upcoming.round,

            pickInRound:
                upcoming.pickInRound,

            overallPick:
                upcoming.overallPick,
        })
    }

    return alerts.sort(
        (a, b) =>
            b.confidence -
            a.confidence,
    )
}