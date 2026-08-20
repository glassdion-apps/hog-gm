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
import {
    isHondaManager,
} from './hondaManager'


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
                isHondaManager(
                    upcoming.manager.name,
                ),
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
                    !isHondaManager(
                        upcoming.manager.name,
                    ),
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
    const positions = [
        'QB',
        'RB',
        'WR',
        'TE',
    ] as const

    const positionalWaitCosts =
        positions.map((position) => {
            const bestNow =
                currentRankings.find(
                    (entry) =>
                        entry.player.position ===
                        position,
                )

            const bestExpectedLater =
                currentRankings.find(
                    (entry) => {
                        if (
                            entry.player.position !==
                            position
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
                )

            const bestNowSurvival =
                bestNow
                    ? survivalByPlayer.get(
                        bestNow.player.name,
                    )?.survivalRate ?? 0
                    : 0

            const fallback =
                currentRankings
                    .filter(
                        (entry) =>
                            entry.player.position ===
                            position &&
                            entry.player.name !==
                            bestNow?.player.name,
                    )
                    .sort(
                        (a, b) =>
                            (
                                b.player.valueOverReplacement ??
                                0
                            ) -
                            (
                                a.player.valueOverReplacement ??
                                0
                            ),
                    )[0]

            const fallbackVor =
                fallback?.player
                    .valueOverReplacement ?? 0

            const nowVor =
                bestNow?.player
                    .valueOverReplacement ?? 0

            const laterVor =
                bestExpectedLater?.player
                    .valueOverReplacement ?? 0

            return {
                position,
                bestNow:
                    bestNow?.player.name ?? null,
                bestNowVor: nowVor,
                bestNowSurvival:
                    Number(
                        (
                            bestNowSurvival * 100
                        ).toFixed(1),
                    ),
                expectedLater:
                    bestExpectedLater?.player.name ??
                    null,
                expectedLaterVor: laterVor,
                waitCost:
                    Math.max(
                        0,
                        nowVor - laterVor,
                    ),
                fallback:
                    fallback?.player.name ?? null,
                fallbackVor,
                missCost:
                    Math.max(
                        0,
                        nowVor - fallbackVor,
                    ),
                urgency:
                    Number(
                        (
                            Math.max(
                                0,
                                nowVor - laterVor,
                            ) *
                            (1 - bestNowSurvival)
                        ).toFixed(1),
                    ),
            }
        })
    const twoPickPaths =
        positions.map((position) => {
            const takeNowEntry =
                currentRankings.find(
                    (entry) =>
                        entry.player.position ===
                        position,
                )

            const takeNow =
                takeNowEntry?.player ?? null

            if (!takeNow) {
                return {
                    takePosition: position,
                    takeNow: null,
                    takeNowVor: 0,
                    expectedNext: null,
                    expectedNextPosition: null,
                    expectedNextVor: 0,
                    expectedNextSurvival: 0,
                    combinedVor: 0,
                }
            }

            const hypotheticalDraftedPlayerNames = [
                ...draftedPlayerNames,
                takeNow.name,
            ]

            const hypotheticalRosterCounts:
                LiveRosterCounts = {
                ...liveRosterCounts,
                [position]:
                    liveRosterCounts[position] + 1,
            }

            const hypotheticalRankings =
                getHondaRankings(
                    hypotheticalDraftedPlayerNames,
                    hypotheticalRosterCounts,
                )

            const hypotheticalAvailablePlayers =
                hypotheticalRankings.map(
                    (entry) => entry.player,
                )

            const pathSurvivalResults =
                simulateNextPickAvailability(
                    hypotheticalAvailablePlayers,
                    picksUntilNextHondaPick,
                    100,
                    {
                        upcomingPicks:
                            opponentPicksBeforeHonda,

                        managerRosters,

                        draftedPlayerNames:
                            hypotheticalDraftedPlayerNames,
                    },
                )

            const pathSurvivalByPlayer =
                new Map(
                    pathSurvivalResults.map(
                        (result) => [
                            result.player.name,
                            result,
                        ],
                    ),
                )

            const expectedNextEntry =
                hypotheticalRankings.find(
                    (entry) => {
                        const survival =
                            pathSurvivalByPlayer.get(
                                entry.player.name,
                            )

                        return (
                            survival !== undefined &&
                            survival.survivalRate >=
                            minimumExpectedSurvival
                        )
                    },
                )

            const expectedNext =
                expectedNextEntry?.player ?? null

            const expectedNextRisk =
                expectedNext
                    ? pathSurvivalByPlayer.get(
                        expectedNext.name,
                    )
                    : undefined

            const nowVor =
                takeNow.valueOverReplacement ?? 0

            const nextVor =
                expectedNext?.valueOverReplacement ??
                0

            return {
                takePosition: position,
                takeNow:
                    takeNow.name,
                takeNowVor:
                    nowVor,
                expectedNext:
                    expectedNext?.name ?? null,
                expectedNextPosition:
                    expectedNext?.position ?? null,
                expectedNextVor:
                    nextVor,
                expectedNextSurvival:
                    Number(
                        (
                            (
                                expectedNextRisk
                                    ?.survivalRate ??
                                0
                            ) * 100
                        ).toFixed(1),
                    ),
                combinedVor:
                    Number(
                        (
                            nowVor + nextVor
                        ).toFixed(1),
                    ),
            }
        })

    console.table(twoPickPaths)
    console.table(positionalWaitCosts)



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

        positionalWaitCosts,

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