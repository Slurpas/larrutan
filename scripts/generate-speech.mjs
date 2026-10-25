// Generates an MP3 for every sentence in src/speech/catalogue.ts, with the engine of `speechVoice`
// (src/speech/voiceSettings.ts). Each clip is made once and kept: a later run only makes clips that
// don't exist yet.
//
//   npm run speech                  new sentences, and any whose pronunciation or voice changed (both are
//                                   part of the file name, src/speech/clipName.ts)
//   npm run speech -- --all         regenerate everything
//   npm run speech -- --samples     the voice trial: a few game sentences in each voice of `trialPiperVoices`
//                                   and `trialVoices` (ElevenLabs), next to the current voice, in
//                                   voice-samples/index.html (--voices "A,B" and --model try other ElevenLabs voices)
//   npm run speech -- --list-voices the ElevenLabs voices this account can use, and the credits left
//
// Piper needs its venv and voice in .tools/ (see README). ElevenLabs needs ELEVENLABS_API_KEY in .env and
// never spends more than --max-credits (the trial: 1000 unless told otherwise; making the game's clips:
// required) or than the month has left. Both need ffmpeg on PATH (or FFMPEG=path).

import { execFileSync } from 'node:child_process'
import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createServer } from 'vite'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const audioDir = path.join(root, 'src/speech/audio/sv')
const silencePath = path.join(root, 'src/speech/audio/silence.mp3')
const approvalsPath = path.join(audioDir, 'approvals.json')
const samplesDir = path.join(root, 'voice-samples')
const python = path.join(root, process.platform === 'win32' ? '.tools/piper-venv/Scripts/python.exe' : '.tools/piper-venv/bin/python')
const ffmpeg = process.env.FFMPEG ?? 'ffmpeg'
const args = process.argv.slice(2)
const regenerateAll = args.includes('--all')
/** The value after a flag, e.g. `--max-credits 500`. */
const option = (name) => (args.includes(name) ? args[args.indexOf(name) + 1] : undefined)
const maxCredits = option('--max-credits') === undefined ? undefined : Number(option('--max-credits'))

// Load the catalogue through Vite, so TypeScript and extensionless imports just work.
const server = await createServer({ appType: 'custom', logLevel: 'error', server: { middlewareMode: true, hmr: false } })
const { spokenTexts } = await server.ssrLoadModule('/src/speech/catalogue.ts')
const { clipFileName } = await server.ssrLoadModule('/src/speech/clipName.ts')
const { elevenLabsInput, pauseMark, pronunciations, speechInput } = await server.ssrLoadModule('/src/content/pronunciation.ts')
const { speechVoice, trialPiperVoices, trialSettings, trialVoices } = await server.ssrLoadModule('/src/speech/voiceSettings.ts')
const { countReviews, noApprovals, pruneApprovals } = await server.ssrLoadModule('/src/speech/review/approvals.ts')
const elevenLabs = await server.ssrLoadModule('/scripts/elevenLabs.ts')
await server.close()

// Trim silence at both ends (keeping a little lead-in), even out loudness, and compress: the same for every engine.
const filters = [
  'silenceremove=start_periods=1:start_threshold=-50dB:start_silence=0.06',
  'areverse',
  'silenceremove=start_periods=1:start_threshold=-50dB:start_silence=0.12',
  'areverse',
  'loudnorm=I=-16:TP=-1.5:LRA=11',
].join(',')
const finish = (source, target) =>
  execFileSync(ffmpeg, ['-y', '-loglevel', 'error', '-i', source, '-af', filters, '-ar', '24000', '-ac', '1', '-b:a', '48k', target])

const work = path.join(tmpdir(), `larrutan-speech-${Date.now()}`)
mkdirSync(work, { recursive: true })

if (args.includes('--list-voices') || args.includes('--samples')) {
  try {
    if (args.includes('--list-voices')) await listVoices(elevenLabsKey())
    else await makeSamples(optionalElevenLabsKey())
  } catch (error) {
    if (error instanceof elevenLabs.ElevenLabsError) stop(error.message)
    throw error
  }
  rmSync(work, { recursive: true, force: true })
  // No process.exit here: exiting while fetch still holds a connection trips a Node assertion on Windows.
} else {
  await generateClips()
}

