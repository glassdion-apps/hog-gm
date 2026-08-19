import { draftManagers } from '../data/managers'
import { getHondaRankings } from './hondaRankings'
import type { LiveRosterCounts } from './liveRosterNeed'
import {
    getWaitUrgencyScore,
} from './hondaWaitRisk'
import {
    simulateNextPickAvailability,
} from './draftSimulation'
import { getBestAvailableValue } from './valueEngine'
import { getRosterFitScore } from './rosterFit'
import { getLiveRosterNeedScore } from './liveRosterNeed'
import {
    getUpcomingSnakePicks,
} from './snakeDraftOrder'
import {
    getManagerPrediction,
} from './managerPrediction'

type ForecastInput = {
    currentPickIndex: number
    managerRosters: Record<string, string[]>
    draftedPlayerNames: string[]
    currentDecisionScore: number
    liveRosterCounts: LiveRosterCounts
}

export function getHondaForecast({
    currentPickIndex,
    managerRosters,
    draftedPlayerNames,
    currentDecisionScore,
    liveRosterCounts,
}: ForecastInput) {

    const currentRankings =
        getHondaRankings(
            draftedPlayerNames,
            liveRosterCounts,
        )

    const currentRecommendation =
        currentRankings[0]?.player ?? null

    const availablePlayers =
        currentRankings.map(
            (entry) => entry.player,
        )

    const upcomingPicks =
        getUpcomingSnakePicks(
            draftManagers,
            currentPickIndex,
            draftManagers.length * 2,
        )

    const nextHondaPick =
        upcomingPicks.find(
            (upcoming) =>
                upcoming.manager.name ===
                'You',
        )

    const picksUntilNextHondaPick =
        nextHondaPick
            ? Math.max(
                0,
                nextHondaPick.pickIndex -
                currentPickIndex -
                1,
            )
            : 0

    const opponentPicksBeforeHonda =
        nextHondaPick
            ? upcomingPicks.filter(
                (upcoming) =>
                    upcoming.pickIndex <
                    nextHondaPick.pickIndex &&
                    upcoming.manager.name !==
                    'You',
            )
            : []

    const survivalResults =
        simulateNextPickAvailability(
            availablePlayers,
            picksUntilNextHondaPick,
            100,
            {
                upcomingPicks:
                    opponentPicksBeforeHonda,

                managerRosters,

                draftedPlayerNames,
            },
        )

    const survivalByPlayer =
        new Map(
            survivalResults.map(
                (result) => [
                    result.player.name,
                    result,
                ],
            ),
        )

    const currentWaitRisk =
        currentRecommendation
            ? survivalByPlayer.get(
                currentRecommendation.name,
            )
            : undefined

    const survivalPercent =
        Number(
            (
                (
                    currentWaitRisk?.survivalRate ??
                    0
                ) * 100
            ).toFixed(1),
        )

    const waitUrgencyScore =
        getWaitUrgencyScore(
            currentWaitRisk?.survivalRate ??
            0,
        )

    /*
     * Find the best player we can reasonably
     * expect to still be available at our
     * next selection.
     *
     * 50% is our first "credible survival"
     * threshold.
     */
    const minimumExpectedSurvival =
        0.5

    const futureCandidate =
        currentRankings.find(
            (entry) => {
                if (
                    entry.player.name ===
                    currentRecommendation?.name
                ) {
                    return false
                }

                const survival =
                    survivalByPlayer.get(
                        entry.player.name,
                    )

                return (
                    survival !== undefined &&
                    survival.survivalRate >=
                    minimumExpectedSurvival
                )
            },
        ) ?? null

    const expectedRecommendation =
        futureCandidate?.player ?? null

    let projectedScore = 0

    if (expectedRecommendation) {
        const futureValue =
            getBestAvailableValue(
                draftedPlayerNames,
                expectedRecommendation.name,
            )

        const futureRosterFit =
            getRosterFitScore(
                draftedPlayerNames,
                expectedRecommendation.position,
            )

        const futurePosition =
            expectedRecommendation.position as
            | 'QB'
            | 'RB'
            | 'WR'
            | 'TE'

        const futureRosterNeed =
            getLiveRosterNeedScore(
                futurePosition,
                liveRosterCounts,
            )

        projectedScore =
            futureValue
                ? futureValue.valueScore +
                futureRosterFit +
                futureRosterNeed
                : 0
    }

    const futureWaitRisk =
        expectedRecommendation
            ? survivalByPlayer.get(
                expectedRecommendation.name,
            )
            : undefined

    const futureSurvivalPercent =
        Number(
            (
                (
                    futureWaitRisk?.survivalRate ??
                    0
                ) * 100
            ).toFixed(1),
        )

    const costOfWaiting =
        currentDecisionScore -
        projectedScore

    const currentSeasonProjection =
        currentRecommendation?.hondaProjectedPoints ??
        currentRecommendation?.projectedPoints ??
        0

    const futureSeasonProjection =
        expectedRecommendation?.hondaProjectedPoints ??
        expectedRecommendation?.projectedPoints ??
        0

    const projectedPointsLost =
        Number(
            (
                currentSeasonProjection -
                futureSeasonProjection
            ).toFixed(1),
        )

    const currentPointsPerGame =
        Number(
            (
                currentSeasonProjection / 17
            ).toFixed(1),
        )

    const futurePointsPerGame =
        Number(
            (
                futureSeasonProjection / 17
            ).toFixed(1),
        )

    let advice:
        | 'TAKE NOW'
        | 'RISKY TO WAIT'
        | 'SAFE TO WAIT'

    if (survivalPercent < 35) {
        advice = 'TAKE NOW'
    } else if (
        survivalPercent < 70
    ) {
        advice = 'RISKY TO WAIT'
    } else {
        advice = 'SAFE TO WAIT'
    }

    let adviceReason =
        currentRecommendation
            ? `${currentRecommendation.name} has a ${survivalPercent}% simulated chance of reaching your next pick.`
            : 'No current Honda recommendation is available.'

    if (advice === 'TAKE NOW') {
        adviceReason =
            `${currentRecommendation?.name ?? 'This player'} survives only ${survivalPercent}% of simulations. Waiting carries major draft risk.`
    } else if (
        advice === 'RISKY TO WAIT'
    ) {
        adviceReason =
            `${currentRecommendation?.name ?? 'This player'} survives ${survivalPercent}% of simulations. Waiting is possible, but risky.`
    }

    const predictedThreatByPlayer =
        new Map<
            string,
            {
                manager: string
                confidence: number
            }
        >()

    for (
        const upcoming of
        opponentPicksBeforeHonda
    ) {
        const prediction =
            getManagerPrediction(
                upcoming.manager,
                managerRosters[
                upcoming.manager.name
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

        if (!prediction) {
            continue
        }

        prediction.players.forEach(
            (player, index) => {
                const rankFactor =
                    index === 0
                        ? 1
                        : index === 1
                            ? 0.85
                            : 0.7

                const threatConfidence =
                    prediction.confidence *
                    rankFactor

                const existing =
                    predictedThreatByPlayer.get(
                        player.name,
                    )

                if (
                    !existing ||
                    threatConfidence >
                    existing.confidence
                ) {
                    predictedThreatByPlayer.set(
                        player.name,
                        {
                            manager:
                                upcoming.manager.name,

                            confidence:
                                threatConfidence,
                        },
                    )
                }
            },
        )
    }

    const forecastPicks =
        survivalResults
            .filter(
                (result) =>
                    result.survivalRate <
                    0.5,
            )
            .sort(
                (a, b) =>
                    (
                        a.player.hondaDraftRank ??
                        a.player.rank
                    ) -
                    (
                        b.player.hondaDraftRank ??
                        b.player.rank
                    ),
            )
            .slice(
                0,
                3,
            )
            .map(
                (result) => {
                    const threat =
                        predictedThreatByPlayer.get(
                            result.player.name,
                        )

                    return {
                        manager:
                            threat?.manager ??
                            'Multiple Managers',

                        position:
                            result.player.position,

                        confidence:
                            Number(
                                (
                                    (
                                        1 -
                                        result.survivalRate
                                    ) *
                                    100
                                ).toFixed(
                                    1,
                                ),
                            ),

                        player:
                            result.player.name,
                    }
                },
            )

    return {
        picks:
            forecastPicks,

        futureRecommendation:
            expectedRecommendation,

        projectedScore,

        costOfWaiting,

        advice,

        adviceReason,

        survivalPercent,

        futureSurvivalPercent,

        waitUrgencyScore,

        picksUntilNextHondaPick,

        currentSeasonProjection,

        futureSeasonProjection,

        projectedPointsLost,

        currentPointsPerGame,

        futurePointsPerGame,
    }
}