import type { Slot } from '../art/wardrobe'
import type { ChallengeId } from '../challenges/challengeIds'
import type { Level } from '../challenges/levels'

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
  | { type: 'levelCompleted'; challenge: ChallengeId; level: Level }
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
 * The wardrobe (Tasks 10 and 14), in the order items are handed out: a round gives at
 * most one new item, so when several are earned at once the first one in this list
 * comes now and the others in the next rounds. Rarity follows the time it takes to earn
 * (PRD §10): common in the first session, uncommon in the first few, rare in about a
 * week of play, epic in several weeks, legendary for long-term goals. High tiers are
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
    unlock: { type: 'levelCompleted', challenge: 'findLetter', level: 1 },
    hint: 'Klara Hitta bokstaven så får du den blå tröjan.',
  },
  {
    id: 'green-trousers',
    name: 'Gröna byxor',
    slot: 'bottoms',
    indefinite: 'gröna byxor',
    rarity: 1,
    unlock: { type: 'levelCompleted', challenge: 'firstLetter', level: 1 },
    hint: 'Klara Första bokstaven så får du de gröna byxorna.',
  },
  {
    id: 'beanie',
    name: 'Mössa',
    slot: 'head',
    indefinite: 'en mössa',
    rarity: 1,
    unlock: { type: 'levelCompleted', challenge: 'wordPicture', level: 1 },
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
  {
    id: 'red-cap',
    name: 'Röd keps',
    slot: 'head',
    indefinite: 'en röd keps',
    rarity: 1,
    unlock: { type: 'roundsCompleted', count: 5 },
    hint: 'Klara fem rundor så får du den röda kepsen.',
  },
  {
    id: 'yellow-sweater',
    name: 'Gul tröja',
    slot: 'top',
    indefinite: 'en gul tröja',
    rarity: 1,
    unlock: { type: 'roundsCompleted', count: 7 },
    hint: 'Klara sju rundor så får du den gula tröjan.',
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
    unlock: { type: 'levelCompleted', challenge: 'findLetter', level: 2 },
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
    unlock: { type: 'levelCompleted', challenge: 'firstLetter', level: 2 },
    hint: 'Klara den svåra nivån i Första bokstaven så får du ballongen.',
  },
  {
    id: 'pink-sweater',
    name: 'Rosa tröja',
    slot: 'top',
    indefinite: 'en rosa tröja',
    rarity: 2,
    unlock: { type: 'roundsCompleted', count: 12 },
    hint: 'Klara tolv rundor så får du den rosa tröjan.',
  },
  {
    id: 'green-cap',
    name: 'Grön keps',
    slot: 'head',
    indefinite: 'en grön keps',
    rarity: 2,
    unlock: { type: 'playerLevel', level: 4 },
    hint: 'Nå nivå fyra så får du den gröna kepsen.',
  },
  {
    id: 'party-hat',
    name: 'Partyhatt',
    slot: 'head',
    indefinite: 'en partyhatt',
    rarity: 2,
    unlock: { type: 'playerLevel', level: 5 },
    hint: 'Nå nivå fem så får du partyhatten.',
  },
  {
    id: 'blue-balloon',
    name: 'Blå ballong',
    slot: 'held',
    indefinite: 'en blå ballong',
    rarity: 2,
    unlock: { type: 'roundsCompleted', count: 15 },
    hint: 'Klara femton rundor så får du den blå ballongen.',
  },
  {
    id: 'red-trousers',
    name: 'Röda byxor',
    slot: 'bottoms',
    indefinite: 'röda byxor',
    rarity: 2,
    unlock: { type: 'roundsCompleted', count: 18 },
    hint: 'Klara arton rundor så får du de röda byxorna.',
  },
  {
    id: 'sunflower',
    name: 'Solros',
    slot: 'held',
    indefinite: 'en solros',
    rarity: 2,
    unlock: { type: 'roundsCompleted', count: 20 },
    hint: 'Klara tjugo rundor så får du solrosen.',
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
    id: 'green-cape',
    name: 'Grön mantel',
    slot: 'back',
    indefinite: 'en grön mantel',
    rarity: 3,
    unlock: { type: 'roundsCompleted', count: 30 },
    hint: 'Klara trettio rundor så får du den gröna manteln.',
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
  {
    id: 'viking-helmet',
    name: 'Vikingahjälm',
    slot: 'head',
    indefinite: 'en vikingahjälm',
    rarity: 3,
    unlock: { type: 'playerLevel', level: 8 },
    hint: 'Nå nivå åtta så får du vikingahjälmen.',
  },
  {
    id: 'green-striped-sweater',
    name: 'Grönrandig tröja',
    slot: 'top',
    indefinite: 'en grönrandig tröja',
    rarity: 3,
    unlock: { type: 'roundsCompleted', count: 40 },
    hint: 'Klara fyrtio rundor så får du den grönrandiga tröjan.',
  },
  {
    id: 'red-backpack',
    name: 'Röd ryggsäck',
    slot: 'back',
    indefinite: 'en röd ryggsäck',
    rarity: 3,
    unlock: { type: 'roundsCompleted', count: 45 },
    hint: 'Klara fyrtiofem rundor så får du den röda ryggsäcken.',
  },
  {
    id: 'yellow-trousers',
    name: 'Gula byxor',
    slot: 'bottoms',
    indefinite: 'gula byxor',
    rarity: 3,
    unlock: { type: 'roundsCompleted', count: 50 },
    hint: 'Klara femtio rundor så får du de gula byxorna.',
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
  {
    id: 'pirate-hat',
    name: 'Pirathatt',
    slot: 'head',
    indefinite: 'en pirathatt',
    rarity: 4,
    unlock: { type: 'roundsCompleted', count: 65 },
    hint: 'Klara sextiofem rundor så får du pirathatten.',
  },
  {
    id: 'butterfly-wings',
    name: 'Fjärilsvingar',
    slot: 'back',
    indefinite: 'fjärilsvingar',
    rarity: 4,
    unlock: { type: 'roundsCompleted', count: 80 },
    hint: 'Klara åttio rundor så får du fjärilsvingarna.',
  },
  {
    id: 'chef-hat',
    name: 'Kockmössa',
    slot: 'head',
    indefinite: 'en kockmössa',
    rarity: 4,
    unlock: { type: 'roundsCompleted', count: 90 },
    hint: 'Klara nittio rundor så får du kockmössan.',
  },
  {
    id: 'star-trousers',
    name: 'Stjärnbyxor',
    slot: 'bottoms',
    indefinite: 'stjärnbyxor',
    rarity: 4,
    unlock: { type: 'mastered', challenge: 'wordPicture', box: 5 },
    hint: 'Lär dig alla orden i Ord och bild så får du stjärnbyxorna.',
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
  {
    id: 'gold-wings',
    name: 'Guldvingar',
    slot: 'back',
    indefinite: 'guldvingar',
    rarity: 5,
    unlock: { type: 'playerLevel', level: 13 },
    hint: 'Nå nivå tretton så får du guldvingarna.',
  },
  {
    id: 'rainbow-cape',
    name: 'Regnbågsmantel',
    slot: 'back',
    indefinite: 'en regnbågsmantel',
    rarity: 5,
    unlock: { type: 'roundsCompleted', count: 150 },
    hint: 'Klara hundrafemtio rundor så får du regnbågsmanteln.',
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
