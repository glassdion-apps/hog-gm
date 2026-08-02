import { useState } from 'react'
import { players } from '../data/players'

export default function BigBoard() {const [search, setSearch] = useState('')
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