/** The game's clips: every sentence of the catalogue that has no clip yet. */
async function generateClips() {
  const isElevenLabs = speechVoice.engine === 'ElevenLabs'
  if (!isElevenLabs) checkPiper(speechVoice)

  // What the engine is asked to say: the sentence with its pauses, and for Piper its fixed pronunciations.
  const inputOf = (text) => (isElevenLabs ? elevenLabsInput(text, speechVoice.pauseSeconds, speechVoice.model) : speechInput(text))
  const clips = spokenTexts().map((text) => ({ text, file: clipFileName(text), input: inputOf(text) }))
  mkdirSync(audioDir, { recursive: true })

  // A clip whose sentence, pronunciation or voice changed has a new file name, so only missing files are generated.
  const manifestPath = path.join(audioDir, 'clips.json')
  const todo = clips.filter((clip) => regenerateAll || !existsSync(path.join(audioDir, clip.file)))
  console.log(`${clips.length} sentences, ${todo.length} to generate`)

  if (todo.length > 0) {
    if (isElevenLabs) await generateWithElevenLabs(todo)
    else generateWithPiper(todo)
  }

  // A tiny silent clip, played inside the first tap so iPad Safari allows audio afterwards.
  if (!existsSync(silencePath)) {
    execFileSync(ffmpeg, ['-y', '-loglevel', 'error', '-f', 'lavfi', '-i', 'anullsrc=r=24000:cl=mono', '-t', '0.1', '-b:a', '32k', silencePath])
  }

  // Remove clips for sentences the game no longer says.
  const wanted = new Set(clips.map((clip) => clip.file))
  for (const file of readdirSync(audioDir)) {
    if (file.endsWith('.mp3') && !wanted.has(file)) {
      rmSync(path.join(audioDir, file))
      console.log(`removed unused ${file}`)
    }
  }

  // What was generated with what, for review and licence records.
  writeFileSync(manifestPath, `${JSON.stringify({ ...speechVoice, clips }, null, 2)}\n`, 'utf8')
  rmSync(work, { recursive: true, force: true })
  console.log(`done: ${clips.length} clips in ${path.relative(root, audioDir)}`)

  // Approvals of clips that changed or disappeared no longer apply (PRD §7: review on ?review=voices).
  const approvals = pruneApprovals(existsSync(approvalsPath) ? JSON.parse(readFileSync(approvalsPath, 'utf8')) : noApprovals, wanted)
  writeFileSync(approvalsPath, `${JSON.stringify(approvals, null, 2)}\n`, 'utf8')
  const counts = countReviews([...wanted], approvals)
  console.log(`review: ${counts.approved} approved, ${counts.rejected} rejected, ${counts.unreviewed} not reviewed yet (open the game with ?review=voices)`)
  for (const [file, review] of Object.entries(approvals.clips)) {
    if (review.status === 'rejected') console.log(`  rejected: ${JSON.stringify(review.text)}${review.note ? ` (${review.note})` : ''} ${file}`)
  }
}

// --- Piper -------------------------------------------------------------------------------------

function piperModel(voice) {
  return path.join(root, `.tools/piper-voices/${voice.voice}.onnx`)
}

function checkPiper(voice) {
  for (const [what, file] of [['Piper venv', python], ['Piper voice', piperModel(voice)]]) {
    if (!existsSync(file)) stop(`Missing ${what}: ${file}\nSee "Generating speech" in README.md.`)
  }
  // Every symbol in a pronunciation fix must be one the voice knows, or it would be silently dropped.
  const knownSymbols = new Set(Object.keys(JSON.parse(readFileSync(`${piperModel(voice)}.json`, 'utf8')).phoneme_id_map))
  for (const [word, ipa] of Object.entries(pronunciations)) {
    const unknown = [...ipa].filter((symbol) => !knownSymbols.has(symbol))
    if (unknown.length > 0) stop(`Pronunciation of "${word}" uses symbols the voice doesn't know: ${unknown.join(' ')}`)
  }
}

