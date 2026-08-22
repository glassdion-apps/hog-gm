import { useState } from 'react'
import { getTierPressureScore } from '../utils/hondaWaitRisk'

type DashboardProps = {
  draftedPlayerNames: string[]
  currentPickIndex: number
  currentManagerName: string
  onSelectPlayer: (playerName: string) => void
  onDraftPlayer: (playerName: string) => void
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
  currentPickIndex,
  currentManagerName,
  onSelectPlayer,
  onDraftPlayer,
}: DashboardProps) {


  const availablePlayers = players.filter(
    (player) => !draftedPlayerNames.includes(player.name),
  )
  const recommendation = availablePlayers[0]

  const [dashboardSelectedPlayerName, setDashboardSelectedPlayerName] =
    useState('')

  const dashboardSelectedPlayer =
    availablePlayers.find(
      (player) =>
        player.name === dashboardSelectedPlayerName,
    ) ?? recommendation

  const tierPressureScore =
    dashboardSelectedPlayer
      ? getTierPressureScore(dashboardSelectedPlayer)
      : 0

  const tierPressureLabel =
    tierPressureScore >= 30
      ? 'High'
      : tierPressureScore >= 15
        ? 'Medium'
        : 'Low'

  const round =
    Math.floor(currentPickIndex / 12) + 1

  const pickInRound =
    (currentPickIndex % 12) + 1

  const pickLabel =
    `${round}.${String(pickInRound).padStart(2, '0')}`
  return (
    <>
      <section className="hero">
        <div>
          <p className="eyebrow light">
            On the clock · {currentManagerName} · {pickLabel} · Overall {currentPickIndex + 1}
          </p>

          <h2>{dashboardSelectedPlayer?.name ?? 'Draft Complete'}</h2>

          <p className="hero-text">
            {dashboardSelectedPlayer
              ? dashboardSelectedPlayer.xFactor
              : 'No available players remain on the board.'}
          </p>

        </div>
        <div className="recommendation">
          <span>Recommendation</span>
          <strong>{dashboardSelectedPlayer?.action ?? 'DONE'}</strong>
          <small>
            {dashboardSelectedPlayer
              ? `${Math.round(dashboardSelectedPlayer.score)}% confidence`
              : 'All players drafted'}
          </small>

          {dashboardSelectedPlayer && (
            <button
              className="dashboard-view-player-button"
              onClick={() =>
                onSelectPlayer(dashboardSelectedPlayer.name)
              }
            >
              View Player
            </button>
          )}

        </div>
      </section>

      <section className="metrics">
        <Metric
          label="Honda Edge"
          value={
            dashboardSelectedPlayer
              ? `${currentPickIndex + 1 - dashboardSelectedPlayer.hondaAdpOverall >= 0 ? '+' : ''}${currentPickIndex + 1 - dashboardSelectedPlayer.hondaAdpOverall}`
              : '—'
          }
          detail={
            dashboardSelectedPlayer
              ? currentPickIndex + 1 - dashboardSelectedPlayer.hondaAdpOverall > 0
                ? `${currentPickIndex + 1 - dashboardSelectedPlayer.hondaAdpOverall} picks past Honda value`
                : currentPickIndex + 1 - dashboardSelectedPlayer.hondaAdpOverall < 0
                  ? `${Math.abs(
                    currentPickIndex + 1 - dashboardSelectedPlayer.hondaAdpOverall,
                  )} picks ahead of Honda value`
                  : 'At Honda value'
              : 'No player selected'
          }
        />
        <Metric
          label="Tier Pressure"
          value={tierPressureLabel}
          detail={
            dashboardSelectedPlayer
              ? `${dashboardSelectedPlayer.tier} · pressure score ${tierPressureScore}`
              : 'No player selected'
          }
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
            <div
              className="player-row dashboard-player-button dashboard-player-row"
              key={player.name}
            >
              <button
                className="dashboard-player-open"
                onClick={() => setDashboardSelectedPlayerName(player.name)}
              >
                <div className="player-position">
                  {player.position}
                </div>

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

              <button
                className="dashboard-draft-button"
                onClick={() => onDraftPlayer(player.name)}
              >
                Draft
              </button>
            </div>
          ))}
        </div>
      </section>
    </>
  )
}