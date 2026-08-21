import { useState } from 'react'
import { draftManagers } from '../data/managers'

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