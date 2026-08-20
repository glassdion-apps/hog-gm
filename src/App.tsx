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
import { getManagerPrediction } from './utils/managerPrediction'
import { getHondaDecision } from './utils/hondaDecisionEngine'
import DraftHub from './pages/DraftHub'
import type { DraftStoryEvent } from './utils/draftStory'
import { getNewDraftStoryEvents } from './utils/draftStoryEngine'
import { players } from './data/players'

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
    {
      player: string
      manager: string
      pick: number
      hondaPick: string | null
      predictedPick: string | null
      predictionConfidence: number | null
    }[]
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
    const totalDraftPicks = draftManagers.length * 15

    if (currentPickIndex >= totalDraftPicks) {
      return
    }

    if (draftedPlayerNames.includes(playerName)) {
      return
    }

    const roundIndex = Math.floor(currentPickIndex / draftManagers.length)
    const positionInRound = currentPickIndex % draftManagers.length

    const managerIndex =
      roundIndex % 2 === 0
        ? positionInRound
        : draftManagers.length - 1 - positionInRound

    const currentManager = draftManagers[managerIndex]
    const currentManagerRoster =
      managerRosters[currentManager.name] ?? []

    const currentManagerRosterCounts = {
      QB: 0,
      RB: 0,
      WR: 0,
      TE: 0,
    }

    for (const playerName of currentManagerRoster) {
      const rosterPlayer = players.find(
        (player) => player.name === playerName,
      )

      if (
        rosterPlayer?.position === 'QB' ||
        rosterPlayer?.position === 'RB' ||
        rosterPlayer?.position === 'WR' ||
        rosterPlayer?.position === 'TE'
      ) {
        currentManagerRosterCounts[
          rosterPlayer.position
        ] += 1
      }
    }

    const hondaDecision =
      getHondaDecision(
        draftedPlayerNames,
        currentPickIndex,
        currentManagerRosterCounts,
        currentManagerRoster,
      )

    const currentPrediction =
      currentManager.name !== 'GiveMeYourMoneyNow'
        ? getManagerPrediction(
          currentManager,
          currentManagerRoster,
          draftedPlayerNames,
          {
            round: roundIndex + 1,
            pickInRound: positionInRound + 1,
            overallPick: currentPickIndex + 1,
          },
        )
        : null
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
        hondaPick:
          hondaDecision?.player.name ?? null,
        predictedPick:
          currentPrediction?.players[0]?.name ?? null,
        predictionConfidence:
          currentPrediction?.confidence ?? null,
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
    const roundIndex =
      Math.floor(
        currentPickIndex /
        draftManagers.length,
      )

    const positionInRound =
      currentPickIndex %
      draftManagers.length

    const managerIndex =
      roundIndex % 2 === 0
        ? positionInRound
        : draftManagers.length -
        1 -
        positionInRound

    const currentManager =
      draftManagers[managerIndex]

    const prediction = getManagerPrediction(
      currentManager,
      managerRosters[currentManager.name] ?? [],
      draftedPlayerNames,
      {
        round: Math.floor(currentPickIndex / draftManagers.length) + 1,
        pickInRound: positionInRound + 1,
        overallPick: currentPickIndex + 1,
      },
    )

    const player = prediction?.players[0]

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
          <Managers
            managerRosters={managerRosters}
            draftHistory={draftHistory}
          />
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