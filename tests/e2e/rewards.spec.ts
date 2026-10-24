import type { Page } from '@playwright/test'
import type { ChoiceRound } from '../../src/challenges/choiceQuestion'
import { createFindLetterRound } from '../../src/challenges/findLetter/createRound'
import { confusableLetters, letters } from '../../src/content/letters'
import { boxOf, practiceKey, recordPractice } from '../../src/learning/mastery'
import { backupStore, databaseName, profileStore } from '../../src/persistence/database'
import { expect, test } from './fixtures'
import { SEED, answerKey, enterMap, press, tapPlayer, tapStation, waitForQuestion } from './helpers'

/** Hitta bokstaven (Mata draken): feeds the dragon the right cookie of every question with the keyboard. */
async function playRoundByKeyboard(page: Page, round: ChoiceRound) {
  for (const [index, question] of round.questions.entries()) {
    await waitForQuestion(page, index, round.questions.length, 15_000)
    await page.keyboard.press(answerKey(question.choices, question.target))
  }
  await expect(page.getByRole('heading', { name: 'Bra jobbat!' })).toBeVisible({ timeout: 15_000 })
}

/** The worn hat in the save on the device, read straight from IndexedDB. */
function savedWornItem(page: Page) {
  return page.evaluate(
    ({ name, store }) =>
      new Promise<string | null>((resolve, reject) => {
        const open = indexedDB.open(name)
        open.onerror = () => reject(open.error)
        open.onsuccess = () => {
          const read = open.result.transaction(store).objectStore(store).get('default')
          read.onsuccess = () => {
            open.result.close()
            resolve((read.result as { progress?: { worn?: { head?: string } } } | undefined)?.progress?.worn?.head ?? null)
          }
        }
      }),
    { name: databaseName, store: profileStore },
  )
}

// Mata draken rounds take a while: each cookie flies to the dragon, which chews.
test.slow()

const easyRound = createFindLetterRound({ seed: SEED, letters, confusables: confusableLetters, difficulty: 'easy' })
// The hard round comes after the easy one, so it favours letters the easy round didn't practise (src/learning).
const afterEasy = recordPractice({}, 'findLetter', easyRound.questions.map((q) => ({ item: q.target, firstTry: true })))
const hardRound = createFindLetterRound({
  seed: SEED,
  letters,
  confusables: confusableLetters,
  difficulty: 'hard',
  practiceBox: (id) => boxOf(afterEasy, practiceKey('findLetter', id)),
})

