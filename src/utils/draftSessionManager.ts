import type { DraftStoryEvent } from './draftStory'

export type DraftSession = {
    id: string
    name: string
    updatedAt: string
    currentPickIndex: number

    draftHistory: {
        player: string
        manager: string
        pick: number

        hondaPick: string | null
        predictedPick: string | null
        predictionConfidence: number | null
    }[]

    draftedPlayerNames: string[]

    managerRosters: Record<string, string[]>

    draftStory: DraftStoryEvent[]
}

export type DraftSessionIndex = {
    id: string
    name: string
    updatedAt: string
    currentPickIndex: number
}

const DRAFT_INDEX_KEY = 'hog-gm-drafts'
const ACTIVE_DRAFT_KEY = 'hog-gm-active-draft-id'

function getDraftKey(id: string) {
    return `hog-gm-draft-${id}`
}

export function listDrafts(): DraftSessionIndex[] {
    const saved = localStorage.getItem(DRAFT_INDEX_KEY)

    if (!saved) {
        return []
    }

    try {
        const drafts = JSON.parse(saved) as DraftSessionIndex[]

        return drafts.sort(
            (a, b) =>
                new Date(b.updatedAt).getTime() -
                new Date(a.updatedAt).getTime(),
        )
    } catch {
        return []
    }
}

export function loadDraft(id: string): DraftSession | null {
    const saved = localStorage.getItem(getDraftKey(id))

    if (!saved) {
        return null
    }

    try {
        return JSON.parse(saved) as DraftSession
    } catch {
        return null
    }
}

export function getActiveDraftId(): string | null {
    return localStorage.getItem(ACTIVE_DRAFT_KEY)
}

export function getActiveDraft(): DraftSession | null {
    const activeId = getActiveDraftId()

    if (!activeId) {
        return null
    }

    return loadDraft(activeId)
}

export function setActiveDraft(id: string) {
    localStorage.setItem(ACTIVE_DRAFT_KEY, id)
}

export function saveDraft(session: DraftSession) {
    const updatedSession: DraftSession = {
        ...session,
        updatedAt: new Date().toISOString(),
    }

    localStorage.setItem(
        getDraftKey(session.id),
        JSON.stringify(updatedSession),
    )

    const currentIndex = listDrafts()

    const indexEntry: DraftSessionIndex = {
        id: updatedSession.id,
        name: updatedSession.name,
        updatedAt: updatedSession.updatedAt,
        currentPickIndex: updatedSession.currentPickIndex,
    }

    const existingIndex = currentIndex.findIndex(
        (draft) => draft.id === updatedSession.id,
    )

    if (existingIndex >= 0) {
        currentIndex[existingIndex] = indexEntry
    } else {
        currentIndex.push(indexEntry)
    }

    localStorage.setItem(
        DRAFT_INDEX_KEY,
        JSON.stringify(currentIndex),
    )
}

export function createDraft(name: string): DraftSession {
    const id = crypto.randomUUID()

    const session: DraftSession = {
        id,
        name,
        updatedAt: new Date().toISOString(),
        currentPickIndex: 0,
        draftHistory: [],
        draftedPlayerNames: [],
        managerRosters: {},
        draftStory: [],
    }

    saveDraft(session)
    setActiveDraft(id)

    return session
}

export function deleteDraft(id: string) {
    localStorage.removeItem(getDraftKey(id))

    const updatedIndex = listDrafts().filter(
        (draft) => draft.id !== id,
    )

    localStorage.setItem(
        DRAFT_INDEX_KEY,
        JSON.stringify(updatedIndex),
    )

    if (getActiveDraftId() === id) {
        localStorage.removeItem(ACTIVE_DRAFT_KEY)
    }
}

export function renameDraft(
    id: string,
    newName: string,
): DraftSession | null {
    const session = loadDraft(id)

    if (!session) {
        return null
    }

    const renamedSession: DraftSession = {
        ...session,
        name: newName,
    }

    saveDraft(renamedSession)

    return renamedSession
}