function generateWithPiper(todo) {
  sayWithPiper(
    todo.map((clip) => ({ input: clip.input, target: path.join(audioDir, clip.file) })),
    speechVoice,
  )
}

/** Says each item's `input` with a Piper voice and keeps it as an MP3 at its `target`. */
function sayWithPiper(items, voice) {
  // A clip with pause marks is said in parts, joined with a short silence (Piper won't pause mid-sentence).
  const parts = items.map((item, i) =>
    item.input.split(pauseMark).map((text, p) => ({ text: text.trim(), wav: path.join(work, `${i}-${p}.wav`) })),
  )
  const jobsPath = path.join(work, 'jobs.json')
  writeFileSync(jobsPath, JSON.stringify(parts.flat()), 'utf8')
  execFileSync(python, [path.join(root, 'scripts/piper_batch.py'), piperModel(voice), jobsPath, String(voice.lengthScale)], {
    stdio: 'inherit',
    env: { ...process.env, PYTHONIOENCODING: 'utf-8' },
  })

  const pause = path.join(work, 'pause.wav')
  execFileSync(ffmpeg, ['-y', '-loglevel', 'error', '-f', 'lavfi', '-i', 'anullsrc=r=22050:cl=mono', '-t', String(voice.pauseSeconds), '-c:a', 'pcm_s16le', pause])
  for (const [i, item] of items.entries()) {
    let source = parts[i][0].wav
    if (parts[i].length > 1) {
      const list = path.join(work, `${i}.txt`)
      const files = parts[i].flatMap((part, p) => (p === 0 ? [part.wav] : [pause, part.wav]))
      writeFileSync(list, files.map((file) => `file '${file.replace(/\\/g, '/')}'`).join('\n'), 'utf8')
      source = path.join(work, `${i}.wav`)
      execFileSync(ffmpeg, ['-y', '-loglevel', 'error', '-f', 'concat', '-safe', '0', '-i', list, '-c', 'copy', source])
    }
    finish(source, item.target)
  }
}

// --- ElevenLabs --------------------------------------------------------------------------------

async function generateWithElevenLabs(todo) {
  const key = elevenLabsKey()
  const needed = elevenLabs.creditsFor(
    todo.map((clip) => clip.input),
    speechVoice.model,
  )
  const credits = await readCredits(key)
  const problem = elevenLabs.budgetProblem(needed, credits?.left ?? null, maxCredits)
  if (problem) stop(problem)
  const { voiceId, model, speed, stability, similarity } = speechVoice
  for (const [i, clip] of todo.entries()) {
    // Each clip is kept as soon as it is made: if the run stops, the next one makes only the rest.
    const raw = path.join(work, `${i}.mp3`)
    writeFileSync(raw, await elevenLabs.withRetries(() => elevenLabs.synthesize(key, { voiceId, model, speed, stability, similarity }, clip.input, seedOf(clip.file))))
    finish(raw, path.join(audioDir, clip.file))
    console.log(`  ${i + 1}/${todo.length} ${clip.text}`)
  }
  await readCredits(key)
}

/** The hash in a clip's file name, as a number: the same clip asks ElevenLabs for the same take. */
function seedOf(file) {
  return Number.parseInt(file.slice(-12, -4), 16)
}

function optionalElevenLabsKey() {
  const dotenvPath = path.join(root, '.env')
  return elevenLabs.readApiKey(existsSync(dotenvPath) ? readFileSync(dotenvPath, 'utf8') : undefined, process.env)
}

function elevenLabsKey() {
  const key = optionalElevenLabsKey()
  if (!key) {
    stop(
      'No ELEVENLABS_API_KEY in .env. Make a free account at elevenlabs.io, create an API key and add the line\n' +
        '  ELEVENLABS_API_KEY=your-key\n' +
        'to .env (git ignores it). See "Trying ElevenLabs" in README.md.',
    )
  }
  return key
}

