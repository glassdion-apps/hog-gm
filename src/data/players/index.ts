import { qbs } from './qbs'
import { rbs } from './rbs'
import { wrs } from './wrs'
import { tes } from './tes'
import { kickers } from './kickers'
import { defenses } from './defenses'

export const players = [
  ...rbs,
  ...wrs,
  ...qbs,
  ...tes,
  ...kickers,
  ...defenses,
]

export type {
  Player,
  PlayerPosition,
} from './types'