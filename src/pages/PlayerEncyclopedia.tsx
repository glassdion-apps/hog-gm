import { useState } from 'react'
import { players } from '../data/players'

export default function PlayerEncyclopedia() {
  const [search, setSearch] = useState('')
  const [selectedPlayerName, setSelectedPlayerName] = useState(
    players[0]?.name ?? '',
  )

  const filteredPlayers = players.filter((player) =>
    player.name.toLowerCase().includes(search.toLowerCase()),
  )

  const selectedPlayer =
    players.find((player) => player.name === selectedPlayerName) ?? players[0]

  return (
    <div className="encyclopedia-page">
      <section className="panel encyclopedia-list-panel">
        <div className="panel-header">
          <div>
            <p className="eyebrow">Player intelligence</p>
            <h3>Player Encyclopedia</h3>
          </div>
        </div>

        <input
          className="encyclopedia-search"
          type="search"
          placeholder="Search players"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />

        <div className="encyclopedia-player-list">
          {filteredPlayers.map((player) => (
            <button
              className={
                selectedPlayer?.name === player.name
                  ? 'encyclopedia-player active'
                  : 'encyclopedia-player'
              }
              key={player.name}
              onClick={() => setSelectedPlayerName(player.name)}
            >
              <span className="position-chip">{player.position}</span>

              <span>
                <strong>{player.name}</strong>
                <small>{player.tier}</small>
              </span>
            </button>
          ))}
        </div>
      </section>

      {selectedPlayer && (
        <section className="panel player-profile">
          <p className="eyebrow">Scouting dossier</p>
          <h2>{selectedPlayer.name}</h2>

          <div className="profile-summary">
            <div>
              <span>Position</span>
              <strong>{selectedPlayer.position}</strong>
            </div>

            <div>
              <span>HOG Rank</span>
              <strong>#{selectedPlayer.rank}</strong>
            </div>

            <div>
              <span>HOG Score</span>
              <strong>{selectedPlayer.score}</strong>
            </div>

            <div>
              <span>Tier</span>
              <strong>{selectedPlayer.tier}</strong>
            </div>
          </div>

          <div className="profile-command">
            <span>Draft Command</span>

            <strong
              className={`command ${selectedPlayer.action
                .toLowerCase()
                .replaceAll(' ', '-')}`}
            >
              {selectedPlayer.action}
            </strong>
          </div>

          <div className="profile-notes">
            <h3>HOG GM Notes</h3>
            <p>
              Full scouting notes, Honda ADP, ceiling, floor, risk, manager
              interest, and draft-window analysis will be added here.
            </p>
          </div>
        </section>
      )}
    </div>
  )
}