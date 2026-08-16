type SidebarProps = {
  currentPage: string
  onPageChange: (page: string) => void
}

const links = [
  ['hub', 'Draft Hub'],
  ['dashboard', 'Dashboard'],
  ['board', 'Big Board'],
  ['warroom', 'War Room'],
  ['team', 'My Team'],
  ['managers', 'Managers'],
  ['encyclopedia', 'Player Encyclopedia'],
]

export default function Sidebar({
  currentPage,
  onPageChange,
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