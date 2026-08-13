import { players } from '../data/players'
import { draftManagers } from '../data/managers'

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
}: WarRoomProps) {

    const availablePlayers = players.filter(
        (player) => !draftedPlayerNames.includes(player.name),
    )

    const recommendation = availablePlayers[0]

    const alternatives = availablePlayers
        .filter((player) => player.name !== recommendation?.name)
        .slice(0, 4)
    const currentManager =
        draftManagers[currentPickIndex % draftManagers.length]

    const roundNumber =
        Math.floor(currentPickIndex / draftManagers.length) + 1

    const pickInRound =
        (currentPickIndex % draftManagers.length) + 1
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
                    <strong>{recommendation?.action}</strong>
                    <small>96% confidence</small>
                </div>
            </section>

            <section className="war-grid">
                <article className="panel">
                    <p className="eyebrow">Decision factors</p>
                    <h3>Why this pick</h3>

                    <div className="factor-list">
                        <DecisionFactor
                            label="Honda scoring advantage"
                            value="+5.0"
                            positive
                        />

                        <DecisionFactor
                            label="Positional scarcity"
                            value="High"
                            positive
                        />

                        <DecisionFactor
                            label="Survival to next pick"
                            value="13%"
                        />

                        <DecisionFactor
                            label="Manager snipe risk"
                            value="Very High"
                        />
                    </div>
                </article>

                <article className="panel">
                    <p className="eyebrow">Threat analysis</p>
                    <h3>Best alternatives</h3>

                    <div className="alternative-list">
                        {alternatives.map((player, index) => (
                            <div className="alternative-row" key={player.name}>
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
                            </div>
                        ))}
                    </div>
                </article>
            </section>

            <section className="panel">
                <p className="eyebrow">War Room checklist</p>
                <h3>Final review</h3>

                <div className="checklist">
                    <ChecklistItem text="Tier break reviewed" />
                    <ChecklistItem text="Honda ADP checked" />
                    <ChecklistItem text="Manager tendencies reviewed" />
                    <ChecklistItem text="Roster construction approved" />
                </div>

                <button
                    className="draft-button"
                    onClick={() => recommendation && onDraftPlayer(recommendation.name)}
                >
                    Draft {recommendation?.name}
                </button>
               
                <button
                    className="draft-button"
                    onClick={onSimulateNextPick}
                >
                    Sim Next Pick
                </button>
                
            </section>
            <section className="panel">
                <p className="eyebrow">Draft order</p>
                <h3>Honda Managers</h3>

                <div className="draft-order-list">
                    {draftManagers.map((manager) => (
                        <div
                            className={
                                manager.id === currentManager.id
                                    ? 'draft-order-row current-manager'
                                    : 'draft-order-row'
                            }
                            key={manager.id}
                        >
                            <span className="draft-slot">{manager.id}</span>

                            <div>
                                <strong>{manager.name}</strong>
                                <small>{manager.tendency}</small>
                            </div>
                        </div>
                    ))}
                </div>
            </section>
            <section className="panel">
                <p className="eyebrow">Draft history</p>
                <h3>Recent Picks</h3>

                <div className="draft-history-list">
                    {draftHistory.length === 0 ? (
                        <p className="empty-state">
                            No picks have been made yet.
                        </p>
                    ) : (
                        draftHistory.map((pick) => (
                            <div className="draft-history-row" key={pick.pick}>
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
    )
}