/** The account's voices, or ElevenLabs' own by ID when the key may only make speech (which is fine). */
async function accountVoicesOrDefaults(key) {
  try {
    return await elevenLabs.accountVoices(key)
  } catch (error) {
    if (!(error instanceof elevenLabs.ElevenLabsError) || (error.status !== 401 && error.status !== 403)) throw error
    console.warn(`The key may not list this account's voices (${error.message}). Using ElevenLabs' own voices by ID.`)
    return elevenLabs.defaultVoices
  }
}

/** Credits left, or null if the key may not read them (then only --max-credits limits the run). */
async function readCredits(key) {
  try {
    const credits = await elevenLabs.creditsLeft(key)
    const renewed = credits.resetsAt ? `, renewed ${credits.resetsAt.toISOString().slice(0, 10)}` : ''
    console.log(`ElevenLabs: ${credits.left} credits left this month${renewed}`)
    return credits
  } catch (error) {
    if (!(error instanceof elevenLabs.ElevenLabsError) || (error.status !== 401 && error.status !== 403)) throw error
    console.warn(`Can't read the credits left (${error.message}). Only --max-credits limits this run.`)
    return null
  }
}

async function listVoices(key) {
  const voices = await accountVoicesOrDefaults(key)
  console.log(`${voices.length} voices this account can use:`)
  for (const voice of voices) {
    console.log(`  ${voice.name}  (${voice.category}${voice.accent ? `, ${voice.accent} accent` : ''})  ${voice.id}`)
  }
  await readCredits(key)
}

/** The trial: the same game sentences in each voice, next to the current voice's clips, on one page. */
async function makeSamples(key) {
  const sentences = elevenLabs.trialSentences()
  const said = new Set(spokenTexts())
  const missing = sentences.filter((text) => !said.has(text))
  if (missing.length > 0) stop(`Not game sentences, so there is nothing to compare them with: ${missing.join(' | ')}`)

  const piper = piperSamples(sentences)
  const eleven = key ? await elevenLabsSamples(key, sentences) : []
  if (!key) console.warn('No ELEVENLABS_API_KEY in .env: only the Piper voices were tried.')
  // The current voice plays straight from the game's clips.
  const current = { label: `${readableName(speechVoice)} (now)`, files: sentences.map((text) => `../src/speech/audio/sv/${clipFileName(text)}`) }
  writeFileSync(path.join(samplesDir, 'index.html'), samplesPage(sentences, [current, ...piper, ...eleven]), 'utf8')
  console.log(`Listen at http://localhost:5173/voice-samples/index.html (or open voice-samples/index.html).`)
}

/** Piper's other voices: free and offline, so they are simply made, with the game's pronunciation fixes, and kept. */
function piperSamples(sentences) {
  return trialPiperVoices.map((voice) => {
    checkPiper(voice)
    const inputs = sentences.map((text) => speechInput(text))
    const files = inputs.map((input) => `${elevenLabs.slug(voice.label)}/${elevenLabs.sampleName([voice.voice, voice.lengthScale, voice.pauseSeconds, input])}`)
    const todo = inputs.map((input, i) => ({ input, target: path.join(samplesDir, files[i]) })).filter((item) => !existsSync(item.target))
    for (const item of todo) mkdirSync(path.dirname(item.target), { recursive: true })
    if (todo.length > 0) sayWithPiper(todo, voice)
    console.log(`  ${voice.label}: done`)
    return { label: voice.label, files }
  })
}

