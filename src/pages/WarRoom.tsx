import { players } from '../data/players'
import { draftManagers } from '../data/managers'
import { getHondaDecision } from '../utils/hondaDecisionEngine'
import { getHondaRankings } from '../utils/hondaRankings'
import { useState } from 'react'
import { getManagerNeeds } from '../utils/managerNeeds'
import { getManagerPrediction } from '../utils/managerPrediction'
import { getLiveDraftIntel } from '../utils/liveDraftIntel'
import { getHondaExplanation } from '../utils/hondaExplanation'
import type { DraftStoryEvent } from '../utils/draftStory'
import { getHondaConfidence } from '../utils/hondaConfidence'
import { getHondaForecast } from '../utils/hondaForecast'
import {
    getDraftRound,
    getPickInRound,
    getSnakeManagerAtPick,
    getUpcomingSnakePicks,
} from '../utils/snakeDraftOrder'
import {
    getManagerHistoricalProfile,
} from '../utils/managerHistoricalProfile'

import {
    buildManagerHistoricalTendencies,
} from '../utils/managerHistoricalTendencies'
import {
    getManagerRoundTendency,
} from '../utils/managerRoundTendencies'
import {
    getHondaManagerName,
    isHondaManager,
} from '../utils/hondaManager'

type WarRoomProps = {
    currentPickIndex: number
    draftHistory: {
        player: string
        manager: string
        pick: number
    }[]
    draftedPlayerNames: string[]
    onDraftPlayer: (playerName: string) => void
    onSimulateNextPick: () => void
    managerRosters: Record<string, string[]>
    draftStory: DraftStoryEvent[]
}


function ChecklistItem({ text }: { text: string }) {
    return (
        <label className="checklist-item">
            <input type="checkbox" />
            <span>{text}</span>
        </label>
    )
}

