import { useState } from 'react'
import { players } from '../data/players'

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

export default function MyTeam() {
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

          <small>
            {filledSlots} of {rosterSlots.length} starters filled
          </small>
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