import { draftManagers } from '../data/managers'

type ManagersProps = {
  managerRosters: Record<string, string[]>
}

export default function Managers({
  managerRosters,
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
        {draftManagers.map((manager) => (
          <article className="manager-card" key={manager.name}>
            <div>
              <strong>{manager.name}</strong>
              <span>{manager.tendency}</span>

              <div className="manager-roster">
                {(managerRosters[manager.name] ?? []).length === 0 ? (
                  <small>No players drafted yet</small>
                ) : (
                  (managerRosters[manager.name] ?? []).map((playerName) => (
                    <span key={playerName}>{playerName}</span>
                  ))
                )}
              </div>
            </div>

            <div className="manager-meta">
              <div>
                <small>Draft Slot</small>
                <strong>#{manager.id}</strong>
              </div>

              <div>
                <small>Tendency</small>
                <strong>{manager.tendency}</strong>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}