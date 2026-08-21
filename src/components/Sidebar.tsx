type SidebarProps = {
  currentPage: string
  onPageChange: (page: string) => void
  activeDraftName: string | null
  currentPickIndex: number
}

const links = [
  ['hub', 'Draft Hub'],
  ['dashboard', 'Dashboard'],
  ['board', 'Big Board'],
  ['warroom', 'War Room'],
  ['team', 'My Team'],
  ['managers', 'Managers'],
  ['results', 'Draft Results'],
  ['encyclopedia', 'Player Encyclopedia'],
]

export default function Sidebar({
  currentPage,
  onPageChange,
  activeDraftName,
  currentPickIndex,
}: SidebarProps) {
  return (
    <aside className="sidebar">
      <div className="brand">
        <div className="brand-logo">H</div>

        <div>
          <strong>HOG GM</strong>
          <span>Honda on Grand</span>
        </div>
      </div>
      {activeDraftName && (
        <div className="sidebar-active-draft">
          <span>Active Draft</span>

          <strong>
            {activeDraftName}
          </strong>

          <small>
            Pick {currentPickIndex + 1}
          </small>
        </div>
      )}
      <nav>
        {links.map(([page, label]) => (
          <button
            key={page}
            className={currentPage === page ? 'active' : ''}
            onClick={() => onPageChange(page)}
          >
            {label}
          </button>
        ))}
      </nav>
    </aside>
  )
}