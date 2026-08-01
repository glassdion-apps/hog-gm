import './App.css'

const players = [
  { name: 'Josh Allen', position: 'QB', tier: 'Franchise', action: 'HAMMER' },
  { name: 'James Cook', position: 'RB', tier: 'Cornerstone', action: 'TARGET' },
  { name: 'Nico Collins', position: 'WR', tier: 'Cornerstone', action: 'TARGET' },
  { name: 'Trey McBride', position: 'TE', tier: 'Cornerstone', action: 'BUY' },
]

function App() {
  return (
    <div className="app">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-logo">H</div>
          <div>
            <strong>HOG GM</strong>
            <span>Honda on Grand</span>
          </div>
        </div>

        <nav>
          <button className="active">Dashboard</button>
          <button>Big Board</button>
          <button>War Room</button>
          <button>My Team</button>
          <button>Managers</button>
          <button>Player Encyclopedia</button>
        </nav>
      </aside>

      <main className="main">
        <header className="topbar">
          <div>
            <p className="eyebrow">2026 Draft Command Center</p>
            <h1>Dashboard</h1>
          </div>

          <div className="league-badge">
            <span className="status-dot" />
            Honda on Grand
          </div>
        </header>

        <section className="hero">
          <div>
            <p className="eyebrow light">On the clock · Pick 1.12</p>
            <h2>Josh Allen</h2>
            <p className="hero-text">
              Elite positional advantage under Honda’s six-point passing touchdown scoring.
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
          <Metric label="Tier Pressure" value="High" detail="Franchise QB available" />
          <Metric label="Next Run" value="RB" detail="71% probability" />
          <Metric label="Roster Grade" value="—" detail="Draft not started" />
        </section>

        <section className="panel">
          <div className="panel-header">
            <div>
              <p className="eyebrow">Live market</p>
              <h3>Best Available</h3>
            </div>

            <button className="view-button">View Big Board</button>
          </div>

          <div className="player-list">
            {players.map((player) => (
              <div className="player-row" key={player.name}>
                <div className="player-position">{player.position}</div>

                <div className="player-info">
                  <strong>{player.name}</strong>
                  <span>{player.tier}</span>
                </div>

                <span className={`command ${player.action.toLowerCase()}`}>
                  {player.action}
                </span>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  )
}

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

export default App