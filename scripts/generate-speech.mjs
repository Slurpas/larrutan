// Generates an MP3 for every sentence in src/speech/catalogue.ts.
//
//   npm run speech           clips that don't exist yet: new sentences, and any whose pronunciation or
//                            voice changed (both are part of the file name, src/speech/clipName.ts)
//   npm run speech -- --all  regenerate everything
//
// Needs: the Piper venv and voice in .tools/ (see README), and ffmpeg on PATH (or FFMPEG=path).

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
const python = path.join(root, process.platform === 'win32' ? '.tools/piper-venv/Scripts/python.exe' : '.tools/piper-venv/bin/python')
const ffmpeg = process.env.FFMPEG ?? 'ffmpeg'
const regenerateAll = process.argv.includes('--all')

// Load the catalogue through Vite, so TypeScript and extensionless imports just work.
const server = await createServer({ appType: 'custom', logLevel: 'error', server: { middlewareMode: true, hmr: false } })
const { spokenTexts } = await server.ssrLoadModule('/src/speech/catalogue.ts')
const { clipFileName } = await server.ssrLoadModule('/src/speech/clipName.ts')
const { pronunciations, withPronunciations } = await server.ssrLoadModule('/src/content/pronunciation.ts')
const { speechVoice } = await server.ssrLoadModule('/src/speech/voiceSettings.ts')
const { countReviews, noApprovals, pruneApprovals } = await server.ssrLoadModule('/src/speech/review/approvals.ts')
await server.close()

const modelPath = path.join(root, `.tools/piper-voices/${speechVoice.voice}.onnx`)
for (const [what, file] of [['Piper venv', python], ['Piper voice', modelPath]]) {
  if (!existsSync(file)) {
    console.error(`Missing ${what}: ${file}\nSee "Generating speech" in README.md.`)
    process.exit(1)
  }
}

// Every symbol in a pronunciation fix must be one the voice knows, or it would be silently dropped.
const knownSymbols = new Set(Object.keys(JSON.parse(readFileSync(`${modelPath}.json`, 'utf8')).phoneme_id_map))
for (const [word, ipa] of Object.entries(pronunciations)) {
  const unknown = [...ipa].filter((symbol) => !knownSymbols.has(symbol))
  if (unknown.length > 0) {
    console.error(`Pronunciation of "${word}" uses symbols the voice doesn't know: ${unknown.join(' ')}`)
    process.exit(1)
  }
}

// What Piper is asked to say: the sentence, with fixed pronunciations swapped in.
const clips = spokenTexts().map((text) => ({ text, file: clipFileName(text), input: withPronunciations(text) }))
mkdirSync(audioDir, { recursive: true })

// A clip whose sentence, pronunciation or voice changed has a new file name, so only missing files are generated.
const manifestPath = path.join(audioDir, 'clips.json')
const work = path.join(tmpdir(), `larrutan-speech-${Date.now()}`)
mkdirSync(work, { recursive: true })
const todo = clips.filter((clip) => regenerateAll || !existsSync(path.join(audioDir, clip.file)))
console.log(`${clips.length} sentences, ${todo.length} to generate`)

if (todo.length > 0) {
  const jobs = todo.map((clip, i) => ({ text: clip.input, wav: path.join(work, `${i}.wav`) }))
  const jobsPath = path.join(work, 'jobs.json')
  writeFileSync(jobsPath, JSON.stringify(jobs), 'utf8')
  execFileSync(python, [path.join(root, 'scripts/piper_batch.py'), modelPath, jobsPath, String(speechVoice.lengthScale)], {
    stdio: 'inherit',
    env: { ...process.env, PYTHONIOENCODING: 'utf-8' },
  })

  // Trim silence at both ends (keeping a little lead-in), even out loudness, and compress.
  const filters = [
    'silenceremove=start_periods=1:start_threshold=-50dB:start_silence=0.06',
    'areverse',
    'silenceremove=start_periods=1:start_threshold=-50dB:start_silence=0.12',
    'areverse',
    'loudnorm=I=-16:TP=-1.5:LRA=11',
  ].join(',')
  for (const [i, clip] of todo.entries()) {
    execFileSync(ffmpeg, ['-y', '-loglevel', 'error', '-i', jobs[i].wav, '-af', filters, '-ar', '24000', '-ac', '1', '-b:a', '48k', path.join(audioDir, clip.file)])
  }
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
