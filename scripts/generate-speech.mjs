// Generates an MP3 for every sentence in src/speech/catalogue.ts.
//
//   npm run speech           only sentences without a file yet
//   npm run speech -- --all  regenerate everything (e.g. after changing voice settings)
//
// Needs: the Piper venv and voice in .tools/ (see README), and ffmpeg on PATH (or FFMPEG=path).

import { execFileSync } from 'node:child_process'
import { existsSync, mkdirSync, readdirSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createServer } from 'vite'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const audioDir = path.join(root, 'src/speech/audio/sv')
const silencePath = path.join(root, 'src/speech/audio/silence.mp3')
// Alma: a female Swedish voice (CC BY 4.0, NST dataset). Her natural pace is quick, so slow her down for young listeners.
const voiceName = 'sv_SE-alma-medium'
const lengthScale = 1.2
const modelPath = path.join(root, `.tools/piper-voices/${voiceName}.onnx`)
const python = path.join(root, process.platform === 'win32' ? '.tools/piper-venv/Scripts/python.exe' : '.tools/piper-venv/bin/python')
const ffmpeg = process.env.FFMPEG ?? 'ffmpeg'
const regenerateAll = process.argv.includes('--all')

for (const [what, file] of [['Piper venv', python], ['Piper voice', modelPath]]) {
  if (!existsSync(file)) {
    console.error(`Missing ${what}: ${file}\nSee "Generating speech" in README.md.`)
    process.exit(1)
  }
}

// Load the catalogue through Vite, so TypeScript and extensionless imports just work.
const server = await createServer({ appType: 'custom', logLevel: 'error', server: { middlewareMode: true, hmr: false } })
const { spokenTexts } = await server.ssrLoadModule('/src/speech/catalogue.ts')
const { clipFileName } = await server.ssrLoadModule('/src/speech/clipName.ts')
await server.close()

const clips = spokenTexts().map((text) => ({ text, file: clipFileName(text) }))
mkdirSync(audioDir, { recursive: true })

const work = path.join(tmpdir(), `larrutan-speech-${Date.now()}`)
mkdirSync(work, { recursive: true })
const todo = clips.filter((clip) => regenerateAll || !existsSync(path.join(audioDir, clip.file)))
console.log(`${clips.length} sentences, ${todo.length} to generate`)

if (todo.length > 0) {
  const jobs = todo.map((clip, i) => ({ text: clip.text, wav: path.join(work, `${i}.wav`) }))
  const jobsPath = path.join(work, 'jobs.json')
  writeFileSync(jobsPath, JSON.stringify(jobs), 'utf8')
  execFileSync(python, [path.join(root, 'scripts/piper_batch.py'), modelPath, jobsPath, String(lengthScale)], {
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
writeFileSync(
  path.join(audioDir, 'clips.json'),
  `${JSON.stringify({ engine: 'Piper (piper-tts 1.8.0)', voice: voiceName, lengthScale, clips }, null, 2)}\n`,
  'utf8',
)
rmSync(work, { recursive: true, force: true })
console.log(`done: ${clips.length} clips in ${path.relative(root, audioDir)}`)
