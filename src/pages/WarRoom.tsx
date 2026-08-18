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

    const availablePlayers = players.filter(
        (player) => !draftedPlayerNames.includes(player.name),
    )

    const myRosterNames =
        managerRosters['You'] ?? []

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
    const liveRankings =
        getHondaRankings(
            draftedPlayerNames,
            liveRosterCounts,
        ).slice(0, 5)

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

    const alternatives = availablePlayers
        .filter((player) => player.name !== recommendation?.name)
        .slice(0, 4)
    const currentManager =
        draftManagers[currentPickIndex % draftManagers.length]

    const rosterFit = decision?.rosterFit ?? 0

    const liveRosterNeed =
        decision?.liveRosterNeed ?? 0

    const roundNumber =
        Math.floor(currentPickIndex / draftManagers.length) + 1

    const pickInRound =
        (currentPickIndex % draftManagers.length) + 1

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
    const managerNeeds = selectedManager
        ? getManagerNeeds(
            managerRosters[selectedManager.name] ?? [],
        )
        : []


    const managerPrediction = selectedManager
        ? getManagerPrediction(
            selectedManager,
            managerRosters[selectedManager.name] ?? [],
            draftedPlayerNames,
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

    const biggestDropRisk =
        hondaForecast.picks.find(
            (pick) =>
                pick.player !== recommendation?.name &&
                pick.player !==
                hondaForecast.futureRecommendation?.name,
        ) ??
        hondaForecast.picks.find(
            (pick) =>
                pick.player !== recommendation?.name,
        ) ??
        null

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
                        <span>Survival</span>

                        <strong>
                            {hondaForecast.survivalPercent.toFixed(0)}%
                        </strong>
                    </div>

                    <div className="hero-forecast-row">
                        <span>Next Pick</span>

                        <strong>
                            {hondaForecast.picksUntilNextHondaPick} picks
                        </strong>
                    </div>

                    <div className="hero-forecast-divider" />

                    <small>
                        Based on current roster, rankings,
                        projections, and simulated draft risk.
                    </small>

                </div>

            </section>

            {/* NEW PANEL GOES HERE */}

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
                                Biggest Drop
                            </span>

                            <strong>
                                {biggestDropRisk?.player ??
                                    'No major drop'}
                            </strong>

                            <small>
                                {biggestDropRisk
                                    ? `${biggestDropRisk.position} · ${biggestDropRisk.confidence}% chance gone`
                                    : 'No major threat detected'}
                            </small>

                            <div className="target-card-value danger-value">
                                {biggestDropRisk
                                    ? `${biggestDropRisk.confidence}% at risk`
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
                <div className="live-intel-list">
                    {liveDraftIntel.map((alert) => (
                        <div
                            className="live-intel-row"
                            key={alert.manager}
                        >
                            <div>
                                <strong>{alert.manager}</strong>

                                <small>
                                    Likely {alert.position} • {alert.confidence}% confidence
                                </small>
                            </div>

                            <div className="live-intel-target">
                                <span>Top Target</span>

                                <strong>{alert.player}</strong>
                            </div>
                        </div>
                    ))}
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
                        {liveRankings.map((entry, index) => (
                            <button
                                className="live-ranking-row live-ranking-button"
                                key={entry.player.name}
                                onClick={() => {
                                    setSelectedPlayerName(entry.player.name)
                                    setSelectedManagerName(null)
                                }}
                            >
                                <span className="live-ranking-number">
                                    #{index + 1}
                                </span>

                                <div>
                                    <strong>{entry.player.name}</strong>
                                    <small>
                                        {entry.player.position} · {entry.player.tier}
                                    </small>
                                </div>

                                <strong className="live-ranking-score">
                                    {entry.score.toFixed(1)}
                                </strong>
                            </button>
                        ))}
                    </div>
                </section>
                {selectedPlayer && (
                    <aside className="player-detail-panel">
                        <div className="player-detail-header">
                            <div>
                                <p className="eyebrow">Player Profile</p>
                                <h3>{selectedPlayer.name}</h3>
                                <span>
                                    {selectedPlayer.position} · {selectedPlayer.tier}
                                </span>
                            </div>

                            <button
                                className="player-detail-close"
                                onClick={() => setSelectedPlayerName(null)}
                            >
                                ×
                            </button>
                            <button
                                className="draft-button player-detail-draft"
                                onClick={() => {
                                    onDraftPlayer(selectedPlayer.name)
                                    setSelectedPlayerName(null)
                                }}
                            >
                                Draft {selectedPlayer.name}
                            </button>
                        </div>

                        <div className="player-detail-stats">
                            <div>
                                <span>HOG Rank</span>
                                <strong>#{selectedPlayer.rank}</strong>
                            </div>

                            <div>
                                <span>HOG Score</span>
                                <strong>{selectedPlayer.score}</strong>
                            </div>

                            <div>
                                <span>Risk</span>
                                <strong>{selectedPlayer.risk}</strong>
                            </div>

                            <div>
                                <span>Command</span>
                                <strong>{selectedPlayer.action}</strong>
                            </div>
                        </div>

                        <div className="player-detail-section">
                            <span>Public ADP</span>
                            <strong>{selectedPlayer.publicAdp}</strong>
                        </div>

                        <div className="player-detail-section">
                            <span>Honda X-Factor</span>
                            <p>{selectedPlayer.xFactor}</p>
                        </div>

                    </aside>
                )}
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
                                getHondaRankings(
                                    draftedPlayerNames,
                                    liveRosterCounts,
                                ).find(
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
                                    onClick={() =>
                                        setSelectedPlayerName(
                                            player.name,
                                        )
                                    }
                                >
                                    <div>
                                        <strong>
                                            {player.name}
                                        </strong>

                                        <span>
                                            {player.position}
                                            {' · '}
                                            {player.tier}
                                        </span>
                                    </div>

                                    <div className="alternative-gap">
                                        <strong>
                                            -{Math.max(
                                                0,
                                                scoreGap,
                                            ).toFixed(1)}
                                        </strong>

                                        <small>
                                            Honda pts
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
                    <p className="eyebrow">Draft Order</p>
                    <h3>Honda Managers</h3>

                    <div className="draft-order-list compact-draft-order">
                        {draftManagers.map((manager) => (
                            <button
                                className={
                                    manager.id === currentManager.id
                                        ? 'draft-order-row current-manager manager-detail-button'
                                        : 'draft-order-row manager-detail-button'
                                }
                                key={manager.id}
                                onClick={() => {
                                    setSelectedManagerName(manager.name)
                                    setSelectedPlayerName(null)
                                }}
                            >
                                <span className="draft-slot">
                                    {manager.id}
                                </span>

                                <div>
                                    <strong>{manager.name}</strong>
                                    <small>{manager.tendency}</small>
                                </div>
                            </button>
                        ))}
                    </div>
                </section>

                <section className="panel">
                    <p className="eyebrow">Draft History</p>
                    <h3>Recent Picks</h3>

                    <div className="draft-history-list compact-draft-history">
                        {draftHistory.length === 0 ? (
                            <p className="empty-state">
                                No picks have been made yet.
                            </p>
                        ) : (
                            [...draftHistory]
                                .reverse()
                                .map((pick) => (
                                    <div
                                        className="draft-history-row"
                                        key={pick.pick}
                                    >
                                        <span className="draft-history-pick">
                                            {pick.pick}
                                        </span>

                                        <div>
                                            <strong>{pick.player}</strong>
                                            <small>{pick.manager}</small>
                                        </div>
                                    </div>
                                ))
                        )}
                    </div>
                </section>
            </div>
            <section className="panel">
                <p className="eyebrow">Honda Draft Story</p>
                <h3>Live Draft Narrative</h3>

                {draftStory.length === 0 ? (
                    <p className="empty-state">
                        No major draft events yet.
                    </p>
                ) : (
                    <div className="draft-story-list">
                        {draftStory
                            .slice(-5)
                            .reverse()
                            .map((event, index) => (
                                <div
                                    className={`draft-story-event story-${event.type}`}
                                    key={`${event.title}-${index}`}
                                >
                                    <strong>{event.title}</strong>
                                    <p>{event.description}</p>
                                </div>
                            ))}
                    </div>
                )}
            </section>
            <section className="panel war-review-panel">
                <div className="war-review-header">
                    <div>
                        <p className="eyebrow">War Room Checklist</p>
                        <h3>Final Review</h3>
                    </div>

                    <span className="on-clock-label">
                        {currentManager.name} · Pick {roundNumber}.
                        {String(pickInRound).padStart(2, '0')}
                    </span>
                </div>

                <div className="checklist">
                    <ChecklistItem text="Tier break reviewed" />
                    <ChecklistItem text="Honda ADP checked" />
                    <ChecklistItem text="Manager tendencies reviewed" />
                    <ChecklistItem text="Roster construction approved" />
                </div>

                <div className="war-actions">
                    <button
                        className="draft-button primary-action"
                        onClick={() =>
                            recommendation &&
                            onDraftPlayer(recommendation.name)
                        }
                    >
                        Draft {recommendation?.name}
                    </button>

                    <button
                        className="draft-button secondary-action"
                        onClick={onSimulateNextPick}
                    >
                        Sim Next Pick
                    </button>
                </div>
            </section>
            {selectedManager && (
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

                    <div className="player-detail-stats">
                        <div>
                            <span>Draft Slot</span>
                            <strong>#{selectedManager.id}</strong>
                        </div>

                        <div>
                            <span>Tendency</span>
                            <strong>{selectedManager.tendency}</strong>
                        </div>
                    </div>

                    <div className="player-detail-section">
                        <span>Preferred Positions</span>
                        <p>{selectedManager.preferredPositions.join(' → ')}</p>
                    </div>
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
            )}
        </div>
    )
}