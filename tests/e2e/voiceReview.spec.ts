import { spokenTexts } from '../../src/speech/catalogue'
import { clipFileName } from '../../src/speech/clipName'
import type { Approvals } from '../../src/speech/review/approvals'
import { expect, test } from './fixtures'

// The review page saves through the dev server; here the endpoint is faked, so tests never touch approvals.json.
test('the voice review page plays clips and saves good and wrong, with a note', async ({ page }) => {
  let approvals: Approvals = { clips: {} }
  const requests: unknown[] = []
  await page.route('**/__voice-review', async (route) => {
    if (route.request().method() === 'POST') {
      const body = route.request().postDataJSON() as { file: string; status: string; note?: string }
      requests.push(body)
      const text = spokenTexts().find((candidate) => clipFileName(candidate) === body.file) ?? ''
      const clips = { ...approvals.clips }
      if (body.status === 'unreviewed') delete clips[body.file]
      else clips[body.file] = { text, status: body.status as 'approved', note: body.note, reviewedAt: 'now' }
      approvals = { clips }
    }
    await route.fulfill({ json: approvals })
  })

  await page.goto('/?review=voices')
  const total = spokenTexts().length
  await expect(page.getByText(`${total} clips: 0 good, 0 wrong, ${total} to review`)).toBeVisible()

  const welcome = 'Tryck på en skylt för att spela!'
  const play = page.getByRole('button', { name: `Play: ${welcome}` })
  await play.click()
  await expect(play).toHaveText('■') // playing

  // Good: saved, the row leaves the "to review" list, and the next clip plays.
  await page.keyboard.press('a')
  await expect(page.getByText(`${total} clips: 1 good, 0 wrong, ${total - 1} to review`)).toBeVisible()
  expect(requests[0]).toEqual({ file: clipFileName(welcome), status: 'approved' })

  // Wrong, with a note saying what's wrong.
  await page.keyboard.press('r')
  const note = page.getByPlaceholder("What's wrong? e.g. säger öka")
  await expect(note).toBeFocused()
  await note.fill('låter konstigt')
  await note.press('Enter')
  await expect(page.getByText(`${total} clips: 1 good, 1 wrong, ${total - 2} to review`)).toBeVisible()
  expect(requests.at(-1)).toMatchObject({ status: 'rejected', note: 'låter konstigt' })

  // The wrong clip is listed under "Wrong" with its note, ready to be fixed.
  await page.getByRole('group', { name: 'Show' }).getByRole('button', { name: 'Wrong' }).click()
  await expect(page.getByRole('textbox')).toHaveValue('låter konstigt')
})
