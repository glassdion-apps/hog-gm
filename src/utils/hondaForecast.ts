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

type ForecastInput = {
    currentPickIndex: number
    managerRosters: Record<string, string[]>
    draftedPlayerNames: string[]
    currentDecisionScore: number
    liveRosterCounts: LiveRosterCounts
}

export function getHondaForecast({
    currentPickIndex,
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

    let picksUntilNextHondaPick = 0

    for (
        let offset = 1;
        offset <= draftManagers.length;
        offset++
    ) {
        const futureManager =
            draftManagers[
            (currentPickIndex + offset) %
            draftManagers.length
            ]

        if (
            futureManager?.name === 'You'
        ) {
            picksUntilNextHondaPick =
                offset - 1
            break
        }
    }

    const survivalResults =
        simulateNextPickAvailability(
            availablePlayers,
            picksUntilNextHondaPick,
            100,
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

    const forecastPicks =
        survivalResults
            .filter(
                (result) =>
                    result.survivalRate < 0.5,
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
            .slice(0, 3)
            .map(
                (result, index) => ({
                    manager:
                        `Most At Risk ${index + 1}`,
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
                            ).toFixed(1),
                        ),
                    player:
                        result.player.name,
                }),
            )

    return {
        picks: forecastPicks,
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