import { useState } from 'react'
import './App.css'

type Page =
  | 'dashboard'
  | 'board'
  | 'warroom'
  | 'team'
  | 'managers'
  | 'encyclopedia'

const players = [
  { name: 'Josh Allen', position: 'QB', tier: 'Franchise', action: 'HAMMER' },
  { name: 'James Cook', position: 'RB', tier: 'Cornerstone', action: 'TARGET' },
  { name: 'Nico Collins', position: 'WR', tier: 'Cornerstone', action: 'TARGET' },
  { name: 'Trey McBride', position: 'TE', tier: 'Cornerstone', action: 'BUY' },
]

function App() {
  const [page, setPage] = useState<Page>('dashboard')

  const pageTitles: Record<Page, string> = {
    dashboard: 'Dashboard',
    board: 'Big Board',
    warroom: 'War Room',
    team: 'My Team',
    managers: 'Managers',
    encyclopedia: 'Player Encyclopedia',
  }

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
          <NavButton
            label="Dashboard"
            active={page === 'dashboard'}
            onClick={() => setPage('dashboard')}
          />

          <NavButton
            label="Big Board"
            active={page === 'board'}
            onClick={() => setPage('board')}
          />

          <NavButton
            label="War Room"
            active={page === 'warroom'}
            onClick={() => setPage('warroom')}
          />

          <NavButton
            label="My Team"
            active={page === 'team'}
            onClick={() => setPage('team')}
          />

          <NavButton
            label="Managers"
            active={page === 'managers'}
            onClick={() => setPage('managers')}
          />

          <NavButton
            label="Player Encyclopedia"
            active={page === 'encyclopedia'}
            onClick={() => setPage('encyclopedia')}
          />
        </nav>
      </aside>

      <main className="main">
        <header className="topbar">
          <div>
            <p className="eyebrow">2026 Draft Command Center</p>
            <h1>{pageTitles[page]}</h1>
          </div>

          <div className="league-badge">
            <span className="status-dot" />
            Honda on Grand
          </div>
        </header>

        {page === 'dashboard' && <Dashboard />}
        {page === 'board' && <Placeholder title="Big Board" />}
        {page === 'warroom' && <Placeholder title="War Room" />}
        {page === 'team' && <Placeholder title="My Team" />}
        {page === 'managers' && <Placeholder title="Manager Tracker" />}
        {page === 'encyclopedia' && (
          <Placeholder title="Player Encyclopedia" />
        )}
      </main>
    </div>
  )
}

function NavButton({
  label,
  active,
  onClick,
}: {
  label: string
  active: boolean
  onClick: () => void
}) {
  return (
    <button className={active ? 'active' : ''} onClick={onClick}>
      {label}
    </button>
  )
}

function Dashboard() {
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

              <span className={`command ${player.action.toLowerCase()}`}>
                {player.action}
              </span>
            </div>
          ))}
        </div>
      </section>
    </>
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

function Placeholder({ title }: { title: string }) {
  return (
    <section className="panel">
      <p className="eyebrow">HOG GM module</p>
      <h2>{title}</h2>
      <p>This section will be built next.</p>
    </section>
  )
}

export default App