/** ElevenLabs voices, within the credits allowed; each clip is kept, so a voice tried before costs nothing again. */
async function elevenLabsSamples(key, sentences) {
  const wanted = option('--voices')
    ? option('--voices')
        .split(',')
        .map((name) => ({ label: name.trim(), name: name.trim(), model: option('--model') ?? 'eleven_multilingual_v2' }))
    : trialVoices
  // A voice given by ID (one made with Voice Design) needs no look-up, so a speech-only key is enough.
  const voices = wanted.every((trial) => trial.voiceId) ? [] : await accountVoicesOrDefaults(key)
  const columns = []
  for (const trial of wanted) {
    const voiceId = trial.voiceId ?? elevenLabs.findVoice(voices, trial.name)?.id
    if (voiceId) columns.push({ ...trial, voiceId })
    else console.warn(`No voice called "${trial.name}" on this account: skipped (npm run speech -- --list-voices shows them all).`)
  }

  // Each trial clip is kept under a name made from what shapes it: a voice tried before costs nothing again.
  const { speed, stability, similarity } = trialSettings
  const planned = columns.map((column) => {
    const voice = { voiceId: column.voiceId, model: column.model, speed, stability, similarity }
    const inputs = sentences.map((text) => elevenLabsInput(text, trialSettings.pauseSeconds, column.model))
    const files = inputs.map((input) => `${elevenLabs.slug(column.label)}/${elevenLabs.elevenLabsSampleName(voice, input)}`)
    return { ...column, voice, inputs, files }
  })
  const needed = planned.reduce(
    (sum, column) => sum + elevenLabs.creditsFor(column.inputs.filter((_, i) => !existsSync(path.join(samplesDir, column.files[i]))), column.model),
    0,
  )
  if (needed > 0) {
    const credits = await readCredits(key)
    const problem = elevenLabs.budgetProblem(needed, credits?.left ?? null, maxCredits ?? 1000)
    if (problem) stop(problem)
  }
  console.log(`${columns.length} voices with ${sentences.length} sentences each: ${needed > 0 ? `about ${needed} credits for the clips not made before` : 'all made before, nothing to pay'}.`)

  const done = []
  for (const column of planned) {
    try {
      for (const [i, input] of column.inputs.entries()) {
        const target = path.join(samplesDir, column.files[i])
        if (!existsSync(target)) {
          mkdirSync(path.dirname(target), { recursive: true })
          const raw = path.join(work, 'sample.mp3')
          writeFileSync(raw, await elevenLabs.withRetries(() => elevenLabs.synthesize(key, column.voice, input, i + 1)))
          finish(raw, target)
        }
        if (i === 0) done.push(column)
      }
      console.log(`  ${column.label}: done`)
    } catch (error) {
      // A voice refused on its first sentence can't be used by this account (nothing was spent on it): try the next.
      if (!(error instanceof elevenLabs.ElevenLabsError) || done.includes(column)) throw error
      console.warn(`  ${column.label}: skipped (${error.message})`)
    }
  }
  if (needed > 0) await readCredits(key)
  return done
}

/** "sv_SE-alma-medium" → "Alma"; an ElevenLabs voice already has a name. */
function readableName(voice) {
  if (voice.engine === 'ElevenLabs') return voice.voice
  const name = voice.voice.replace(/^[a-z]{2}_[A-Z]{2}-/, '').replace(/-(x_low|low|medium|high)$/, '')
  return name.charAt(0).toUpperCase() + name.slice(1)
}

function samplesPage(sentences, columns) {
  const escape = (text) => text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  const header = columns.map((column) => `<th>${escape(column.label)}</th>`).join('')
  const rows = sentences
    .map((text, i) => {
      const cells = columns.map((column) => `<td><audio controls preload="none" src="${column.files[i]}"></audio></td>`).join('')
      return `<tr><td>${escape(text)}</td>${cells}</tr>`
    })
    .join('\n')
  return `<!doctype html>
<html lang="en">
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Voice trial</title>
<style>
  body { margin: 2rem; font-family: system-ui, sans-serif; background: #eef6fc; color: #2b4a6b; }
  table { border-collapse: collapse; }
  th, td { padding: 0.4rem 0.6rem; border-bottom: 1px solid #c9d6e3; text-align: left; }
  audio { width: 190px; }
</style>
<h1>Voice trial</h1>
<p>The same game sentences in each voice. Which one sounds best for a child of 5–7: clear, Swedish, friendly?
The ElevenLabs voices are from elevenlabs.io (free plan: non-commercial use, with credit to elevenlabs.io).</p>
<table>
<tr><th>Sentence</th>${header}</tr>
${rows}
</table>
</html>
`
}

function stop(message) {
  console.error(message)
  rmSync(work, { recursive: true, force: true })
  process.exit(1)
}
