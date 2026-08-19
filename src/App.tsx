import { useEffect, useState } from 'react'
import './App.css'
import Sidebar from './components/Sidebar'
import Dashboard from './pages/Dashboard'
import BigBoard from './pages/BigBoard'
import WarRoom from './pages/WarRoom'
import MyTeam from './pages/MyTeam'
import Managers from './pages/Managers'
import PlayerEncyclopedia from './pages/PlayerEncyclopedia'
import { draftManagers } from './data/managers'
import { getBestPlayerForManager } from './utils/draftAI'
import DraftHub from './pages/DraftHub'
import type { DraftStoryEvent } from './utils/draftStory'
import { getNewDraftStoryEvents } from './utils/draftStoryEngine'

import {
  getActiveDraft,
  getActiveDraftId,
  listDrafts,
  saveDraft,
  createDraft,
  setActiveDraft,
  loadDraft,
  deleteDraft,
  renameDraft,
} from './utils/draftSessionManager'

import type {
  DraftSession,
  DraftSessionIndex,
} from './utils/draftSessionManager'
import {
  getHondaManagerName,
} from './utils/hondaManager'

type Page =
  | 'hub'
  | 'dashboard'
  | 'board'
  | 'warroom'
  | 'team'
  | 'managers'
  | 'encyclopedia'

function App() {
  const savedDraft = getActiveDraft()
  const savedDraftIndex = listDrafts()

  const [page, setPage] = useState<Page>('hub')
  const [selectedPlayerName, setSelectedPlayerName] = useState('')

  const [draftedPlayerNames, setDraftedPlayerNames] = useState<string[]>(
    savedDraft?.draftedPlayerNames ?? [],
  )
  const [draftSessions, setDraftSessions] = useState<DraftSessionIndex[]>(
    savedDraftIndex,
  )
  const [draftStory, setDraftStory] = useState<DraftStoryEvent[]>(
    savedDraft?.draftStory ?? [],
  )
  const [activeDraftId, setActiveDraftId] = useState<string | null>(
    getActiveDraftId(),
  )
  const [draftHistory, setDraftHistory] = useState<
    { player: string; manager: string; pick: number }[]
  >(
    savedDraft?.draftHistory ?? [],
  )
  useEffect(() => {
    if (draftHistory.length === 0) {
      return
    }

    const newEvents = getNewDraftStoryEvents(
      draftHistory,
      draftStory,
    )

    if (newEvents.length === 0) {
      return
    }

    setDraftStory((current) => [
      ...current,
      ...newEvents,
    ])
  }, [draftHistory, draftStory])
  const [managerRosters, setManagerRosters] = useState<
    Record<string, string[]>
  >(
    savedDraft?.managerRosters ?? {},
  )

  const [currentPickIndex, setCurrentPickIndex] = useState(
    savedDraft?.currentPickIndex ?? 0,
  )
  useEffect(() => {
    if (!activeDraftId) {
      return
    }

    const currentSession = getActiveDraft()

    const session: DraftSession = {
      id: activeDraftId,
      name: currentSession?.name ?? 'Untitled Draft',
      updatedAt: new Date().toISOString(),
      currentPickIndex,
      draftHistory,
      draftedPlayerNames,
      managerRosters,
      draftStory,
    }

    saveDraft(session)

    setDraftSessions(listDrafts())
  }, [
    activeDraftId,
    currentPickIndex,
    draftHistory,
    draftedPlayerNames,
    managerRosters,
    draftStory,
  ])

  const pageTitles: Record<Page, string> = {
    hub: 'Draft Hub',
    dashboard: 'Dashboard',
    board: 'Big Board',
    warroom: 'War Room',
    team: 'My Team',
    managers: 'Managers',
    encyclopedia: 'Player Encyclopedia',
  }

  function removeDraft(id: string) {
    const draft = draftSessions.find(
      (item) => item.id === id,
    )

    if (!draft) {
      return
    }

    const confirmed = window.confirm(
      `Delete "${draft.name}"? This cannot be undone.`,
    )

    if (!confirmed) {
      return
    }

    deleteDraft(id)

    const remainingDrafts = listDrafts()
    setDraftSessions(remainingDrafts)

    if (activeDraftId === id) {
      setActiveDraftId(null)

      setDraftedPlayerNames([])
      setDraftHistory([])
      setManagerRosters({})
      setCurrentPickIndex(0)
      setDraftStory([])
    }
  }

  function renameSavedDraft(id: string) {
    const draft = draftSessions.find(
      (item) => item.id === id,
    )

    if (!draft) {
      return
    }

    const newName = window.prompt(
      'Rename draft',
      draft.name,
    )

    if (!newName || newName.trim() === '') {
      return
    }

    renameDraft(id, newName.trim())
    setDraftSessions(listDrafts())
  }

  function startNewDraft() {
    const defaultName = `Mock Draft #${draftSessions.length + 1}`

    const draftName = window.prompt(
      'Name this draft',
      defaultName,
    )

    if (!draftName || draftName.trim() === '') {
      return
    }

    const newSession = createDraft(
      draftName.trim(),
    )

    setActiveDraftId(newSession.id)
    setActiveDraft(newSession.id)

    setDraftedPlayerNames([])
    setDraftHistory([])
    setManagerRosters({})
    setCurrentPickIndex(0)
    setDraftStory([])
    setDraftSessions(listDrafts())

    setPage('warroom')
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

    setManagerRosters((current) => ({
      ...current,
      [currentManager.name]: [
        ...(current[currentManager.name] ?? []),
        playerName,
      ],
    }))

    setCurrentPickIndex((current) => current + 1)
  }
  function simulateNextPick() {
    const currentManager =
      draftManagers[currentPickIndex % draftManagers.length]

    const player = getBestPlayerForManager(
      currentManager,
      draftedPlayerNames,
    )

    if (!player) {
      return
    }

    draftPlayer(player.name)
  }
  function openPlayer(playerName: string) {
    setSelectedPlayerName(playerName)
    setPage('encyclopedia')
  }
  function openDraft(id: string) {
    const session = loadDraft(id)

    if (!session) {
      return
    }

    setActiveDraftId(id)
    setActiveDraft(id)

    setDraftedPlayerNames(session.draftedPlayerNames)
    setDraftHistory(session.draftHistory)
    setManagerRosters(session.managerRosters)
    setCurrentPickIndex(session.currentPickIndex)
    setDraftStory(session.draftStory ?? [])
    setPage('warroom')
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
        {page === 'hub' && (
          <DraftHub
            draftSessions={draftSessions}
            activeDraftId={activeDraftId}
            onOpenDraft={openDraft}
            onNewDraft={startNewDraft}
            onDeleteDraft={removeDraft}
            onRenameDraft={renameSavedDraft}

          />
        )}

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
            onSimulateNextPick={simulateNextPick}
            managerRosters={managerRosters}
            draftStory={draftStory}
          />
        )}
        {page === 'team' && (
          <MyTeam
            draftedPlayerNames={
              managerRosters[
              getHondaManagerName() ?? ''
              ] ?? []
            }
          />
        )}
        {page === 'managers' && (
          <Managers managerRosters={managerRosters} />
        )}

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