export default function WarRoom({
    currentPickIndex,
    draftHistory,
    draftedPlayerNames,
    onDraftPlayer,
    onSimulateNextPick,
    managerRosters,
    draftStory,
}: WarRoomProps) {


    const myRosterNames =
        managerRosters[
        getHondaManagerName() ?? ''
        ] ?? []

    const liveRosterCounts = {
        QB: 0,
        RB: 0,
        WR: 0,
        TE: 0,
    }

    for (const playerName of myRosterNames) {
        const player = players.find(
            (item) => item.name === playerName,
        )

        if (
            player?.position === 'QB' ||
            player?.position === 'RB' ||
            player?.position === 'WR' ||
            player?.position === 'TE'
        ) {
            liveRosterCounts[player.position] += 1
        }


    }


    const decision = getHondaDecision(
        draftedPlayerNames,
        currentPickIndex,
        liveRosterCounts,
    )

    const recommendation = decision?.player

    const decisionScore = decision?.decisionScore ?? 0
    const seasonProjectedPoints =
        recommendation?.hondaProjectedPoints ??
        recommendation?.projectedPoints ??
        0

    const projectedPointsPerGame =
        seasonProjectedPoints / 17
    const adpBonus = decision?.adpBonus ?? 0
    const replacementPoints =
        recommendation?.replacementPoints ?? 0

    const valueOverReplacement =
        recommendation?.valueOverReplacement ?? 0

    const hondaRank =
        recommendation?.hondaDraftRank ??
        recommendation?.rank ??
        0

    const overallRank =
        recommendation?.fantasyProsRank ??
        recommendation?.publicAdpOverall ??
        0


    const riskBonus = decision?.riskBonus ?? 0
    const hondaEdge = decision?.hondaEdge ?? 0

    const positionalScarcity =
        decision?.positionalScarcity ?? 'Low'

    const hondaForecast = getHondaForecast({
        currentPickIndex,
        managerRosters,
        draftedPlayerNames,
        currentDecisionScore: decisionScore,
        liveRosterCounts,
    })

    const survivalChance =
        hondaForecast?.survivalPercent ?? 0

    const managerSnipeRisk =
        decision?.managerSnipeRisk ?? 'Low'

    const allLiveRankings =
        getHondaRankings(
            draftedPlayerNames,
            liveRosterCounts,
            currentPickIndex,
        )

    const liveRankings =
        allLiveRankings.slice(0, 5)

    const alternatives =
        allLiveRankings
            .filter(
                (entry) =>
                    entry.player.name !==
                    recommendation?.name,
            )
            .slice(0, 4)
            .map(
                (entry) =>
                    entry.player,
            )
    const currentManager =
        getSnakeManagerAtPick(
            draftManagers,
            currentPickIndex,
        ) ?? draftManagers[0]

    const rosterFit =
        decision?.rosterFit ?? 0

    const liveRosterNeed =
        decision?.liveRosterNeed ?? 0

    const roundNumber =
        getDraftRound(
            currentPickIndex,
            draftManagers.length,
        )

    const pickInRound =
        getPickInRound(
            currentPickIndex,
            draftManagers.length,
        )

    const [selectedPlayerName, setSelectedPlayerName] = useState<string | null>(
        null,
    )
    const selectedPlayer = players.find(
        (player) => player.name === selectedPlayerName,
    )
    const [selectedManagerName, setSelectedManagerName] = useState<string | null>(
        null,
    )
    const selectedManager = draftManagers.find(
        (manager) => manager.name === selectedManagerName,
    )

    const selectedManagerHistoricalProfile =
        selectedManager
            ? getManagerHistoricalProfile(
                selectedManager.name,
            )
            : null

    const selectedManagerHistoricalTendencies =
        selectedManager
            ? buildManagerHistoricalTendencies(
                selectedManager.name,
            )
            : null

    const managerNeeds = selectedManager
        ? getManagerNeeds(
            managerRosters[selectedManager.name] ?? [],
        )
        : []


    const selectedManagerUpcomingPick =
        selectedManager
            ? getUpcomingSnakePicks(
                draftManagers,
                currentPickIndex,
                draftManagers.length * 2,
            ).find(
                (upcoming) =>
                    upcoming.manager.name ===
                    selectedManager.name,
            )
            : undefined

    const selectedManagerRoundTendency =
        selectedManager &&
            selectedManagerUpcomingPick
            ? getManagerRoundTendency(
                selectedManager.name,
                selectedManagerUpcomingPick.round,
            )
            : undefined

    const managerPrediction =
        selectedManager
            ? getManagerPrediction(
                selectedManager,
                managerRosters[
                selectedManager.name
                ] ?? [],
                draftedPlayerNames,
                {
                    round:
                        selectedManagerUpcomingPick
                            ?.round ??
                        roundNumber,

                    pickInRound:
                        selectedManagerUpcomingPick
                            ?.pickInRound ??
                        pickInRound,

                    overallPick:
                        selectedManagerUpcomingPick
                            ?.overallPick ??
                        currentPickIndex +
                        1,
                },
            )
            : null

    const liveDraftIntel = getLiveDraftIntel(
        currentPickIndex,
        managerRosters,
        draftedPlayerNames,
    )



    const hondaExplanation = getHondaExplanation({
        action: recommendation?.action ?? 'WAIT',
        survivalChance,
        managerSnipeRisk,
        managerThreatScore:
            decision?.managerThreatScore ?? 0,

        managerThreatBonus:
            decision?.managerThreatBonus ?? 0,
        positionalScarcity,
        rosterFit,
        hondaEdge,
        recommendedPlayer: recommendation?.name ?? 'Recommended player',
        liveThreats: liveDraftIntel,
    })
    const hondaConfidence = getHondaConfidence({
        hondaEdge,
        rosterFit,
        survivalChance,
        managerSnipeRisk,
        positionalScarcity,
    })

    const heroGrade =
        hondaConfidence.score >= 93
            ? 'A+'
            : hondaConfidence.score >= 88
                ? 'A'
                : hondaConfidence.score >= 82
                    ? 'A-'
                    : hondaConfidence.score >= 76
                        ? 'B+'
                        : 'B'

    const rosterTargets = {
        QB: 2,
        RB: 5,
        WR: 6,
        TE: 2,
    } as const

    const positionNeeds = (
        ['RB', 'WR', 'QB', 'TE'] as const
    ).map((position) => {
        const remaining =
            Math.max(
                0,
                rosterTargets[position] -
                liveRosterCounts[position],
            )

        let level:
            | 'Critical'
            | 'High'
            | 'Medium'
            | 'Low'

        if (remaining >= 4) {
            level = 'Critical'
        } else if (remaining === 3) {
            level = 'High'
        } else if (remaining === 2) {
            level = 'Medium'
        } else {
            level = 'Low'
        }

        return {
            position,
            remaining,
            level,
        }
    })

    const mostAtRiskPlayer =
        hondaForecast.picks.find(
            (pick) =>
                pick.player !== recommendation?.name &&
                pick.player !==
                hondaForecast.futureRecommendation?.name,
        ) ?? null
    const selectedManagerRoster =
        selectedManager
            ? managerRosters[selectedManager.name] ?? []
            : []

    const selectedManagerRosterCounts = {
        QB: 0,
        RB: 0,
        WR: 0,
        TE: 0,
    }

    for (
        const playerName of
        selectedManagerRoster
    ) {
        const rosterPlayer =
            players.find(
                (player) =>
                    player.name === playerName,
            )

        if (
            rosterPlayer?.position === 'QB' ||
            rosterPlayer?.position === 'RB' ||
            rosterPlayer?.position === 'WR' ||
            rosterPlayer?.position === 'TE'
        ) {
            selectedManagerRosterCounts[
                rosterPlayer.position
            ] += 1
        }
    }
    return (



        <div className="war-room">
            <section className="war-decision war-decision-hero">

                <div className="hero-player">

                    <p className="eyebrow light">
                        On the Clock
                    </p>

                    <h2>{recommendation?.name}</h2>

                    <div className="hero-player-meta">
                        <strong>
                            {recommendation?.position} · {recommendation?.team}
                        </strong>

                        <span>
                            {recommendation?.tier}
                        </span>
                    </div>

                    <div className="hero-pick-meta">
                        <strong>
                            Pick {roundNumber}.
                            {String(pickInRound).padStart(2, '0')}
                            {' · '}
                            Round {roundNumber}
                        </strong>
                    </div>

                    <div className="hero-ranks">
                        <span>
                            Overall Rank: #{overallRank}
                        </span>

                        <span>
                            Honda Rank: #{hondaRank}
                        </span>

                        <span>
                            Projection: {seasonProjectedPoints.toFixed(1)} pts
                        </span>
                    </div>

                </div>


                <div className="hero-metrics">

                    <div className="hero-metric">
                        <span>Projected Points</span>

                        <strong>
                            {seasonProjectedPoints.toFixed(1)}
                        </strong>

                        <small>pts</small>
                    </div>


                    <div className="hero-metric">
                        <span>Vs Replacement</span>

                        <strong className="positive-value">
                            {valueOverReplacement >= 0 ? '+' : ''}
                            {valueOverReplacement.toFixed(1)}
                        </strong>

                        <small>
                            Replacement: {replacementPoints.toFixed(1)}
                        </small>
                    </div>


                    <div className="hero-metric">
                        <span>Honda Edge</span>

                        <strong className={
                            hondaEdge >= 0
                                ? 'positive-value'
                                : ''
                        }>
                            {hondaEdge >= 0 ? '+' : ''}
                            {hondaEdge.toFixed(1)}
                        </strong>

                        <small>
                            Honda vs market
                        </small>
                    </div>


                    <div className="hero-grade">

                        <span>Grade</span>

                        <div className="hero-grade-ring">
                            {heroGrade}
                        </div>

                    </div>

                </div>


                <div className="hero-forecast">

                    <p className="eyebrow light">
                        Honda Forecast
                    </p>

                    <div className="hero-forecast-row">
                        <span>Draft Command</span>

                        <strong>
                            {hondaForecast.advice}
                        </strong>
                    </div>

                    <div className="hero-forecast-row">
                        <span>Chance Gone</span>

                        <strong>
                            {(100 - hondaForecast.survivalPercent).toFixed(0)}%
                        </strong>
                    </div>

                    <div className="hero-forecast-row">
                        <span>Next Honda Pick</span>

                        <strong>
                            {hondaForecast.picksUntilNextHondaPick} picks
                        </strong>
                    </div>

                    <div className="hero-forecast-divider" />

                    <small>
                        {recommendation?.name} has a{' '}
                        {(100 - hondaForecast.survivalPercent).toFixed(0)}% chance
                        of being gone before your next selection.
                    </small>

                </div>

            </section>

            <section className="panel live-intel-panel">
                <div className="live-intel-header">
                    <div>
                        <p className="eyebrow">
                            Live Draft Intelligence
                        </p>

                        <h3>Immediate Threats</h3>
                    </div>

                    <span>
                        {liveDraftIntel.length} Alerts
                    </span>
                </div>
                <section className="panel forecast-panel">
                    <div className="forecast-header">
                        <div>
                            <p className="eyebrow">
                                Honda Forecast
                            </p>

                            <h3>Immediate Targets</h3>
                        </div>

                        <span className="forecast-next-pick">
                            {hondaForecast.picksUntilNextHondaPick} picks until next turn
                        </span>
                    </div>

                    <div className="immediate-target-grid">

                        <div className="immediate-target-card">

                            <span className="target-card-label">
                                If You Wait
                            </span>

                            <strong>
                                {hondaForecast.futureRecommendation?.name ??
                                    'No safe fallback'}
                            </strong>

                            <small>
                                {hondaForecast.futureRecommendation?.position ??
                                    '—'}
                                {' · '}
                                {hondaForecast.futureSurvivalPercent.toFixed(0)}% survival
                            </small>

                            <div className="target-card-value">
                                Honda {hondaForecast.projectedScore.toFixed(1)}
                            </div>

                        </div>


                        <div className="immediate-target-card">

                            <span className="target-card-label">
                                Most At Risk
                            </span>

                            <strong>
                                {mostAtRiskPlayer?.player ??
                                    'No major threat'}
                            </strong>

                            <small>
                                {mostAtRiskPlayer
                                    ? `${mostAtRiskPlayer.position} · ${mostAtRiskPlayer.confidence}% chance gone`
                                    : 'No major threat detected'}
                            </small>

                            <div className="target-card-value danger-value">
                                {mostAtRiskPlayer
                                    ? `${mostAtRiskPlayer.confidence}% at risk`
                                    : '—'}
                            </div>

                        </div>


                        <div className="immediate-target-card">

                            <span className="target-card-label">
                                Current Target
                            </span>

                            <strong>
                                {recommendation?.name}
                            </strong>

                            <small>
                                {recommendation?.position}
                                {' · '}
                                {hondaForecast.survivalPercent.toFixed(0)}% survival
                            </small>

                            <div className="target-card-value">
                                Honda {decisionScore.toFixed(1)}
                            </div>

                        </div>

                    </div>


                    <div className="position-needs-section">

                        <span className="target-card-label">
                            Position Needs
                        </span>

                        <div className="position-needs-grid">

                            {positionNeeds.map((need) => (
                                <div
                                    className="position-need-card"
                                    key={need.position}
                                >
                                    <strong>
                                        {need.position}
                                    </strong>

                                    <span
                                        className={`position-need-level need-${need.level.toLowerCase()}`}
                                    >
                                        {need.level}
                                    </span>

                                    <small>
                                        Need {need.remaining} more
                                    </small>
                                </div>
                            ))}

                        </div>

                    </div>


                    <div className="forecast-risk-strip">

                        {hondaForecast.picks.map((pick) => (
                            <div
                                className="forecast-risk-player"
                                key={pick.player}
                            >
                                <div>
                                    <span>{pick.manager}</span>

                                    <strong>
                                        {pick.player}
                                    </strong>
                                </div>

                                <div>
                                    <strong>
                                        {pick.confidence}%
                                    </strong>

                                    <small>
                                        chance gone
                                    </small>
                                </div>
                            </div>
                        ))}

                    </div>
                    {hondaForecast.futureRecommendation && (
                        <div className="forecast-result">
                            <div className={`forecast-advice advice-${hondaForecast.advice
                                .toLowerCase()
                                .replaceAll(' ', '-')}`}
                            >
                                {hondaForecast.advice}
                            </div>

                            <p className="forecast-advice-reason">
                                {hondaForecast.adviceReason}
                            </p>


                            <div className="forecast-comparison">

                                <div className="forecast-side">

                                    <span>Take Now</span>

                                    <strong>
                                        {recommendation?.name}
                                    </strong>

                                    <small>
                                        Honda {decisionScore.toFixed(1)}
                                    </small>

                                    <small>
                                        {hondaForecast.currentSeasonProjection.toFixed(1)} pts
                                        {' · '}
                                        {hondaForecast.currentPointsPerGame.toFixed(1)} / game
                                    </small>

                                </div>

                                <div className="forecast-side">

                                    <span>If You Wait</span>

                                    <strong>
                                        {hondaForecast.futureRecommendation?.name}
                                    </strong>

                                    <small>
                                        Honda {hondaForecast.projectedScore.toFixed(1)}
                                    </small>

                                    <small>
                                        {hondaForecast.futureSeasonProjection.toFixed(1)} pts
                                        {' · '}
                                        {hondaForecast.futurePointsPerGame.toFixed(1)} / game
                                    </small>

                                </div>

                            </div>

                            <div className="forecast-cost">
                                Picks Until Next Turn

                                <strong>
                                    {hondaForecast.picksUntilNextHondaPick}
                                </strong>
                            </div>

                            <div className="forecast-cost">
                                Current Player Survival

                                <strong>
                                    {hondaForecast.survivalPercent.toFixed(1)}%
                                </strong>
                            </div>

                            <div className="forecast-cost">
                                If-You-Wait Survival

                                <strong>
                                    {hondaForecast.futureSurvivalPercent.toFixed(1)}%
                                </strong>
                            </div>

                            <div className="forecast-cost">
                                Honda Value Lost If You Wait

                                <strong>
                                    {hondaForecast.costOfWaiting > 0
                                        ? `${hondaForecast.costOfWaiting.toFixed(1)} pts`
                                        : hondaForecast.costOfWaiting < 0
                                            ? `Gain ${Math.abs(hondaForecast.costOfWaiting).toFixed(1)} pts`
                                            : '0.0 pts'}
                                </strong>
                            </div>
                            <div className="forecast-cost">
                                Projected Points Lost If You Wait

                                <strong>
                                    {hondaForecast.projectedPointsLost > 0
                                        ? `${hondaForecast.projectedPointsLost.toFixed(1)} pts`
                                        : hondaForecast.projectedPointsLost < 0
                                            ? `Gain ${Math.abs(hondaForecast.projectedPointsLost).toFixed(1)} pts`
                                            : '0.0 pts'}
                                </strong>
                            </div>
                        </div>
                    )}
                </section>
                <div className="manager-watch">

                    <div className="manager-watch-header">
                        <div>
                            <span className="target-card-label">
                                Manager Watch
                            </span>

                            <strong>
                                Next Draft Threats
                            </strong>
                        </div>

                        <small>
                            {liveDraftIntel.length} managers tracked
                        </small>
                    </div>


                    <div className="manager-watch-grid">

                        {liveDraftIntel
                            .slice(0, 4)
                            .map((alert) => (

                                <button
                                    className="manager-watch-card"
                                    key={alert.manager}
                                    onClick={() => {
                                        setSelectedManagerName(
                                            alert.manager,
                                        )
                                        setSelectedPlayerName(null)
                                    }}
                                >

                                    <div className="manager-watch-manager">

                                        <strong>
                                            {alert.manager}
                                        </strong>

                                        <small>
                                            Likely {alert.position}
                                        </small>

                                    </div>


                                    <div className="manager-watch-target">

                                        <span>
                                            Top Target
                                        </span>

                                        <strong>
                                            {alert.player}
                                        </strong>

                                        <small>
                                            Pick {alert.round}.
                                            {String(
                                                alert.pickInRound,
                                            ).padStart(
                                                2,
                                                '0',
                                            )}
                                        </small>

                                    </div>


                                    <div className="manager-watch-confidence">

                                        <strong>
                                            {alert.confidence}%
                                        </strong>

                                        <small>
                                            confidence
                                        </small>

                                        <small>
                                            {alert.reasons[0] ??
                                                'Historical fit'}
                                        </small>

                                    </div>

                                </button>

                            ))}

                    </div>

                </div>
            </section>

            <div className="war-dashboard-grid">
                <section className="panel decision-engine-panel">

                    <div className="decision-engine-header">
                        <div>
                            <p className="eyebrow">
                                Honda Intelligence
                            </p>

                            <h3>Decision Engine</h3>
                        </div>
                    </div>

                    <div className="decision-score-strip">

                        <div className="decision-score-card">
                            <span>Projected Points</span>

                            <strong>
                                {seasonProjectedPoints.toFixed(1)}
                            </strong>

                            <small>
                                {projectedPointsPerGame.toFixed(1)} / game
                            </small>
                        </div>


                        <div className="decision-score-card">
                            <span>Vs Replacement</span>

                            <strong className="positive-value">
                                {valueOverReplacement >= 0 ? '+' : ''}
                                {valueOverReplacement.toFixed(1)}
                            </strong>

                            <small>
                                Season value
                            </small>
                        </div>


                        <div className="decision-score-card">
                            <span>Honda Edge</span>

                            <strong>
                                {hondaEdge >= 0 ? '+' : ''}
                                {hondaEdge.toFixed(1)}
                            </strong>

                            <small>
                                Vs market
                            </small>
                        </div>


                        <div className="decision-score-card">
                            <span>ADP Bonus</span>

                            <strong>
                                {adpBonus >= 0 ? '+' : ''}
                                {adpBonus.toFixed(1)}
                            </strong>

                            <small>
                                Draft value
                            </small>
                        </div>


                        <div className="decision-score-card">
                            <span>Roster Need</span>

                            <strong>
                                {liveRosterNeed >= 0 ? '+' : ''}
                                {liveRosterNeed.toFixed(1)}
                            </strong>

                            <small>
                                {recommendation?.position} need
                            </small>
                        </div>


                        <div className="decision-score-card">
                            <span>Risk Bonus</span>

                            <strong>
                                {riskBonus >= 0 ? '+' : ''}
                                {riskBonus.toFixed(1)}
                            </strong>

                            <small>
                                Player risk
                            </small>
                        </div>


                        <div className="decision-score-card decision-total-card">
                            <span>Total Score</span>

                            <strong>
                                {decisionScore.toFixed(1)}
                            </strong>

                            <small>
                                Honda score
                            </small>
                        </div>

                    </div>

                </section>


                <section className="panel">
                    <p className="eyebrow">Honda Live Rankings</p>
                    <h3>Top Available Players</h3>

                    <div className="live-rankings-list">

                        {liveRankings.map((entry, index) => {
                            const player = entry.player

                            const projectedPoints =
                                player.hondaProjectedPoints ??
                                player.projectedPoints ??
                                0

                            const vor =
                                player.valueOverReplacement ??
                                0

                            const hondaRank =
                                player.hondaDraftRank ??
                                player.rank

                            return (
                                <button
                                    className="live-ranking-row live-ranking-button"
                                    key={player.name}
                                    onClick={() => {
                                        setSelectedPlayerName(
                                            player.name,
                                        )
                                        setSelectedManagerName(null)
                                    }}
                                >

                                    <span className="live-ranking-number">
                                        #{index + 1}
                                    </span>


                                    <div className="live-ranking-player">

                                        <strong>
                                            {player.name}
                                        </strong>

                                        <small>
                                            {player.position}
                                            {' · '}
                                            {player.team}
                                            {' · '}
                                            Honda #{hondaRank}
                                        </small>

                                    </div>


                                    <div className="live-ranking-stat">

                                        <span>Proj</span>

                                        <strong>
                                            {projectedPoints.toFixed(1)}
                                        </strong>

                                    </div>


                                    <div className="live-ranking-stat">

                                        <span>VOR</span>

                                        <strong className={
                                            vor >= 0
                                                ? 'positive-value'
                                                : ''
                                        }>
                                            {vor >= 0 ? '+' : ''}
                                            {vor.toFixed(1)}
                                        </strong>

                                    </div>


                                    <div className="live-ranking-stat live-ranking-score">

                                        <span>Honda</span>

                                        <strong>
                                            {entry.score.toFixed(1)}
                                        </strong>

                                    </div>

                                </button>
                            )
                        })}

                    </div>
                </section>
                {selectedPlayer && (() => {
                    const selectedProjection =
                        selectedPlayer.hondaProjectedPoints ??
                        selectedPlayer.projectedPoints ??
                        0

                    const selectedPerGame =
                        selectedProjection / 17

                    const selectedVor =
                        selectedPlayer.valueOverReplacement ??
                        0

                    const selectedReplacement =
                        selectedPlayer.replacementPoints ??
                        0

                    const selectedHondaRank =
                        selectedPlayer.hondaDraftRank ??
                        selectedPlayer.rank

                    const selectedMarketRank =
                        selectedPlayer.fantasyProsRank ??
                        selectedPlayer.publicAdpOverall ??
                        0

                    const selectedRanking =
                        allLiveRankings.find(
                            (entry) =>
                                entry.player.name ===
                                selectedPlayer.name,
                        )

                    return (
                        <aside className="player-detail-panel">

                            <div className="player-detail-header">

                                <div>
                                    <p className="eyebrow">
                                        Player Profile
                                    </p>

                                    <h3>
                                        {selectedPlayer.name}
                                    </h3>

                                    <span>
                                        {selectedPlayer.position}
                                        {' · '}
                                        {selectedPlayer.team}
                                        {' · '}
                                        {selectedPlayer.tier}
                                    </span>
                                </div>


                                <button
                                    className="player-detail-close"
                                    onClick={() =>
                                        setSelectedPlayerName(null)
                                    }
                                >
                                    ×
                                </button>

                            </div>


                            <div className="player-profile-command">

                                <div>
                                    <span>Honda Rank</span>

                                    <strong>
                                        #{selectedHondaRank}
                                    </strong>
                                </div>

                                <div>
                                    <span>Market Rank</span>

                                    <strong>
                                        #{selectedMarketRank}
                                    </strong>
                                </div>

                                <div>
                                    <span>Live Honda Score</span>

                                    <strong>
                                        {selectedRanking
                                            ? selectedRanking.score.toFixed(1)
                                            : '—'}
                                    </strong>
                                </div>

                            </div>


                            <div className="player-detail-stats">

                                <div>
                                    <span>
                                        Season Projection
                                    </span>

                                    <strong>
                                        {selectedProjection.toFixed(1)}
                                    </strong>

                                    <small>pts</small>
                                </div>


                                <div>
                                    <span>
                                        Per Game
                                    </span>

                                    <strong>
                                        {selectedPerGame.toFixed(1)}
                                    </strong>

                                    <small>pts/game</small>
                                </div>


                                <div>
                                    <span>
                                        Vs Replacement
                                    </span>

                                    <strong className={
                                        selectedVor >= 0
                                            ? 'positive-value'
                                            : ''
                                    }>
                                        {selectedVor >= 0 ? '+' : ''}
                                        {selectedVor.toFixed(1)}
                                    </strong>

                                    <small>
                                        Replacement {selectedReplacement.toFixed(1)}
                                    </small>
                                </div>


                                <div>
                                    <span>
                                        Risk
                                    </span>

                                    <strong>
                                        {selectedPlayer.risk}
                                    </strong>
                                </div>

                            </div>


                            <div className="player-detail-section">

                                <span>
                                    Honda X-Factor
                                </span>

                                <p>
                                    {selectedPlayer.xFactor}
                                </p>

                            </div>
                            {selectedPlayer.greenFlags.length > 0 && (
                                <div className="player-detail-section">

                                    <span>
                                        Green Flags
                                    </span>

                                    <div className="player-flag-list">

                                        {selectedPlayer.greenFlags
                                            .slice(0, 4)
                                            .map((flag) => (
                                                <div
                                                    className="player-flag positive-flag"
                                                    key={flag}
                                                >
                                                    ✓ {flag}
                                                </div>
                                            ))}

                                    </div>

                                </div>
                            )}


                            {selectedPlayer.redFlags.length > 0 && (
                                <div className="player-detail-section">

                                    <span>
                                        Risk Flags
                                    </span>

                                    <div className="player-flag-list">

                                        {selectedPlayer.redFlags
                                            .slice(0, 4)
                                            .map((flag) => (
                                                <div
                                                    className="player-flag negative-flag"
                                                    key={flag}
                                                >
                                                    • {flag}
                                                </div>
                                            ))}

                                    </div>

                                </div>
                            )}


                            <button
                                className="draft-button primary-action player-detail-draft"
                                onClick={() => {
                                    onDraftPlayer(
                                        selectedPlayer.name,
                                    )

                                    setSelectedPlayerName(null)
                                }}
                            >
                                Draft {selectedPlayer.name}
                            </button>

                        </aside>
                    )
                })()}
            </div>

            <div className="war-dashboard-grid">

                <section className="panel why-pick-panel">

                    <div className="why-pick-header">
                        <div>
                            <p className="eyebrow">
                                Decision Factors
                            </p>

                            <h3>Why This Pick</h3>
                        </div>

                        <div className="why-confidence">
                            <span>Confidence</span>

                            <strong>
                                {hondaConfidence.score}%
                            </strong>
                        </div>
                    </div>


                    <div className="why-pick-summary">

                        <strong>
                            {hondaExplanation.title}
                        </strong>

                        <div className="why-pick-bullets">

                            {hondaExplanation.bullets
                                .slice(0, 5)
                                .map((bullet) => (
                                    <div
                                        className="why-pick-bullet"
                                        key={bullet}
                                    >
                                        <span>✓</span>

                                        <p>
                                            {bullet}
                                        </p>
                                    </div>
                                ))}

                        </div>

                    </div>


                    <div className="why-factor-list">

                        <div className="why-factor-row">
                            <span>Honda value edge</span>

                            <strong>
                                {hondaEdge >= 0 ? '+' : ''}
                                {hondaEdge.toFixed(1)}
                            </strong>
                        </div>

                        <div className="why-factor-row">
                            <span>Vs replacement</span>

                            <strong className="positive-value">
                                {valueOverReplacement >= 0 ? '+' : ''}
                                {valueOverReplacement.toFixed(1)}
                            </strong>
                        </div>

                        <div className="why-factor-row">
                            <span>Survival to next pick</span>

                            <strong>
                                {hondaForecast.survivalPercent.toFixed(1)}%
                            </strong>
                        </div>

                        <div className="why-factor-row">
                            <span>Roster fit</span>

                            <strong>
                                {rosterFit >= 0 ? '+' : ''}
                                {rosterFit.toFixed(1)}
                            </strong>
                        </div>

                        <div className="why-factor-row">
                            <span>Manager snipe risk</span>

                            <strong>
                                {managerSnipeRisk}
                            </strong>
                        </div>

                    </div>

                </section>


                <section className="panel alternatives-panel">

                    <div className="alternatives-header">
                        <div>
                            <p className="eyebrow">
                                Threat Analysis
                            </p>

                            <h3>Best Alternatives</h3>
                        </div>
                    </div>


                    <div className="alternative-list">

                        {alternatives.map((player) => {

                            const rankingEntry =
                                allLiveRankings.find(
                                    (entry) =>
                                        entry.player.name ===
                                        player.name,
                                )

                            const alternativeScore =
                                rankingEntry?.score ?? 0

                            const scoreGap =
                                decisionScore -
                                alternativeScore

                            return (
                                <button
                                    className="alternative-row alternative-button"
                                    key={player.name}
                                    onClick={() => {
                                        setSelectedPlayerName(
                                            player.name,
                                        )
                                        setSelectedManagerName(null)
                                    }}
                                >
                                    <div className="alternative-player-main">

                                        <strong>
                                            {player.name}
                                        </strong>

                                        <span>
                                            {player.position}
                                            {' · '}
                                            {player.team}
                                            {' · '}
                                            {player.tier}
                                        </span>

                                    </div>


                                    <div className="alternative-stat">

                                        <span>Proj</span>

                                        <strong>
                                            {(
                                                player.hondaProjectedPoints ??
                                                player.projectedPoints ??
                                                0
                                            ).toFixed(1)}
                                        </strong>

                                    </div>


                                    <div className="alternative-stat">

                                        <span>VOR</span>

                                        <strong className={
                                            (player.valueOverReplacement ?? 0) >= 0
                                                ? 'positive-value'
                                                : ''
                                        }>
                                            {(player.valueOverReplacement ?? 0) >= 0
                                                ? '+'
                                                : ''}
                                            {(player.valueOverReplacement ?? 0).toFixed(1)}
                                        </strong>

                                    </div>


                                    <div className="alternative-stat">

                                        <span>Honda</span>

                                        <strong>
                                            {alternativeScore.toFixed(1)}
                                        </strong>

                                    </div>


                                    <div className="alternative-gap">

                                        <strong>
                                            -{Math.max(
                                                0,
                                                scoreGap,
                                            ).toFixed(1)}
                                        </strong>

                                        <small>
                                            behind
                                        </small>

                                    </div>

                                </button>
                            )
                        })}

                    </div>

                </section>

            </div>

            <div className="war-dashboard-grid lower-war-grid">

                <section className="panel">

                    <div className="compact-panel-header">
                        <div>
                            <p className="eyebrow">
                                Draft Order
                            </p>

                            <h3>Honda Managers</h3>
                        </div>

                        <span className="compact-panel-meta">
                            {currentManager.name} on clock
                        </span>
                    </div>


                    <div className="draft-order-list compact-draft-order">

                        {draftManagers.map((manager) => {

                            const roster =
                                managerRosters[manager.name] ?? []

                            const isCurrentManager =
                                manager.id === currentManager.id

                            const isHonda =
                                isHondaManager(
                                    manager.name,
                                )

                            return (
                                <button
                                    className={
                                        isCurrentManager
                                            ? 'draft-order-row current-manager manager-detail-button'
                                            : 'draft-order-row manager-detail-button'
                                    }
                                    key={manager.id}
                                    onClick={() => {
                                        setSelectedManagerName(
                                            manager.name,
                                        )
                                        setSelectedPlayerName(null)
                                    }}
                                >

                                    <span className="draft-slot">
                                        {manager.id}
                                    </span>


                                    <div className="manager-row-info">

                                        <strong>
                                            {manager.name}
                                            {isHonda ? ' (You)' : ''}
                                        </strong>

                                        <small>
                                            {manager.tendency}
                                        </small>

                                    </div>


                                    <div className="manager-row-status">

                                        <strong>
                                            {roster.length}
                                        </strong>

                                        <small>
                                            players
                                        </small>

                                    </div>

                                </button>
                            )
                        })}

                    </div>

                </section>


                <section className="panel">

                    <div className="compact-panel-header">

                        <div>
                            <p className="eyebrow">
                                Draft History
                            </p>

                            <h3>Recent Picks</h3>
                        </div>

                        <span className="compact-panel-meta">
                            {draftHistory.length} total
                        </span>

                    </div>


                    <div className="draft-history-list compact-draft-history">

                        {draftHistory.length === 0 ? (

                            <p className="empty-state">
                                No picks have been made yet.
                            </p>

                        ) : (

                            [...draftHistory]
                                .reverse()
                                .slice(0, 8)
                                .map((pick) => {

                                    const draftedPlayer =
                                        players.find(
                                            (player) =>
                                                player.name ===
                                                pick.player,
                                        )

                                    const pickRound =
                                        Math.floor(
                                            (pick.pick - 1) /
                                            draftManagers.length,
                                        ) + 1

                                    const pickSlot =
                                        (
                                            (pick.pick - 1) %
                                            draftManagers.length
                                        ) + 1

                                    return (
                                        <div
                                            className="draft-history-row"
                                            key={pick.pick}
                                        >

                                            <span className="draft-history-pick">
                                                {pickRound}.
                                                {String(
                                                    pickSlot,
                                                ).padStart(2, '0')}
                                            </span>


                                            <div className="recent-pick-player">

                                                <strong>
                                                    {pick.player}
                                                </strong>

                                                <small>
                                                    {draftedPlayer?.position ??
                                                        '—'}
                                                    {' · '}
                                                    {pick.manager}
                                                </small>

                                            </div>

                                        </div>
                                    )
                                })

                        )}

                    </div>

                </section>


            </div>
            <section className="panel">

                <div className="compact-panel-header">
                    <div>
                        <p className="eyebrow">
                            Honda Draft Story
                        </p>

                        <h3>Live Draft Narrative</h3>
                    </div>

                    <span className="compact-panel-meta">
                        {draftStory.length} events
                    </span>
                </div>


                {draftStory.length === 0 ? (

                    <p className="empty-state">
                        No major draft events yet.
                    </p>

                ) : (

                    <div className="draft-story-list compact-story-list">

                        {draftStory
                            .slice(-6)
                            .reverse()
                            .map((event, index) => (

                                <div
                                    className={`draft-story-event story-${event.type}`}
                                    key={`${event.title}-${index}`}
                                >

                                    <span className="story-marker" />

                                    <div className="story-content">

                                        <strong>
                                            {event.title}
                                        </strong>

                                        <p>
                                            {event.description}
                                        </p>

                                    </div>

                                </div>

                            ))}

                    </div>

                )}

            </section>
            <section className="panel war-review-panel">

                <div className="war-review-header">

                    <div>
                        <p className="eyebrow">
                            Final Review
                        </p>

                        <h3>
                            Ready to Draft?
                        </h3>
                    </div>

                    <div className="review-pick-status">

                        <span>
                            Pick
                        </span>

                        <strong>
                            {roundNumber}.
                            {String(
                                pickInRound,
                            ).padStart(2, '0')}
                        </strong>

                        <small>
                            {currentManager.name}
                        </small>

                    </div>

                </div>


                <div className="review-summary-grid">

                    <div className="review-summary-card">

                        <span>
                            Recommendation
                        </span>

                        <strong>
                            {recommendation?.name ??
                                'No recommendation'}
                        </strong>

                        <small>
                            {recommendation?.position}
                            {' · '}
                            {recommendation?.team}
                        </small>

                    </div>


                    <div className="review-summary-card">

                        <span>
                            Draft Command
                        </span>

                        <strong>
                            {hondaForecast.advice}
                        </strong>

                        <small>
                            {hondaConfidence.score}% confidence
                        </small>

                    </div>


                    <div className="review-summary-card">

                        <span>
                            Survival
                        </span>

                        <strong>
                            {hondaForecast.survivalPercent.toFixed(0)}%
                        </strong>

                        <small>
                            to next Honda pick
                        </small>

                    </div>


                    <div className="review-summary-card">

                        <span>
                            Cost of Waiting
                        </span>

                        <strong>
                            {hondaForecast.costOfWaiting > 0
                                ? `${hondaForecast.costOfWaiting.toFixed(1)} pts`
                                : '0.0 pts'}
                        </strong>

                        <small>
                            Honda value
                        </small>

                    </div>

                </div>


                <div className="review-checklist">

                    <ChecklistItem
                        text="Tier break reviewed"
                    />

                    <ChecklistItem
                        text="Honda ADP checked"
                    />

                    <ChecklistItem
                        text="Manager tendencies reviewed"
                    />

                    <ChecklistItem
                        text="Roster construction approved"
                    />

                </div>


                <div className="war-actions">

                    <button
                        className="draft-button primary-action"
                        onClick={() =>
                            recommendation &&
                            onDraftPlayer(
                                recommendation.name,
                            )
                        }
                    >
                        Draft {recommendation?.name}
                    </button>

                    <button
                        className="draft-button secondary-action"
                        onClick={
                            onSimulateNextPick
                        }
                    >
                        Sim Next Pick
                    </button>

                </div>

            </section>
            {
                selectedManager && (
                    <aside className="player-detail-panel">
                        <div className="player-detail-header">
                            <div>
                                <p className="eyebrow">Manager Profile</p>
                                <h3>{selectedManager.name}</h3>
                                <span>{selectedManager.tendency}</span>
                            </div>

                            <button
                                className="player-detail-close"
                                onClick={() => setSelectedManagerName(null)}
                            >
                                ×
                            </button>
                        </div>

                        <div className="manager-profile-summary">

                            <div>
                                <span>Draft Slot</span>

                                <strong>
                                    #{selectedManager.id}
                                </strong>
                            </div>

                            <div>
                                <span>Next Pick</span>

                                <strong>
                                    {selectedManagerUpcomingPick
                                        ? `${selectedManagerUpcomingPick.round}.${String(
                                            selectedManagerUpcomingPick.pickInRound,
                                        ).padStart(2, '0')}`
                                        : '—'}
                                </strong>
                            </div>

                            <div>
                                <span>Players</span>

                                <strong>
                                    {selectedManagerRoster.length}
                                </strong>
                            </div>

                            <div>
                                <span>QB</span>

                                <strong>
                                    {selectedManagerRosterCounts.QB}
                                </strong>
                            </div>

                            <div>
                                <span>RB</span>

                                <strong>
                                    {selectedManagerRosterCounts.RB}
                                </strong>
                            </div>

                            <div>
                                <span>WR</span>

                                <strong>
                                    {selectedManagerRosterCounts.WR}
                                </strong>
                            </div>

                            <div>
                                <span>TE</span>

                                <strong>
                                    {selectedManagerRosterCounts.TE}
                                </strong>
                            </div>

                        </div>
                        <div className="player-detail-section">
                            <span>Preferred Positions</span>
                            <p>{selectedManager.preferredPositions.join(' → ')}</p>
                        </div>

                        {selectedManagerHistoricalProfile &&
                            selectedManagerHistoricalTendencies && (
                                <div className="player-detail-section">
                                    <span>Historical Draft Profile</span>

                                    <div className="manager-profile-summary">
                                        <div>
                                            <span>History</span>
                                            <strong>
                                                {selectedManagerHistoricalProfile.totalPicks}
                                            </strong>
                                            <small>prior picks</small>
                                        </div>

                                        <div>
                                            <span>Seasons</span>
                                            <strong>
                                                {selectedManagerHistoricalProfile.seasons.length}
                                            </strong>
                                        </div>

                                        <div>
                                            <span>Favorite</span>
                                            <strong>
                                                {selectedManagerHistoricalTendencies.favoritePosition ?? '—'}
                                            </strong>
                                        </div>

                                        <div>
                                            <span>Rookie Rate</span>
                                            <strong>
                                                {(selectedManagerHistoricalTendencies.rookieRate * 100).toFixed(0)}%
                                            </strong>
                                        </div>

                                        <div>
                                            <span>Reach Rate</span>
                                            <strong>
                                                {(selectedManagerHistoricalTendencies.reachesRate * 100).toFixed(0)}%
                                            </strong>
                                        </div>

                                        <div>
                                            <span>Value Rate</span>
                                            <strong>
                                                {(selectedManagerHistoricalTendencies.valuesRate * 100).toFixed(0)}%
                                            </strong>
                                        </div>
                                    </div>

                                    {typeof selectedManagerHistoricalProfile.averageAdpDelta ===
                                        'number' && (
                                            <p>
                                                Average historical ADP delta:{' '}
                                                <strong>
                                                    {selectedManagerHistoricalProfile.averageAdpDelta >= 0
                                                        ? '+'
                                                        : ''}
                                                    {selectedManagerHistoricalProfile.averageAdpDelta.toFixed(1)}
                                                </strong>
                                            </p>
                                        )}
                                </div>
                            )}

                        {selectedManagerRoundTendency && (
                            <div className="player-detail-section">
                                <span>
                                    Round {selectedManagerRoundTendency.round} History
                                </span>

                                <div className="manager-profile-summary">
                                    <div>
                                        <span>Picks</span>
                                        <strong>
                                            {selectedManagerRoundTendency.totalPicks}
                                        </strong>
                                    </div>

                                    <div>
                                        <span>Favorite</span>
                                        <strong>
                                            {selectedManagerRoundTendency.favoritePosition ?? '—'}
                                        </strong>
                                    </div>

                                    <div>
                                        <span>Rookie Rate</span>
                                        <strong>
                                            {(selectedManagerRoundTendency.rookieRate * 100).toFixed(0)}%
                                        </strong>
                                    </div>

                                    <div>
                                        <span>ADP Delta</span>
                                        <strong>
                                            {typeof selectedManagerRoundTendency.averageAdpDelta ===
                                                'number'
                                                ? `${selectedManagerRoundTendency.averageAdpDelta >= 0
                                                    ? '+'
                                                    : ''
                                                }${selectedManagerRoundTendency.averageAdpDelta.toFixed(1)}`
                                                : '—'}
                                        </strong>
                                    </div>
                                </div>

                                {selectedManagerRoundTendency.positions.length > 0 && (
                                    <div className="manager-needs-list">
                                        {selectedManagerRoundTendency.positions
                                            .slice(0, 4)
                                            .map((item) => (
                                                <div
                                                    className="manager-need-row"
                                                    key={item.position}
                                                >
                                                    <strong>{item.position}</strong>
                                                    <span>
                                                        {(item.rate * 100).toFixed(0)}%
                                                    </span>
                                                </div>
                                            ))}
                                    </div>
                                )}
                            </div>
                        )}
                        <div className="player-detail-section">
                            <span>Current Roster</span>

                            {(managerRosters[selectedManager.name] ?? []).length === 0 ? (
                                <p>No players drafted yet.</p>
                            ) : (
                                <div className="manager-drawer-roster">
                                    {(managerRosters[selectedManager.name] ?? []).map((playerName) => {
                                        const player = players.find(
                                            (item) => item.name === playerName,
                                        )

                                        return (
                                            <div className="manager-drawer-player" key={playerName}>
                                                <strong>{playerName}</strong>
                                                <span>{player?.position ?? '—'}</span>
                                            </div>
                                        )
                                    })}
                                </div>
                            )}
                        </div>
                        <div className="player-detail-section">
                            <span>Team Needs</span>

                            <div className="manager-needs-list">
                                {managerNeeds.map((need) => (
                                    <div
                                        className="manager-need-row"
                                        key={need.position}
                                    >
                                        <strong>{need.position}</strong>

                                        <span
                                            className={`need-${need.need.toLowerCase()}`}
                                        >
                                            {need.need}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="player-detail-section">
                            <span>Likely Next Pick</span>

                            {managerPrediction ? (
                                <>
                                    <div className="manager-prediction-summary">
                                        <strong>{managerPrediction.position}</strong>
                                        <small>{managerPrediction.confidence}% confidence</small>
                                    </div>

                                    <div className="manager-prediction-list">
                                        {managerPrediction.players.map((player, index) => (
                                            <button
                                                className="manager-prediction-player"
                                                key={player.name}
                                                onClick={() => {
                                                    setSelectedPlayerName(player.name)
                                                    setSelectedManagerName(null)
                                                }}
                                            >
                                                <span>#{index + 1}</span>

                                                <div>
                                                    <strong>{player.name}</strong>
                                                    <small>
                                                        {player.position} · {player.tier}
                                                    </small>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                    <div className="manager-prediction-reasons">
                                        <strong>Why this prediction</strong>

                                        {managerPrediction.reasons.map((reason) => (
                                            <div
                                                className="prediction-reason"
                                                key={reason}
                                            >
                                                • {reason}
                                            </div>
                                        ))}
                                    </div>
                                </>
                            ) : (
                                <p>No strong prediction yet.</p>
                            )}
                        </div>
                    </aside>
                )
            }
        </div >
    )
}