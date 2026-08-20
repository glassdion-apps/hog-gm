import { draftManagers } from '../data/managers'
import { auditManagerSimulation } from '../utils/managerSimulationAudit'

type ManagersProps = {
  managerRosters: Record<string, string[]>

  draftHistory: {
    player: string
    manager: string
    pick: number
    hondaPick: string | null
    predictedPick: string | null
    predictionConfidence: number | null
  }[]
  predictedDraftHistory: {
    player: string
    manager: string
    pick: number
  }[]

  hondaDraftHistory: {
    player: string
    manager: string
    pick: number
  }[]
}

export default function Managers({
  managerRosters,
  draftHistory,
  predictedDraftHistory,
  hondaDraftHistory,
}: ManagersProps) {
  return (
    <section className="panel">
      <div className="panel-header">
        <div>
          <p className="eyebrow">Manager intelligence</p>
          <h3>League Tracker</h3>
        </div>
      </div>

      <div className="manager-list">
        {draftManagers.map((manager) => {
          const roster =
            managerRosters[manager.name] ?? []
          const managerHistory =
            draftHistory.filter(
              (pick) =>
                pick.manager === manager.name,
            )

          const predictedRoster =
            predictedDraftHistory
              .filter(
                (pick) =>
                  pick.manager === manager.name,
              )
              .map((pick) => pick.player)

          const hondaRoster =
            hondaDraftHistory
              .filter(
                (pick) =>
                  pick.manager === manager.name,
              )
              .map((pick) => pick.player)
          const audit =
            auditManagerSimulation(
              manager.name,
              roster,
            )

          return (
            <article
              className="manager-card"
              key={manager.name}
            >
              <div>
                <strong>{manager.name}</strong>
                <span>{manager.tendency}</span>

                <div className="manager-roster">
                  {roster.length === 0 ? (
                    <small>
                      No players drafted yet
                    </small>
                  ) : (
                    roster.map((playerName) => (
                      <span key={playerName}>
                        {playerName}
                      </span>
                    ))
                  )}
                </div>
              </div>

              <div className="manager-meta">
                <div>
                  <small>Draft Slot</small>
                  <strong>
                    #{manager.id}
                  </strong>
                </div>

                <div>
                  <small>Tendency</small>
                  <strong>
                    {manager.tendency}
                  </strong>
                </div>

                <div>
                  <small>
                    Historical Fit
                  </small>
                  <strong>
                    {audit.positionFitScore}/100
                  </strong>
                </div>
              </div>

              <div className="manager-audit">
                {audit.positions.map(
                  (position) => (
                    <div
                      className="manager-audit-row"
                      key={position.position}
                    >
                      <strong>
                        {position.position}
                      </strong>

                      <span>
                        Sim{' '}
                        {(position.currentRate * 100).toFixed(0)}%
                      </span>

                      <span>
                        Hist{' '}
                        {(position.historicalRate * 100).toFixed(0)}%
                      </span>
                    </div>
                  ),
                )}
              </div>
              <div className="manager-team-comparison">
                <div className="manager-team-column">
                  <strong>Actual Team</strong>

                  {roster.length === 0 ? (
                    <small>No picks yet</small>
                  ) : (
                    roster.map((playerName, index) => {
                      const pick = draftHistory.find(
                        (entry) =>
                          entry.manager === manager.name &&
                          entry.player === playerName,
                      )

                      const round = pick
                        ? Math.floor((pick.pick - 1) / draftManagers.length) + 1
                        : null

                      const slot = pick
                        ? ((pick.pick - 1) % draftManagers.length) + 1
                        : null

                      return (
                        <span key={`actual-${manager.name}-${index}`}>
                          {round !== null && slot !== null
                            ? `${round}.${String(slot).padStart(2, '0')}  `
                            : ''}
                          {playerName}
                        </span>
                      )
                    })
                  )}
                </div>

                <div className="manager-team-column">
                  <strong>Predicted Team</strong>

                  {predictedRoster.length === 0 ? (
                    <small>No predictions yet</small>
                  ) : (
                    predictedRoster.map((playerName, index) => {
                      const pick = predictedDraftHistory.find(
                        (entry) =>
                          entry.manager === manager.name &&
                          entry.player === playerName,
                      )

                      const round = pick
                        ? Math.floor((pick.pick - 1) / draftManagers.length) + 1
                        : null

                      const slot = pick
                        ? ((pick.pick - 1) % draftManagers.length) + 1
                        : null

                      return (
                        <span key={`predicted-${manager.name}-${index}`}>
                          {round !== null && slot !== null
                            ? `${round}.${String(slot).padStart(2, '0')}  `
                            : ''}
                          {playerName}
                        </span>
                      )
                    })
                  )}
                </div>

                <div className="manager-team-column">
                  <strong>Honda Team</strong>

                  {hondaRoster.length === 0 ? (
                    <small>No Honda picks yet</small>
                  ) : (
                    hondaRoster.map((playerName, index) => {
                      const pick = hondaDraftHistory.find(
                        (entry) =>
                          entry.manager === manager.name &&
                          entry.player === playerName,
                      )

                      const round = pick
                        ? Math.floor((pick.pick - 1) / draftManagers.length) + 1
                        : null

                      const slot = pick
                        ? ((pick.pick - 1) % draftManagers.length) + 1
                        : null

                      return (
                        <span key={`honda-${manager.name}-${index}`}>
                          {round !== null && slot !== null
                            ? `${round}.${String(slot).padStart(2, '0')}  `
                            : ''}
                          {playerName}
                        </span>
                      )
                    })
                  )}
                </div>
              </div>
            </article>
          )
        })}
      </div>
    </section>
  )
}