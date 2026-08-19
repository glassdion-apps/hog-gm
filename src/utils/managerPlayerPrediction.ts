import {
    scoreManagerPrediction,
    type ManagerPredictionScore,
} from './managerPredictionScore'

import {
    explainManagerPrediction,
    type ManagerPredictionExplanation,
} from './managerPredictionExplanation'

export type ManagerPlayerPredictionInput = {
    manager: string
    round: number
    pickInRound: number
    overallPick: number

    player: string
    position: string

    isRookie?: boolean
    publicAdp?: number
}

export type ManagerPlayerPrediction = {
    manager: string
    player: string
    position: string
    score: number
    breakdown: ManagerPredictionScore
    explanation: ManagerPredictionExplanation
}

export function predictManagerPlayerInterest(
    input: ManagerPlayerPredictionInput,
): ManagerPlayerPrediction {
    const breakdown =
        scoreManagerPrediction({
            manager:
                input.manager,

            round:
                input.round,

            pickInRound:
                input.pickInRound,

            overallPick:
                input.overallPick,

            position:
                input.position,

            isRookie:
                input.isRookie,

            publicAdp:
                input.publicAdp,
        })

    return {
        manager:
            input.manager,

        player:
            input.player,

        position:
            input.position,

        score:
            breakdown.score,

        breakdown,

        explanation:
            explainManagerPrediction(
                breakdown,
            ),
    }
}

export function rankPlayersForManager(
    manager: string,
    round: number,
    pickInRound: number,
    overallPick: number,
    players: Array<{
        player: string
        position: string
        isRookie?: boolean
        publicAdp?: number
    }>,
) {
    return players
        .map(
            (player) =>
                predictManagerPlayerInterest({
                    manager,

                    round,

                    pickInRound,

                    overallPick,

                    player:
                        player.player,

                    position:
                        player.position,

                    isRookie:
                        player.isRookie,

                    publicAdp:
                        player.publicAdp,
                }),
        )
        .sort(
            (a, b) =>
                b.score -
                a.score,
        )
}