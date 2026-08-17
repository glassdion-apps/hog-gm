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

function DecisionFactor({
    label,
    value,
    positive = false,
}: {
    label: string
    value: string
    positive?: boolean
}) {
    return (
        <div className="decision-factor">
            <span>{label}</span>

            <strong className={positive ? 'positive-value' : ''}>
                {value}
            </strong>
        </div>
    )
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

    const decision = getHondaDecision(
        draftedPlayerNames,
        currentPickIndex,
    )

    const recommendation = decision?.player

    const decisionScore = decision?.decisionScore ?? 0
    const baseScore = decision?.baseScore ?? 0
    const adpBonus = decision?.adpBonus ?? 0
    const riskBonus = decision?.riskBonus ?? 0
    const hondaEdge = decision?.hondaEdge ?? 0
    const liveRankings = getHondaRankings(draftedPlayerNames).slice(0, 5)

    const positionalScarcity =
        decision?.positionalScarcity ?? 'Low'

    const survivalChance =
        decision?.survivalChance ?? 0

    const managerSnipeRisk =
        decision?.managerSnipeRisk ?? 'Low'

    const alternatives = availablePlayers
        .filter((player) => player.name !== recommendation?.name)
        .slice(0, 4)
    const currentManager =
        draftManagers[currentPickIndex % draftManagers.length]

    const rosterFit = decision?.rosterFit ?? 0

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
    return (



        <div className="war-room">

            <section className="war-decision">
                <div>
                    <p className="eyebrow light">
                        On the clock · Pick {roundNumber}.
                        {String(pickInRound).padStart(2, '0')} · {currentManager.name}
                    </p>

                    <h2>{recommendation?.name}</h2>

                    <p>
                        Take the elite positional advantage now. Do not assume he survives
                        until your next selection.
                    </p>
                </div>

                <div className="war-command">
                    <span>Draft Command</span>

                    <strong>
                        {hondaExplanation.urgency === 'VERY HIGH'
                            ? 'TARGET NOW'
                            : recommendation?.action}
                    </strong>

                    <div className="honda-confidence">
                        <span>Honda Confidence</span>

                        <strong>
                            {hondaConfidence.score}%
                        </strong>
                        <div className="honda-confidence-bar">
                            <div
                                className="honda-confidence-fill"
                                style={{ width: `${hondaConfidence.score}%` }}
                            />
                        </div>
                        
                        <small>
                            {hondaConfidence.label}
                        </small>
                    </div>

                    <p className="war-command-reason">
                        {hondaExplanation.bullets[0] ??
                            'Best available Honda value.'}
                    </p>
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
                            <p className="eyebrow">Honda Intelligence</p>
                            <h3>Decision Engine</h3>
                        </div>

                        <div className="decision-engine-score">
                            <span>Overall Score</span>
                            <strong>{decisionScore.toFixed(1)}</strong>
                        </div>
                    </div>

                    <div className="decision-breakdown">
                        <div>
                            <span>HOG Score</span>
                            <strong>{baseScore.toFixed(1)}</strong>
                        </div>

                        <div>
                            <span>Honda Edge</span>
                            <strong>
                                {hondaEdge >= 0 ? '+' : ''}
                                {hondaEdge.toFixed(1)}
                            </strong>
                        </div>

                        <div>
                            <span>ADP Bonus</span>
                            <strong>+{adpBonus.toFixed(1)}</strong>
                        </div>

                        <div>
                            <span>Risk Bonus</span>
                            <strong>+{riskBonus.toFixed(1)}</strong>
                        </div>

                        <div>
                            <span>Roster Fit</span>
                            <strong>
                                {rosterFit >= 0 ? '+' : ''}
                                {rosterFit.toFixed(1)}
                            </strong>
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
                <section className="panel">
                    <p className="eyebrow">Decision Factors</p>
                    <h3>Why This Pick</h3>
                    <div className="honda-explanation">
                        <div className="honda-explanation-header">
                            <div>
                                <span>Honda Intelligence Summary</span>
                                <strong>{hondaExplanation.title}</strong>
                            </div>

                            <div className="honda-urgency">
                                <span>Urgency</span>
                                <strong>{hondaExplanation.urgency}</strong>
                            </div>
                        </div>

                        <div className="honda-explanation-list">
                            {hondaExplanation.bullets.map((bullet) => (
                                <p key={bullet}>• {bullet}</p>
                            ))}
                        </div>
                    </div>
                    <div className="factor-list">
                        <DecisionFactor
                            label="Honda scoring advantage"
                            value="+5.0"
                            positive
                        />

                        <DecisionFactor
                            label="Positional scarcity"
                            value={positionalScarcity}
                            positive={
                                positionalScarcity === 'High' ||
                                positionalScarcity === 'Very High' ||
                                positionalScarcity === 'Critical'
                            }
                        />

                        <DecisionFactor
                            label="Survival to next pick"
                            value={`${survivalChance}%`}
                        />

                        <DecisionFactor
                            label="Manager snipe risk"
                            value={managerSnipeRisk}
                        />
                    </div>
                </section>

                <section className="panel">
                    <p className="eyebrow">Threat Analysis</p>
                    <h3>Best Alternatives</h3>

                    <div className="alternative-list">
                        {alternatives.map((player, index) => (
                            <button
                                className="alternative-row alternative-button"
                                key={player.name}
                                onClick={() => setSelectedPlayerName(player.name)}
                            >
                                <div>
                                    <strong>{player.name}</strong>
                                    <span>
                                        {player.position} · {player.tier}
                                    </span>
                                </div>

                                <div className="survival">
                                    <small>Survival</small>
                                    <strong>{[18, 61, 42, 54][index]}%</strong>
                                </div>
                            </button>
                        ))}
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