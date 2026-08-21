type DashboardProps = {
  draftedPlayerNames: string[]
  currentPickIndex: number
  currentManagerName: string
  onSelectPlayer: (playerName: string) => void
  onDraftPlayer: (playerName: string) => void
}

import { players } from '../data/players'

function Metric({
  label,
  value,
  detail,
}: {
  label: string
  value: string
  detail: string
}) {
  return (
    <article className="metric">
      <span>{label}</span>
      <strong>{value}</strong>
      <small>{detail}</small>
    </article>
  )
}

export default function Dashboard({
  draftedPlayerNames,
  currentPickIndex,
  currentManagerName,
  onSelectPlayer,
  onDraftPlayer,
}: DashboardProps) {


  const availablePlayers = players.filter(
    (player) => !draftedPlayerNames.includes(player.name),
  )
  const recommendation = availablePlayers[0]

  const round =
    Math.floor(currentPickIndex / 12) + 1

  const pickInRound =
    (currentPickIndex % 12) + 1

  const pickLabel =
    `${round}.${String(pickInRound).padStart(2, '0')}`
  return (
    <>
      <section className="hero">
        <div>
          <p className="eyebrow light">
            On the clock · {currentManagerName} · {pickLabel} · Overall {currentPickIndex + 1}
          </p>

          <h2>{recommendation?.name ?? 'Draft Complete'}</h2>

          <p className="hero-text">
            {recommendation
              ? recommendation.xFactor
              : 'No available players remain on the board.'}
          </p>

        </div>
        <div className="recommendation">
          <span>Recommendation</span>
          <strong>{recommendation?.action ?? 'DONE'}</strong>
          <small>
            {recommendation
              ? `${Math.round(recommendation.score)}% confidence`
              : 'All players drafted'}
          </small>
        </div>
      </section>

      <section className="metrics">
        <Metric label="Honda Edge" value="+5.0" detail="Above room cost" />
        <Metric
          label="Tier Pressure"
          value="High"
          detail="Franchise QB available"
        />
        <Metric label="Next Run" value="RB" detail="71% probability" />
        <Metric label="Roster Grade" value="—" detail="Draft not started" />
      </section>

      <section className="panel">
        <div className="panel-header">
          <div>
            <p className="eyebrow">Live market</p>
            <h3>Best Available</h3>
          </div>
        </div>

        <div className="player-list">
          {availablePlayers.map((player) => (
            <div
              className="player-row dashboard-player-button dashboard-player-row"
              key={player.name}
            >
              <button
                className="dashboard-player-open"
                onClick={() => onSelectPlayer(player.name)}
              >
                <div className="player-position">
                  {player.position}
                </div>

                <div className="player-info">
                  <strong>{player.name}</strong>
                  <span>{player.tier}</span>
                </div>

                <span
                  className={`command ${player.action
                    .toLowerCase()
                    .replaceAll(' ', '-')}`}
                >
                  {player.action}
                </span>
              </button>

              <button
                className="dashboard-draft-button"
                onClick={() => onDraftPlayer(player.name)}
              >
                Draft
              </button>
            </div>
          ))}
        </div>
      </section>
    </>
  )
}