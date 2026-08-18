import { generatedPlayers } from './generated'
import { kickers } from './kickers'
import { defenses } from './defenses'

export const players = [
  ...generatedPlayers,
  ...kickers,
  ...defenses,
]

export type {
  Player,
  PlayerPosition,
} from './types'