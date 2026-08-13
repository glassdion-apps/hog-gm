import { useState } from 'react'
import './App.css'
import Sidebar from './components/Sidebar'
import Dashboard from './pages/Dashboard'
import BigBoard from './pages/BigBoard'
import WarRoom from './pages/WarRoom'
import MyTeam from './pages/MyTeam'
import Managers from './pages/Managers'
import PlayerEncyclopedia from './pages/PlayerEncyclopedia'
import { draftManagers } from './data/managers'

type Page =
  | 'dashboard'
  | 'board'
  | 'warroom'
  | 'team'
  | 'managers'
  | 'encyclopedia'

function App() {
  const [page, setPage] = useState<Page>('dashboard')
  const [selectedPlayerName, setSelectedPlayerName] = useState('')
  const [draftedPlayerNames, setDraftedPlayerNames] = useState<string[]>([])
  const [draftHistory, setDraftHistory] = useState<
    { player: string; manager: string; pick: number }[]
  >([])
  const [currentPickIndex, setCurrentPickIndex] = useState(0)

  const pageTitles: Record<Page, string> = {
    dashboard: 'Dashboard',
    board: 'Big Board',
    warroom: 'War Room',
    team: 'My Team',
    managers: 'Managers',
    encyclopedia: 'Player Encyclopedia',
  }

  function draftPlayer(playerName: string) {
    if (draftedPlayerNames.includes(playerName)) {
      return
    }

    const currentManager =
      draftManagers[currentPickIndex % draftManagers.length]

    setDraftedPlayerNames((current) => [
      ...current,
      playerName,
    ])

    setDraftHistory((current) => [
      ...current,
      {
        player: playerName,
        manager: currentManager.name,
        pick: currentPickIndex + 1,
      },
    ])

    setCurrentPickIndex((current) => current + 1)
  }

  function openPlayer(playerName: string) {
    setSelectedPlayerName(playerName)
    setPage('encyclopedia')
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

        {page === 'dashboard' && (
          <Dashboard
            draftedPlayerNames={draftedPlayerNames}
            onSelectPlayer={openPlayer}
          />
        )}

        {page === 'board' && (
          <BigBoard
            draftedPlayerNames={draftedPlayerNames}
            onDraftPlayer={draftPlayer}
            onSelectPlayer={openPlayer}
          />
        )}

        {page === 'warroom' && (
          <WarRoom
            currentPickIndex={currentPickIndex}
            draftHistory={draftHistory}
            draftedPlayerNames={draftedPlayerNames}
            onDraftPlayer={draftPlayer}
          />
        )}
        {page === 'team' && <MyTeam />}
        {page === 'managers' && <Managers />}

        {page === 'encyclopedia' && (
          <PlayerEncyclopedia
            initialSelectedPlayerName={selectedPlayerName}
          />
        )}
      </main>
    </div>
  )
}

export default App