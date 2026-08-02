type DashboardProps = {
  draftedPlayerNames: string[]
  onSelectPlayer: (playerName: string) => void
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
  onSelectPlayer,
}: DashboardProps) {
  const availablePlayers = players.filter(
    (player) => !draftedPlayerNames.includes(player.name),
  )
  const recommendation = availablePlayers[0]
  return (
    <>
      <section className="hero">
        <div>
          <p className="eyebrow light">On the clock · Pick 1.12</p>
      
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
            <button
              className="player-row dashboard-player-button"
              key={player.name}
              onClick={() => onSelectPlayer(player.name)}
            >
              <div className="player-position">{player.position}</div>

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
          ))}
        </div>
      </section>
    </>
  )
}