import { draftManagers } from '../data/managers'
import { getManagerPrediction } from './managerPrediction'
import { getHondaRankings } from './hondaRankings'

type ForecastInput = {
    currentPickIndex: number
    managerRosters: Record<string, string[]>
    draftedPlayerNames: string[]
    currentDecisionScore: number
}

export function getHondaForecast({
    currentPickIndex,
    managerRosters,
    draftedPlayerNames,
    currentDecisionScore,
}: ForecastInput) {
    const simulatedDraftedPlayers = [
        ...draftedPlayerNames,
    ]

    const simulatedRosters = {
        ...managerRosters,
    }

    const forecastPicks: {
        manager: string
        position: string
        confidence: number
        player: string
    }[] = []

    for (let i = 1; i <= 3; i++) {
        const manager =
            draftManagers[
            (currentPickIndex + i) %
            draftManagers.length
            ]

        const prediction = getManagerPrediction(
            manager,
            simulatedRosters[manager.name] ?? [],
            simulatedDraftedPlayers,
        )

        if (!prediction) {
            continue
        }

        const predictedPlayer =
            prediction.players[0]

        if (!predictedPlayer) {
            continue
        }

        forecastPicks.push({
            manager: manager.name,
            position: prediction.position,
            confidence: prediction.confidence,
            player: predictedPlayer.name,
        })

        simulatedDraftedPlayers.push(
            predictedPlayer.name,
        )

        simulatedRosters[manager.name] = [
            ...(simulatedRosters[manager.name] ?? []),
            predictedPlayer.name,
        ]
    }

    const futureRankings = getHondaRankings(
        simulatedDraftedPlayers,
    )

    const expectedRecommendation =
        futureRankings[0]?.player ?? null

    const projectedScore =
        futureRankings[0]?.score ?? 0

    const costOfWaiting =
        currentDecisionScore - projectedScore
    let advice = 'SAFE TO WAIT'

    if (costOfWaiting >= 8) {
        advice = 'TAKE NOW'
    } else if (costOfWaiting >= 4) {
        advice = 'RISKY TO WAIT'
    }
    let adviceReason =
        'Waiting is projected to preserve similar value.'

    if (advice === 'TAKE NOW') {
        adviceReason =
            `Waiting is projected to cost ${costOfWaiting.toFixed(1)} Honda points.`
    } else if (advice === 'RISKY TO WAIT') {
        adviceReason =
            `Waiting could cost ${costOfWaiting.toFixed(1)} Honda points.`
    }
    return {
        picks: forecastPicks,
        futureRecommendation: expectedRecommendation,
        projectedScore,
        costOfWaiting,
        advice,
        adviceReason,
    }
}