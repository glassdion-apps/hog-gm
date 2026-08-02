const managers = [
  {
    name: "Jimmy's Johnson",
    tendency: 'Running back early',
    likelyNeed: 'RB',
    snipeRisk: 'High',
  },
  {
    name: 'Kentucky Dave',
    tendency: 'Wide receiver heavy',
    likelyNeed: 'WR',
    snipeRisk: 'Medium',
  },
  {
    name: 'Papi',
    tendency: 'Targets elite tight ends',
    likelyNeed: 'TE',
    snipeRisk: 'High',
  },
  {
    name: 'EL JEFE',
    tendency: 'Quarterback aggressive',
    likelyNeed: 'QB',
    snipeRisk: 'Medium',
  },
]

export default function Managers() {
  return (
    <section className="panel">
      <div className="panel-header">
        <div>
          <p className="eyebrow">Manager intelligence</p>
          <h3>League Tracker</h3>
        </div>
      </div>

      <div className="manager-list">
        {managers.map((manager) => (
          <article className="manager-card" key={manager.name}>
            <div>
              <strong>{manager.name}</strong>
              <span>{manager.tendency}</span>
            </div>

            <div className="manager-meta">
              <div>
                <small>Likely Need</small>
                <strong>{manager.likelyNeed}</strong>
              </div>

              <div>
                <small>Snipe Risk</small>
                <strong>{manager.snipeRisk}</strong>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}