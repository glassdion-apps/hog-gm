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
  { rank: 1, name: 'Jahmyr Gibbs', position: 'RB', tier: 'Franchise', score: 100, action: 'HAMMER' },
  { rank: 2, name: 'Bijan Robinson', position: 'RB', tier: 'Franchise', score: 99.9, action: 'HAMMER' },
  { rank: 3, name: "Ja'Marr Chase", position: 'WR', tier: 'Franchise', score: 99.8, action: 'TARGET' },
  { rank: 4, name: 'Josh Allen', position: 'QB', tier: 'Franchise', score: 99, action: 'HAMMER' },
  { rank: 5, name: 'James Cook', position: 'RB', tier: 'Cornerstone', score: 95.9, action: 'TARGET' },
  { rank: 6, name: 'Trey McBride', position: 'TE', tier: 'Cornerstone', score: 95.7, action: 'BUY' },
  { rank: 7, name: 'Nico Collins', position: 'WR', tier: 'Cornerstone', score: 95.4, action: 'TARGET' },
  { rank: 8, name: 'Lamar Jackson', position: 'QB', tier: 'Cornerstone', score: 96.8, action: 'BUY' },
  { rank: 9, name: 'Jalen Hurts', position: 'QB', tier: 'Cornerstone', score: 96.5, action: 'TARGET' },
  { rank: 10, name: 'Malik Nabers', position: 'WR', tier: 'League Winner', score: 95.6, action: 'TARGET' },
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
        {page === 'board' && <BigBoard />}
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
function BigBoard() {
  const [search, setSearch] = useState('')
  const [position, setPosition] = useState('ALL')

  const filteredPlayers = players.filter((player) => {
    const matchesSearch = player.name
      .toLowerCase()
      .includes(search.toLowerCase())

    const matchesPosition =
      position === 'ALL' || player.position === position

    return matchesSearch && matchesPosition
  })

  return (
    <section className="panel">
      <div className="panel-header board-header">
        <div>
          <p className="eyebrow">Honda rankings</p>
          <h3>Championship Big Board</h3>
        </div>

        <div className="board-controls">
          <input
            type="search"
            placeholder="Search players"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />

          <select
            value={position}
            onChange={(event) => setPosition(event.target.value)}
          >
            <option value="ALL">All positions</option>
            <option value="QB">Quarterbacks</option>
            <option value="RB">Running backs</option>
            <option value="WR">Wide receivers</option>
            <option value="TE">Tight ends</option>
          </select>
        </div>
      </div>

      <div className="big-board">
        <div className="board-row board-labels">
          <span>Rank</span>
          <span>Player</span>
          <span>Position</span>
          <span>Tier</span>
          <span>HOG Score</span>
          <span>Command</span>
        </div>

        {filteredPlayers.map((player) => (
          <div className="board-row" key={player.name}>
            <strong>#{player.rank}</strong>

            <div className="board-player">
              <strong>{player.name}</strong>
              <small>Available</small>
            </div>

            <span className="position-chip">{player.position}</span>
            <span>{player.tier}</span>
            <strong>{player.score}</strong>

            <span className={`command ${player.action.toLowerCase()}`}>
              {player.action}
            </span>
          </div>
        ))}
      </div>

      {filteredPlayers.length === 0 && (
        <div className="empty-state">
          No players match the current filters.
        </div>
      )}
    </section>
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