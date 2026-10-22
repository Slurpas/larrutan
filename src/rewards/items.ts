import type { ChallengeId } from '../challenges/challengeIds'
import type { Difficulty } from '../challenges/difficulty'

/** 1 = Vanlig … 5 = Legendarisk. Cosmetic only, shown as stars plus colour (PRD §10). */
export type Rarity = 1 | 2 | 3 | 4 | 5

export const rarityNames: Record<Rarity, string> = {
  1: 'Vanlig',
  2: 'Ovanlig',
  3: 'Sällsynt',
  4: 'Episk',
  5: 'Legendarisk',
}

export type UnlockCondition =
  | { type: 'roundsCompleted'; count: number }
  | { type: 'playerLevel'; level: number }
  | { type: 'levelCompleted'; challenge: ChallengeId; difficulty: Difficulty }
  | { type: 'everyChallengeCompleted' }

export interface Item {
  id: string
  /** For adults, tests and accessibility. */
  name: string
  /** Placeholder picture until Phase 2 art. */
  emoji: string
  /** For "Du fick en keps!". */
  indefinite: string
  rarity: Rarity
  unlock: UnlockCondition
  /** Spoken when the child taps the item while it is still locked. */
  hint: string
}

/**
 * Phase 1 placeholder hats, one per rarity. High tiers take real effort and are
 * never random, bought, or dependent on error-free play: bragging items.
 */
export const items: readonly Item[] = [
  {
    id: 'cap',
    name: 'Keps',
    emoji: '🧢',
    indefinite: 'en keps',
    rarity: 1,
    unlock: { type: 'roundsCompleted', count: 1 },
    hint: 'Klara en runda så får du kepsen.',
  },
  {
    id: 'bow',
    name: 'Rosett',
    emoji: '🎀',
    indefinite: 'en rosett',
    rarity: 2,
    unlock: { type: 'playerLevel', level: 2 },
    hint: 'Gå upp en nivå så får du rosetten.',
  },
  {
    id: 'top-hat',
    name: 'Hög hatt',
    emoji: '🎩',
    indefinite: 'en hög hatt',
    rarity: 3,
    unlock: { type: 'levelCompleted', challenge: 'findLetter', difficulty: 'hard' },
    hint: 'Klara den svåra nivån i Hitta bokstaven så får du hatten.',
  },
  {
    id: 'graduation-cap',
    name: 'Studentmössa',
    emoji: '🎓',
    indefinite: 'en studentmössa',
    rarity: 4,
    unlock: { type: 'everyChallengeCompleted' },
    hint: 'Klara alla tre skyltarna så får du studentmössan.',
  },
  {
    id: 'crown',
    name: 'Krona',
    emoji: '👑',
    indefinite: 'en krona',
    rarity: 5,
    unlock: { type: 'playerLevel', level: 5 },
    hint: 'Nå nivå fem så får du kronan.',
  },
]

const itemsById = new Map(items.map((item) => [item.id, item]))

export function getItem(id: string): Item {
  const item = itemsById.get(id)
  if (!item) throw new Error(`Unknown item id "${id}"`)
  return item
}
