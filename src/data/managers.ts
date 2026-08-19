import type { DraftManager } from '../types/draft'
import { generatedManagers } from './managers.generated'

export const draftManagers: DraftManager[] =
  generatedManagers
    .filter(
      (manager) =>
        manager.draftSlot > 0,
    )
    .sort(
      (a, b) =>
        a.draftSlot -
        b.draftSlot,
    )
    .map(
      (manager) => ({
        id:
          manager.draftSlot,

        name:
          manager.name,

        tendency:
          manager.tendency,

        preferredPositions:
          manager.preferredPositions,
      }),
    )