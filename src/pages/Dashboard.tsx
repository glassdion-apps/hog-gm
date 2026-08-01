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

export default function Dashboard() {
  return (
    <>
      <section className="hero">
        <div>
          <p className="eyebrow light">On the clock · Pick 1.12</p>

          <h2>Josh Allen</h2>

          <p className="hero-text">
            Elite positional advantage under Honda’s six-point passing
            touchdown scoring.
          </p>
        </div>

        <div className="recommendation">
          <span>Recommendation</span>
          <strong>HAMMER</strong>
          <small>96% confidence</small>
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
          {players.map((player) => (
            <div className="player-row" key={player.name}>
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
            </div>
          ))}
        </div>
      </section>
    </>
  )
}