test('a new item is marked on the map; tapping the character opens Mina saker, where it can be worn', async ({ page, hasTouch }) => {
  await enterMap(page, hasTouch)
  await expect(page.getByRole('img', { name: 'Nivå 1' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Mina saker', exact: true })).toBeVisible()

  await tapStation(page, 'findLetter', hasTouch)
  await expect(page.getByRole('img', { name: 'Lätt nivå' })).toBeVisible()
  await playRoundByKeyboard(page, easyRound)
  await expect(page.getByRole('button', { name: 'Ny sak: Keps, ta på' })).toBeVisible()
  await press(page.getByRole('button', { name: 'Till kartan' }), hasTouch)

  // Not worn yet, so the map's button says there is something new; the child taps their own character.
  await expect(page.getByRole('button', { name: 'Mina saker, nya saker' })).toBeVisible()
  await tapPlayer(page, hasTouch)
  const cap = page.getByRole('button', { name: 'Keps, Vanlig, ny', exact: true })
  await expect(cap).toHaveAttribute('aria-pressed', 'false')
  // Each row shows the child's own things, then only the next one to earn (it says how), not every locked item.
  await expect(page.getByRole('button', { name: 'Mössa, Vanlig, låst' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Krona, Legendarisk, låst' })).toHaveCount(0)

  await press(cap, hasTouch)
  await expect(cap).toHaveAttribute('aria-pressed', 'true')
  await press(page.getByRole('button', { name: 'Till kartan' }), hasTouch)
  await expect.poll(() => page.evaluate(() => window.__larrutanHub?.outfit().head)).toBe('cap')
  await expect(page.getByRole('button', { name: 'Mina saker', exact: true })).toBeVisible()
})

test('a round without slips makes the next one hard, and says so; items come at most every other round', async ({ page, hasTouch }) => {
  await enterMap(page, hasTouch)
  await tapStation(page, 'findLetter', hasTouch)
  await playRoundByKeyboard(page, easyRound)
  // The new item is put on right where it was earned.
  await press(page.getByRole('button', { name: 'Ny sak: Keps, ta på' }), hasTouch)
  await expect(page.getByRole('button', { name: 'Ny sak: Keps, på' })).toBeDisabled()
  // No slips: the station says it gets harder next time, and it does.
  await expect(page.getByRole('img', { name: 'Nästa gång: svårare' })).toBeVisible()
  await press(page.getByRole('button', { name: 'Till kartan' }), hasTouch)
  await expect.poll(() => page.evaluate(() => window.__larrutanHub?.outfit().head)).toBe('cap')
  // Worn from the reward screen: nothing is new any more.
  await expect(page.getByRole('button', { name: 'Mina saker', exact: true })).toBeVisible()

  await tapStation(page, 'findLetter', hasTouch)
  await expect(page.getByRole('img', { name: 'Svår nivå' })).toBeVisible()
  await playRoundByKeyboard(page, hardRound)
  // The blue sweater and the striped one are earned by now, but the second round gives nothing.
  await expect(page.getByRole('button', { name: /^Ny sak/ })).toHaveCount(0)
})

test('progress is saved on the device and survives a reload', async ({ page, hasTouch }) => {
  await enterMap(page, hasTouch)
  await tapStation(page, 'findLetter', hasTouch)
  await playRoundByKeyboard(page, easyRound)
  await press(page.getByRole('button', { name: 'Till kartan' }), hasTouch)
  await press(page.getByRole('button', { name: 'Mina saker' }), hasTouch)
  await press(page.getByRole('button', { name: 'Keps, Vanlig, ny', exact: true }), hasTouch)
  // Saving takes a moment; reloading in the same instant could beat it.
  await expect.poll(() => savedWornItem(page)).toBe('cap')

  await page.reload()
  await enterMap(page, hasTouch)
  await expect(page.getByRole('img', { name: 'Nivå 1' })).toBeVisible()
  await expect.poll(() => page.evaluate(() => window.__larrutanHub?.outfit().head)).toBe('cap')
  // The level is remembered too: the sign now opens the hard level.
  await tapStation(page, 'findLetter', hasTouch)
  await expect(page.getByRole('img', { name: 'Svår nivå' })).toBeVisible()
})

test('a broken save is repaired and kept as a backup, and the game still starts', async ({ page, hasTouch }) => {
  await enterMap(page, hasTouch)
  const broken = {
    version: 1,
    savedAt: 'yesterday',
    progress: { xp: 'lots', roundsCompleted: 1, completedLevels: ['findLetter:easy'], unlockedItems: ['cap', 'dragon'], wornItem: 'cap' },
  }
  await page.evaluate(
    ({ name, store, save }) =>
      new Promise<void>((resolve, reject) => {
        const open = indexedDB.open(name)
        open.onerror = () => reject(open.error)
        open.onsuccess = () => {
          const transaction = open.result.transaction(store, 'readwrite')
          transaction.objectStore(store).put(save, 'default')
          transaction.oncomplete = () => {
            open.result.close()
            resolve()
          }
        }
      }),
    { name: databaseName, store: profileStore, save: broken },
  )

  // enterMap opens the page again, which loads (and repairs) the broken save exactly once.
  await enterMap(page, hasTouch)
  await expect(page.getByRole('img', { name: 'Nivå 1' })).toBeVisible()
  await expect.poll(() => page.evaluate(() => window.__larrutanHub?.outfit().head)).toBe('cap')
  const backups = await page.evaluate(
    ({ name, store }) =>
      new Promise<number>((resolve, reject) => {
        const open = indexedDB.open(name)
        open.onerror = () => reject(open.error)
        open.onsuccess = () => {
          const count = open.result.transaction(store).objectStore(store).count()
          count.onsuccess = () => resolve(count.result)
        }
      }),
    { name: databaseName, store: backupStore },
  )
  expect(backups).toBe(1)
})
