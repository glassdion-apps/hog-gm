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
}

export default function Managers({
  managerRosters,
  draftHistory,
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
            managerHistory
              .map((pick) => pick.predictedPick)
              .filter(
                (playerName): playerName is string =>
                  playerName !== null,
              )

          const hondaRoster =
            managerHistory
              .map((pick) => pick.hondaPick)
              .filter(
                (playerName): playerName is string =>
                  playerName !== null,
              )
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
                    roster.map((playerName, index) => (
                      <span key={`actual-${manager.name}-${index}`}>
                        {playerName}
                      </span>
                    ))
                  )}
                </div>

                <div className="manager-team-column">
                  <strong>Predicted Team</strong>

                  {predictedRoster.length === 0 ? (
                    <small>No predictions yet</small>
                  ) : (
                    predictedRoster.map((playerName, index) => (
                      <span key={`predicted-${manager.name}-${index}`}>
                        {playerName}
                      </span>
                    ))
                  )}
                </div>

                <div className="manager-team-column">
                  <strong>Honda Team</strong>

                  {hondaRoster.length === 0 ? (
                    <small>No Honda picks yet</small>
                  ) : (
                    hondaRoster.map((playerName, index) => (
                      <span key={`honda-${manager.name}-${index}`}>
                        {playerName}
                      </span>
                    ))
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