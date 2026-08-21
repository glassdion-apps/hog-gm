import { useState } from 'react'
import { draftManagers } from '../data/managers'
import { getHondaDraftDelta } from '../utils/draftStory'

type DraftPick = {
    player: string
    manager: string
    pick: number
}

type DraftResultsProps = {
    draftHistory: {
        player: string
        manager: string
        pick: number
        hondaPick: string | null
        predictedPick: string | null
        predictionConfidence: number | null
    }[]

    predictedDraftHistory: DraftPick[]
    hondaDraftHistory: DraftPick[]
}

export default function DraftResults({
    draftHistory,
    predictedDraftHistory,
    hondaDraftHistory,
}: DraftResultsProps) {
    const [boardView, setBoardView] = useState<
        'actual' | 'predicted' | 'honda'
    >('actual')
    const totalRounds = 15

    const predictionEligiblePicks =
        draftHistory.filter(
            (pick) => pick.predictedPick !== null,
        )

    const predictionExactMatches =
        predictionEligiblePicks.filter(
            (pick) =>
                pick.predictedPick === pick.player,
        ).length

    const predictionAccuracy =
        predictionEligiblePicks.length > 0
            ? Math.round(
                (
                    predictionExactMatches /
                    predictionEligiblePicks.length
                ) * 100,
            )
            : 0

    const resolvedPredictionDistances =
        predictionEligiblePicks
            .map((pick) => {
                if (pick.predictedPick === pick.player) {
                    return 0
                }

                const actualPredictedPlayerPick =
                    draftHistory.find(
                        (laterPick) =>
                            laterPick.pick > pick.pick &&
                            laterPick.player === pick.predictedPick,
                    )

                if (!actualPredictedPlayerPick) {
                    return null
                }

                return (
                    actualPredictedPlayerPick.pick -
                    pick.pick
                )
            })
            .filter(
                (distance): distance is number =>
                    distance !== null,
            )

    const predictionWithinOne =
        resolvedPredictionDistances.filter(
            (distance) => distance <= 1,
        ).length

    const predictionWithinThree =
        resolvedPredictionDistances.filter(
            (distance) => distance <= 3,
        ).length

    const predictionWithinThreeRate =
        resolvedPredictionDistances.length > 0
            ? Math.round(
                (
                    predictionWithinThree /
                    resolvedPredictionDistances.length
                ) * 100,
            )
            : 0

    const averagePredictionMiss =
        resolvedPredictionDistances.length > 0
            ? (
                resolvedPredictionDistances.reduce(
                    (total, distance) =>
                        total + distance,
                    0,
                ) /
                resolvedPredictionDistances.length
            ).toFixed(1)
            : '0.0'

    const unresolvedPredictions =
        predictionEligiblePicks.length -
        resolvedPredictionDistances.length

    const biggestHondaReaches =
        draftHistory
            .map((pick) => {
                const result =
                    getHondaDraftDelta(
                        pick.player,
                        pick.pick,
                    )

                if (
                    !result ||
                    result.delta >= -1
                ) {
                    return null
                }

                return {
                    player: pick.player,
                    manager: pick.manager,
                    pick: pick.pick,
                    hondaRank:
                        result.player.rank,
                    distance:
                        Math.abs(
                            Math.round(
                                result.delta,
                            ),
                        ),
                }
            })
            .filter(
                (
                    reach,
                ): reach is {
                    player: string
                    manager: string
                    pick: number
                    hondaRank: number
                    distance: number
                } => reach !== null,
            )
            .sort(
                (a, b) =>
                    b.distance - a.distance,
            )
            .slice(0, 5)

    const hondaEligiblePicks =
        draftHistory.filter(
            (pick) => pick.hondaPick !== null,
        )

    const hondaExactMatches =
        hondaEligiblePicks.filter(
            (pick) =>
                pick.hondaPick === pick.player,
        ).length

    const hondaMatchRate =
        hondaEligiblePicks.length > 0
            ? Math.round(
                (
                    hondaExactMatches /
                    hondaEligiblePicks.length
                ) * 100,
            )
            : 0

    const managerPredictionAccuracy =
        draftManagers.map((manager) => {
            const managerPicks =
                predictionEligiblePicks.filter(
                    (pick) =>
                        pick.manager === manager.name,
                )

            const exactMatches =
                managerPicks.filter(
                    (pick) =>
                        pick.predictedPick === pick.player,
                ).length
            const resolvedDistances =
                managerPicks
                    .map((pick) => {
                        if (pick.predictedPick === pick.player) {
                            return 0
                        }

                        const actualPredictedPlayerPick =
                            draftHistory.find(
                                (laterPick) =>
                                    laterPick.pick > pick.pick &&
                                    laterPick.player === pick.predictedPick,
                            )

                        if (!actualPredictedPlayerPick) {
                            return null
                        }

                        return (
                            actualPredictedPlayerPick.pick -
                            pick.pick
                        )
                    })
                    .filter(
                        (distance): distance is number =>
                            distance !== null,
                    )

            const averageDistance =
                resolvedDistances.length > 0
                    ? (
                        resolvedDistances.reduce(
                            (total, distance) =>
                                total + distance,
                            0,
                        ) /
                        resolvedDistances.length
                    ).toFixed(1)
                    : '—'


            const accuracy =
                managerPicks.length > 0
                    ? Math.round(
                        (
                            exactMatches /
                            managerPicks.length
                        ) * 100,
                    )
                    : 0

            return {
                manager: manager.name,
                eligiblePicks:
                    managerPicks.length,
                averageDistance,
                exactMatches,
                accuracy,
            }
        })

    const bestPredictedManagers =
        [...managerPredictionAccuracy]
            .filter(
                (manager) =>
                    manager.eligiblePicks > 0,
            )
            .sort(
                (a, b) =>
                    b.accuracy - a.accuracy,
            )

    const biggestPredictionMisses =
        predictionEligiblePicks
            .map((pick) => {
                if (
                    !pick.predictedPick ||
                    pick.predictedPick === pick.player
                ) {
                    return null
                }

                const actualPredictedPlayerPick =
                    draftHistory.find(
                        (laterPick) =>
                            laterPick.pick > pick.pick &&
                            laterPick.player === pick.predictedPick,
                    )

                if (!actualPredictedPlayerPick) {
                    return null
                }

                return {
                    manager: pick.manager,
                    pick: pick.pick,
                    actualPlayer: pick.player,
                    predictedPlayer: pick.predictedPick,
                    distance:
                        actualPredictedPlayerPick.pick -
                        pick.pick,
                }
            })
            .filter(
                (
                    miss,
                ): miss is {
                    manager: string
                    pick: number
                    actualPlayer: string
                    predictedPlayer: string
                    distance: number
                } => miss !== null,
            )
            .sort(
                (a, b) =>
                    b.distance - a.distance,
            )
            .slice(0, 5)

    const predictionConfidenceBuckets = [
        {
            label: 'High',
            min: 70,
            max: 100,
        },
        {
            label: 'Medium',
            min: 50,
            max: 69.999,
        },
        {
            label: 'Low',
            min: 0,
            max: 49.999,
        },
    ].map((bucket) => {
        const picks =
            predictionEligiblePicks.filter(
                (pick) =>
                    pick.predictionConfidence !== null &&
                    pick.predictionConfidence >= bucket.min &&
                    pick.predictionConfidence <= bucket.max,
            )

        const exactMatches =
            picks.filter(
                (pick) =>
                    pick.predictedPick === pick.player,
            ).length

        const accuracy =
            picks.length > 0
                ? Math.round(
                    (
                        exactMatches /
                        picks.length
                    ) * 100,
                )
                : 0

        return {
            label: bucket.label,
            picks: picks.length,
            exactMatches,
            accuracy,
        }
    })

    const activeBoardHistory =
        boardView === 'actual'
            ? draftHistory
            : boardView === 'predicted'
                ? predictedDraftHistory
                : hondaDraftHistory

    function getPickForManagerAndRound(
        managerName: string,
        round: number,
    ) {
        return activeBoardHistory.find((pick) => {
            const pickRound =
                Math.floor(
                    (pick.pick - 1) /
                    draftManagers.length,
                ) + 1

            return (
                pick.manager === managerName &&
                pickRound === round
            )
        })
    }

    function getPickLabel(pick: number) {
        const round =
            Math.floor(
                (pick - 1) /
                draftManagers.length,
            ) + 1

        const pickInRound =
            ((pick - 1) %
                draftManagers.length) + 1

        return `${round}.${String(
            pickInRound,
        ).padStart(2, '0')}`
    }

    return (
        <>
            <section className="panel">
                <div className="panel-header">
                    <div>
                        <p className="eyebrow">
                            Draft Results
                        </p>

                        <h3>
                            {boardView === 'actual'
                                ? 'Actual Draft Board'
                                : boardView === 'predicted'
                                    ? 'Predicted Draft Board'
                                    : 'Honda Draft Board'}
                        </h3>
                        <div className="draft-board-tabs">
                            <button
                                className={boardView === 'actual' ? 'active' : ''}
                                onClick={() => setBoardView('actual')}
                            >
                                Actual Draft
                            </button>

                            <button
                                className={boardView === 'predicted' ? 'active' : ''}
                                onClick={() => setBoardView('predicted')}
                            >
                                Predicted Draft
                            </button>

                            <button
                                className={boardView === 'honda' ? 'active' : ''}
                                onClick={() => setBoardView('honda')}
                            >
                                Honda Draft
                            </button>
                        </div>
                    </div>

                    <span>
                        {activeBoardHistory.length} picks
                    </span>
                </div>
                <div className="draft-results-summary">
                    <div className="draft-results-summary-card">
                        <span>Prediction Accuracy</span>

                        <strong>
                            {predictionAccuracy}%
                        </strong>

                        <small>
                            {predictionExactMatches} of{' '}
                            {predictionEligiblePicks.length} exact
                        </small>

                    </div>

                    <div className="draft-results-summary-card">
                        <span>Honda Match Rate</span>

                        <strong>
                            {hondaMatchRate}%
                        </strong>

                        <small>
                            {hondaExactMatches} of{' '}
                            {hondaEligiblePicks.length} exact
                        </small>
                    </div>
                    <div className="draft-results-summary-card">
                        <span>Within 3 Picks</span>

                        <strong>
                            {predictionWithinThreeRate}%
                        </strong>

                        <small>
                            {predictionWithinThree} of{' '}
                            {resolvedPredictionDistances.length} resolved
                            · {predictionWithinOne} within 1
                        </small>
                    </div>

                    <div className="draft-results-summary-card">
                        <span>Average Prediction Distance</span>

                        <strong>
                            {averagePredictionMiss}
                        </strong>

                        <small>
                            picks · {unresolvedPredictions} unresolved
                        </small>
                    </div>
                    <div className="draft-results-summary-card">
                        <span>Exact-Match Leader</span>

                        <strong>
                            {predictionAccuracy > hondaMatchRate
                                ? 'Prediction'
                                : hondaMatchRate > predictionAccuracy
                                    ? 'Honda'
                                    : 'Tie'}
                        </strong>

                        <small>
                            Based on real draft picks
                        </small>
                    </div>
                </div>

                <div className="prediction-confidence-panel">
                    <div className="prediction-confidence-header">
                        <span>Prediction Confidence</span>
                        <small>
                            Does higher confidence actually mean higher accuracy?
                        </small>
                    </div>

                    <div className="prediction-confidence-grid">
                        {predictionConfidenceBuckets.map((bucket) => (
                            <div
                                className="prediction-confidence-card"
                                key={bucket.label}
                            >
                                <span>{bucket.label} Confidence</span>

                                <strong>
                                    {bucket.accuracy}%
                                </strong>

                                <small>
                                    {bucket.exactMatches} of{' '}
                                    {bucket.picks} exact
                                </small>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="manager-accuracy-panel">
                    <div className="manager-accuracy-header">
                        <div>
                            <span>Manager Prediction Accuracy</span>

                            <small>
                                Exact player matches by manager
                            </small>
                        </div>
                    </div>

                    <div className="prediction-misses-panel">
                        <div className="prediction-misses-header">
                            <div>
                                <span>Biggest Prediction Misses</span>

                                <small>
                                    Resolved predictions with the largest pick gap
                                </small>
                            </div>
                        </div>


                        <div className="prediction-misses-grid">
                            {biggestPredictionMisses.map((miss) => (
                                <div
                                    className="prediction-miss-card"
                                    key={`${miss.manager}-${miss.pick}`}
                                >
                                    <strong>
                                        {miss.manager}
                                    </strong>

                                    <small>
                                        Pick {miss.pick}
                                    </small>

                                    <span>
                                        Predicted: {miss.predictedPlayer}
                                    </span>

                                    <span>
                                        Actual: {miss.actualPlayer}
                                    </span>

                                    <b>
                                        {miss.distance} picks apart
                                    </b>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="honda-reaches-panel">
                        <div className="honda-reaches-header">
                            <div>
                                <span>Biggest Honda Reaches</span>

                                <small>
                                    Actual picks made earliest versus Honda Rank
                                </small>
                            </div>
                        </div>

                        <div className="honda-reaches-grid">
                            {biggestHondaReaches.map((reach) => (
                                <div
                                    className="honda-reach-card"
                                    key={`${reach.manager}-${reach.pick}-${reach.player}`}
                                >
                                    <strong>
                                        {reach.player}
                                    </strong>

                                    <small>
                                        {reach.manager} · Pick {reach.pick}
                                    </small>

                                    <span>
                                        Honda Rank #{reach.hondaRank}
                                    </span>

                                    <b>
                                        {reach.distance} picks early
                                    </b>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="manager-accuracy-grid">
                        {bestPredictedManagers.map((manager) => (
                            <div
                                className="manager-accuracy-card"
                                key={manager.manager}
                            >
                                <strong>
                                    {manager.manager}
                                </strong>

                                <span>
                                    {manager.accuracy}%
                                </span>

                                <small>
                                    {manager.exactMatches} of{' '}
                                    {manager.eligiblePicks} exact
                                </small>

                                <small>
                                    Avg distance: {manager.averageDistance} picks
                                </small>

                            </div>
                        ))}
                    </div>
                </div>
                {activeBoardHistory.length === 0 ? (
                    <p className="empty-state">
                        No picks have been made yet.
                    </p>
                ) : (
                    <div className="draft-board-scroll">
                        <div className="draft-board-grid">
                            <div className="draft-board-corner">
                                Round
                            </div>

                            {draftManagers.map(
                                (manager) => (
                                    <div
                                        className="draft-board-manager"
                                        key={manager.name}
                                    >
                                        <strong>
                                            {manager.name}
                                        </strong>

                                        <span>
                                            #{manager.id}
                                        </span>
                                    </div>
                                ),
                            )}

                            {Array.from(
                                { length: totalRounds },
                                (_, index) => index + 1,
                            ).map((round) => (
                                <div
                                    className="draft-board-round"
                                    key={`round-${round}`}
                                >
                                    <div className="draft-board-round-label">
                                        {round}
                                    </div>

                                    {draftManagers.map(
                                        (manager) => {
                                            const pick =
                                                getPickForManagerAndRound(
                                                    manager.name,
                                                    round,
                                                )

                                            return (
                                                <div
                                                    className={
                                                        pick
                                                            ? 'draft-board-cell filled'
                                                            : 'draft-board-cell'
                                                    }
                                                    key={`${round}-${manager.name}`}
                                                >
                                                    {pick ? (
                                                        <>
                                                            <small>
                                                                {getPickLabel(
                                                                    pick.pick,
                                                                )}
                                                            </small>

                                                            <strong>
                                                                {pick.player}
                                                            </strong>
                                                        </>
                                                    ) : (
                                                        <span>—</span>
                                                    )}
                                                </div>
                                            )
                                        },
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </section>

            {draftHistory.length > 0 && (
                <section className="panel">
                    <div className="panel-header">
                        <div>
                            <p className="eyebrow">
                                Pick Log
                            </p>

                            <h3>
                                Chronological Results
                            </h3>
                        </div>
                    </div>

                    <div className="draft-results-list">
                        {draftHistory.map((pick) => (
                            <div
                                className="draft-results-row"
                                key={pick.pick}
                            >
                                <strong>
                                    {getPickLabel(pick.pick)}
                                </strong>

                                <span>
                                    {pick.manager}
                                </span>

                                <span>
                                    Actual: {pick.player}
                                </span>

                                <span>
                                    Predicted:{' '}
                                    {pick.predictedPick ?? '—'}
                                </span>

                                <span>
                                    Honda:{' '}
                                    {pick.hondaPick ?? '—'}
                                </span>
                            </div>
                        ))}
                    </div>
                </section>
            )}
        </>
    )
}