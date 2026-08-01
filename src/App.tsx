import { useState } from 'react'
import './App.css'
import Sidebar from './components/Sidebar'
import Dashboard from './pages/Dashboard'
import { players } from './data/players'
type Page =
  | 'dashboard'
  | 'board'
  | 'warroom'
  | 'team'
  | 'managers'
  | 'encyclopedia'



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
      <Sidebar
  currentPage={page}
  onPageChange={(newPage) => setPage(newPage as Page)}
/>
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
        {page === 'warroom' && <WarRoom />}
        {page === 'team' && <MyTeam />}
        {page === 'managers' && <Placeholder title="Manager Tracker" />}
        {page === 'encyclopedia' && (
          <Placeholder title="Player Encyclopedia" />
        )}
      </main>
    </div>
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

function WarRoom() {
  const recommendation = players.find(
    (player) => player.name === 'Josh Allen',
  )

  const alternatives = players
    .filter((player) => player.name !== 'Josh Allen')
    .slice(0, 4)

  return (
    <div className="war-room">
      <section className="war-decision">
        <div>
          <p className="eyebrow light">On the clock · Pick 1.12</p>
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

        <button className="draft-button">
          Draft {recommendation?.name}
        </button>
      </section>
    </div>
  )
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

type RosterSlot = {
  id: string
  label: string
  allowed: string[]
}

const rosterSlots: RosterSlot[] = [
  { id: 'qb', label: 'QB', allowed: ['QB'] },
  { id: 'rb1', label: 'RB1', allowed: ['RB'] },
  { id: 'rb2', label: 'RB2', allowed: ['RB'] },
  { id: 'wr1', label: 'WR1', allowed: ['WR'] },
  { id: 'wr2', label: 'WR2', allowed: ['WR'] },
  { id: 'te', label: 'TE', allowed: ['TE'] },
  { id: 'flex', label: 'FLEX', allowed: ['RB', 'WR', 'TE'] },
]

function MyTeam() {
  const [roster, setRoster] = useState<Record<string, string>>({})

  const selectedPlayers = Object.values(roster).filter(Boolean)

  const rosterScore = selectedPlayers.reduce((total, playerName) => {
    const player = players.find((item) => item.name === playerName)
    return total + (player?.score ?? 0)
  }, 0)

  const filledSlots = selectedPlayers.length
  const averageScore =
    filledSlots > 0 ? rosterScore / filledSlots : 0

  const grade =
    filledSlots === 0
      ? '—'
      : averageScore >= 98
        ? 'A+'
        : averageScore >= 96
          ? 'A'
          : averageScore >= 94
            ? 'B+'
            : 'B'

  function updateSlot(slotId: string, playerName: string) {
    setRoster((current) => ({
      ...current,
      [slotId]: playerName,
    }))
  }

  return (
    <div className="team-page">
      <section className="team-summary">
        <div>
          <p className="eyebrow light">Roster construction</p>
          <h2>My Championship Build</h2>
          <p>
            Fill each starting slot to evaluate positional strength and
            overall roster quality.
          </p>
        </div>

        <div className="team-grade">
          <span>Roster Grade</span>
          <strong>{grade}</strong>
          <small>{filledSlots} of {rosterSlots.length} starters filled</small>
        </div>
      </section>

      <section className="team-grid">
        <article className="panel">
          <p className="eyebrow">Starting lineup</p>
          <h3>Roster</h3>

          <div className="roster-list">
            {rosterSlots.map((slot) => {
              const availablePlayers = players.filter(
                (player) =>
                  slot.allowed.includes(player.position) &&
                  (
                    !selectedPlayers.includes(player.name) ||
                    roster[slot.id] === player.name
                  ),
              )

              return (
                <div className="roster-row" key={slot.id}>
                  <div className="slot-label">{slot.label}</div>

                  <select
                    value={roster[slot.id] ?? ''}
                    onChange={(event) =>
                      updateSlot(slot.id, event.target.value)
                    }
                  >
                    <option value="">Open roster slot</option>

                    {availablePlayers.map((player) => (
                      <option value={player.name} key={player.name}>
                        {player.name} · {player.position}
                      </option>
                    ))}
                  </select>

                  <div className="slot-score">
                    {roster[slot.id]
                      ? players.find(
                          (player) =>
                            player.name === roster[slot.id],
                        )?.score
                      : '—'}
                  </div>
                </div>
              )
            })}
          </div>
        </article>

        <article className="panel">
          <p className="eyebrow">Roster analytics</p>
          <h3>Team Profile</h3>

          <div className="team-metrics">
            <DecisionFactor
              label="Starting slots filled"
              value={`${filledSlots}/${rosterSlots.length}`}
              positive={filledSlots === rosterSlots.length}
            />

            <DecisionFactor
              label="Average HOG score"
              value={filledSlots ? averageScore.toFixed(1) : '—'}
              positive={averageScore >= 96}
            />

            <DecisionFactor
              label="Total HOG score"
              value={filledSlots ? rosterScore.toFixed(1) : '—'}
            />

            <DecisionFactor
              label="Roster balance"
              value={
                filledSlots < 4
                  ? 'Incomplete'
                  : filledSlots < rosterSlots.length
                    ? 'Developing'
                    : 'Complete'
              }
              positive={filledSlots === rosterSlots.length}
            />
          </div>

          <button
            className="clear-roster-button"
            onClick={() => setRoster({})}
          >
            Clear Roster
          </button>
        </article>
      </section>
    </div>
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