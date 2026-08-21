import { useState } from 'react'
import { players } from '../data/players'

type PlayerEncyclopediaProps = {
  initialSelectedPlayerName?: string
  draftedPlayerNames: string[]
  onDraftPlayer: (playerName: string) => void
}

export default function PlayerEncyclopedia({
  initialSelectedPlayerName = '',
  draftedPlayerNames,
  onDraftPlayer,
}: PlayerEncyclopediaProps) {

  const [search, setSearch] = useState('')

  const [selectedPlayerName, setSelectedPlayerName] = useState(
    initialSelectedPlayerName || players[0]?.name || '',
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

          <p className="player-team">
            {selectedPlayer.team} · {selectedPlayer.position}
          </p>

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

          <div className="profile-details-grid">
            <section className="profile-section">
              <h3>Draft Intelligence</h3>

              <div className="detail-row">
                <span>Honda ADP</span>
                <strong>{selectedPlayer.hondaAdp}</strong>
              </div>

              <div className="detail-row">
                <span>Public ADP</span>
                <strong>{selectedPlayer.publicAdp}</strong>
              </div>

              <div className="detail-row">
                <span>Floor</span>
                <strong>{selectedPlayer.floor}</strong>
              </div>

              <div className="detail-row">
                <span>Ceiling</span>
                <strong>{selectedPlayer.ceiling}</strong>
              </div>

              <div className="detail-row">
                <span>Risk</span>
                <strong>{selectedPlayer.risk}</strong>
              </div>
            </section>

            <section className="profile-section">
              <h3>Green Flags</h3>

              <ul className="flag-list green-flags">
                {selectedPlayer.greenFlags.map((flag) => (
                  <li key={flag}>{flag}</li>
                ))}
              </ul>
            </section>

            <section className="profile-section">
              <h3>Red Flags</h3>

              <ul className="flag-list red-flags">
                {selectedPlayer.redFlags.map((flag) => (
                  <li key={flag}>{flag}</li>
                ))}
              </ul>
            </section>
          </div>

          <div className="x-factor-card">
            <span>HOG X-Factor</span>
            <strong>{selectedPlayer.xFactor}</strong>
          </div>

          <div className="profile-command">
            <div>
              <span>Draft Command</span>

              <strong
                className={`command ${selectedPlayer.action
                  .toLowerCase()
                  .replaceAll(' ', '-')}`}
              >
                {selectedPlayer.action}
              </strong>
            </div>

            <button
              className="profile-draft-button"
              disabled={draftedPlayerNames.includes(
                selectedPlayer.name,
              )}
              onClick={() =>
                onDraftPlayer(selectedPlayer.name)
              }
            >
              {draftedPlayerNames.includes(
                selectedPlayer.name,
              )
                ? 'Drafted'
                : `Draft ${selectedPlayer.name}`}
            </button>
          </div>

          <div className="profile-notes">
            <h3>HOG GM Notes</h3>

            <p>
              Full scouting notes, manager interest, and draft-window analysis
              will be added here.
            </p>
          </div>
        </section>
      )}
    </div>
  )
}