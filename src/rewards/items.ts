import type { Slot } from '../art/wardrobe'
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
  /** Everything a challenge practises (its letters or words) is at least in this mastery box (src/learning). */
  | { type: 'mastered'; challenge: ChallengeId; box: number }

export interface Item {
  id: string
  /** For adults, tests and accessibility. */
  name: string
  /** Where it is worn; one item per slot. The art is in src/art/wardrobe.ts. */
  slot: Slot
  /** For "Du fick en keps!". */
  indefinite: string
  rarity: Rarity
  unlock: UnlockCondition
  /** Spoken when the child taps the item while it is still locked. */
  hint: string
}

/**
 * The wardrobe (Task 10). Rarity follows the time it takes to earn (PRD §10):
 * common in the first session, uncommon in the first few, rare in about a week
 * of play, epic in several weeks, legendary for long-term goals. High tiers are
 * never random, bought, or dependent on error-free play: bragging items.
 */
export const items: readonly Item[] = [
  // Vanlig: the first session.
  {
    id: 'cap',
    name: 'Keps',
    slot: 'head',
    indefinite: 'en keps',
    rarity: 1,
    unlock: { type: 'roundsCompleted', count: 1 },
    hint: 'Klara en runda så får du kepsen.',
  },
  {
    id: 'blue-sweater',
    name: 'Blå tröja',
    slot: 'top',
    indefinite: 'en blå tröja',
    rarity: 1,
    unlock: { type: 'levelCompleted', challenge: 'findLetter', difficulty: 'easy' },
    hint: 'Klara Hitta bokstaven så får du den blå tröjan.',
  },
  {
    id: 'green-trousers',
    name: 'Gröna byxor',
    slot: 'bottoms',
    indefinite: 'gröna byxor',
    rarity: 1,
    unlock: { type: 'levelCompleted', challenge: 'firstLetter', difficulty: 'easy' },
    hint: 'Klara Första bokstaven så får du de gröna byxorna.',
  },
  {
    id: 'beanie',
    name: 'Mössa',
    slot: 'head',
    indefinite: 'en mössa',
    rarity: 1,
    unlock: { type: 'levelCompleted', challenge: 'wordPicture', difficulty: 'easy' },
    hint: 'Klara Ord och bild så får du mössan.',
  },
  {
    id: 'flower',
    name: 'Blomma',
    slot: 'held',
    indefinite: 'en blomma',
    rarity: 1,
    unlock: { type: 'roundsCompleted', count: 3 },
    hint: 'Klara tre rundor så får du blomman.',
  },
  // Ovanlig: the first few sessions.
  {
    id: 'bow',
    name: 'Rosett',
    slot: 'head',
    indefinite: 'en rosett',
    rarity: 2,
    unlock: { type: 'playerLevel', level: 3 },
    hint: 'Nå nivå tre så får du rosetten.',
  },
  {
    id: 'striped-sweater',
    name: 'Randig tröja',
    slot: 'top',
    indefinite: 'en randig tröja',
    rarity: 2,
    unlock: { type: 'levelCompleted', challenge: 'findLetter', difficulty: 'hard' },
    hint: 'Klara den svåra nivån i Hitta bokstaven så får du den randiga tröjan.',
  },
  {
    id: 'backpack',
    name: 'Ryggsäck',
    slot: 'back',
    indefinite: 'en ryggsäck',
    rarity: 2,
    unlock: { type: 'roundsCompleted', count: 10 },
    hint: 'Klara tio rundor så får du ryggsäcken.',
  },
  {
    id: 'balloon',
    name: 'Ballong',
    slot: 'held',
    indefinite: 'en ballong',
    rarity: 2,
    unlock: { type: 'levelCompleted', challenge: 'firstLetter', difficulty: 'hard' },
    hint: 'Klara den svåra nivån i Första bokstaven så får du ballongen.',
  },
  // Sällsynt: about a week.
  {
    id: 'top-hat',
    name: 'Hög hatt',
    slot: 'head',
    indefinite: 'en hög hatt',
    rarity: 3,
    unlock: { type: 'playerLevel', level: 6 },
    hint: 'Nå nivå sex så får du hatten.',
  },
  {
    id: 'cape',
    name: 'Mantel',
    slot: 'back',
    indefinite: 'en mantel',
    rarity: 3,
    unlock: { type: 'roundsCompleted', count: 25 },
    hint: 'Klara tjugofem rundor så får du manteln.',
  },
  {
    id: 'star-sweater',
    name: 'Stjärntröja',
    slot: 'top',
    indefinite: 'en stjärntröja',
    rarity: 3,
    unlock: { type: 'playerLevel', level: 7 },
    hint: 'Nå nivå sju så får du stjärntröjan.',
  },
  {
    id: 'wand',
    name: 'Trollstav',
    slot: 'held',
    indefinite: 'en trollstav',
    rarity: 3,
    unlock: { type: 'roundsCompleted', count: 35 },
    hint: 'Klara trettiofem rundor så får du trollstaven.',
  },
  // Episk: several weeks.
  {
    id: 'graduation-cap',
    name: 'Studentmössa',
    slot: 'head',
    indefinite: 'en studentmössa',
    rarity: 4,
    unlock: { type: 'playerLevel', level: 9 },
    hint: 'Nå nivå nio så får du studentmössan.',
  },
  {
    id: 'wings',
    name: 'Vingar',
    slot: 'back',
    indefinite: 'vingar',
    rarity: 4,
    unlock: { type: 'roundsCompleted', count: 60 },
    hint: 'Klara sextio rundor så får du vingarna.',
  },
  {
    id: 'rainbow-trousers',
    name: 'Regnbågsbyxor',
    slot: 'bottoms',
    indefinite: 'regnbågsbyxor',
    rarity: 4,
    unlock: { type: 'mastered', challenge: 'findLetter', box: 5 },
    hint: 'Lär dig alla bokstäverna i Hitta bokstaven så får du regnbågsbyxorna.',
  },
  // Legendarisk: long-term goals.
  {
    id: 'crown',
    name: 'Krona',
    slot: 'head',
    indefinite: 'en krona',
    rarity: 5,
    unlock: { type: 'playerLevel', level: 10 },
    hint: 'Nå nivå tio så får du kronan.',
  },
  {
    id: 'golden-cape',
    name: 'Guldmantel',
    slot: 'back',
    indefinite: 'en guldmantel',
    rarity: 5,
    unlock: { type: 'mastered', challenge: 'firstLetter', box: 5 },
    hint: 'Lär dig vilken bokstav alla orden börjar på så får du guldmanteln.',
  },
]

const itemsById = new Map(items.map((item) => [item.id, item]))

export function getItem(id: string): Item {
  const item = itemsById.get(id)
  if (!item) throw new Error(`Unknown item id "${id}"`)
  return item
}

export function findItem(id: string): Item | undefined {
  return itemsById.get(id)
}
