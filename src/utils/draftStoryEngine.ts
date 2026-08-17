import { generateDraftStory } from './draftStory'
import type { DraftStoryEvent } from './draftStory'

type DraftPick = {
    player: string
    manager: string
    pick: number
}

function eventKey(event: DraftStoryEvent) {
    return `${event.type}-${event.title}-${event.description}`
}

export function getNewDraftStoryEvents(
    draftHistory: DraftPick[],
    existingStory: DraftStoryEvent[],
) {
    const generatedStory = generateDraftStory(draftHistory)

    const seen = new Set([
        ...existingStory.map(eventKey),
    ])

    const newEvents: DraftStoryEvent[] = []

    for (const event of generatedStory) {
        const key = eventKey(event)

        if (seen.has(key)) {
            continue
        }

        seen.add(key)
        newEvents.push(event)
    }

    return newEvents
}