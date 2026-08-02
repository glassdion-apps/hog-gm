import { useState } from 'react'
import './App.css'
import Sidebar from './components/Sidebar'
import Dashboard from './pages/Dashboard'
import BigBoard from './pages/BigBoard'
import WarRoom from './pages/WarRoom'
import MyTeam from './pages/MyTeam'
import Managers from './pages/Managers'
import PlayerEncyclopedia from './pages/PlayerEncyclopedia'


type Page =
  | 'dashboard'
  | 'board'
  | 'warroom'
  | 'team'
  | 'managers'
  | 'encyclopedia'

function App() {
  const [page, setPage] = useState<Page>('dashboard')

  const pageTitles: Record<Page, string> = {
    dashboard: 'Dashboard',
    board: 'Big Board',
    warroom: 'War Room',
    team: 'My Team',
    managers: 'Managers',
    encyclopedia: 'Player Encyclopedia',
  }

  return (
    <div className="app">
      <Sidebar
        currentPage={page}
        onPageChange={(newPage) => setPage(newPage as Page)}
      />

      <main className="main">
        <header className="topbar">
          <div>
            <p className="eyebrow">2026 Draft Command Center</p>
            <h1>{pageTitles[page]}</h1>
          </div>

          <div className="league-badge">
            <span className="status-dot" />
            Honda on Grand
          </div>
        </header>

        {page === 'dashboard' && <Dashboard />}
        {page === 'board' && <BigBoard />}
        {page === 'warroom' && <WarRoom />}
        {page === 'team' && <MyTeam />}
        {page === 'managers' && <Managers />}
        {page === 'encyclopedia' && <PlayerEncyclopedia />}
      </main>
    </div>
  )
}


export default App