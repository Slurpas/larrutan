// Synthesises the game's sound effects from plain tones and writes them as MP3s.
// Deterministic: the same code always gives the same sounds. Run `npm run sfx` after changing a sound.
// Needs ffmpeg on PATH (or FFMPEG=path).

import { execFileSync } from 'node:child_process'
import { mkdirSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const outDir = path.join(root, 'src/sound/sfx')
const ffmpeg = process.env.FFMPEG ?? 'ffmpeg'
const RATE = 44100

/** Frequency of a note name like "C5" or "F#6" (A4 = 440 Hz). */
function hz(note) {
  const [, letter, sharp, octave] = /^([A-G])(#?)(\d)$/.exec(note)
  const semitone = { C: -9, D: -7, E: -5, F: -4, G: -2, A: 0, B: 2 }[letter] + (sharp ? 1 : 0)
  return 440 * 2 ** ((Number(octave) - 4) + semitone / 12)
}

/**
 * Adds one soft, bell-like note to the buffer.
 * `partials` are [harmonic, loudness] pairs; decay is how fast it fades (seconds).
 */
function addNote(buffer, { note, start, decay, volume, partials = [[1, 1], [2, 0.25], [3, 0.08]] }) {
  const f = hz(note)
  const from = Math.floor(start * RATE)
  const length = Math.min(buffer.length - from, Math.floor(decay * 6 * RATE))
  for (let i = 0; i < length; i++) {
    const t = i / RATE
    const attack = Math.min(1, t / 0.006)
    const envelope = attack * Math.exp(-t / decay)
    let sample = 0
    for (const [harmonic, loudness] of partials) sample += loudness * Math.sin(2 * Math.PI * f * harmonic * t)
    buffer[from + i] += volume * envelope * sample
  }
}

/** A soft square-ish tone (odd harmonics), a little brassier, for the fanfare. */
const brassy = [[1, 1], [3, 0.2], [5, 0.06], [2, 0.15]]

const sounds = {
  /** A right answer: two bright notes going up, and a tiny sparkle. */
  correct(buffer) {
    addNote(buffer, { note: 'E6', start: 0, decay: 0.16, volume: 0.5 })
    addNote(buffer, { note: 'B6', start: 0.09, decay: 0.22, volume: 0.5 })
    addNote(buffer, { note: 'E7', start: 0.17, decay: 0.08, volume: 0.15 })
    addNote(buffer, { note: 'G#7', start: 0.21, decay: 0.07, volume: 0.1 })
  },
  /** The end of a round: a quick rising arpeggio, then a happy chord. */
  fanfare(buffer) {
    ;['C5', 'E5', 'G5'].forEach((note, i) => addNote(buffer, { note, start: i * 0.11, decay: 0.18, volume: 0.35, partials: brassy }))
    for (const note of ['C5', 'E5', 'G5', 'C6']) addNote(buffer, { note, start: 0.34, decay: 0.45, volume: 0.22, partials: brassy })
    ;['G6', 'C7', 'E7'].forEach((note, i) => addNote(buffer, { note, start: 0.36 + i * 0.07, decay: 0.12, volume: 0.1 }))
  },
  /** Going up a level: a fast climb and a shimmer at the top. */
  levelUp(buffer) {
    ;['G5', 'B5', 'D6', 'G6', 'B6', 'D7'].forEach((note, i) => addNote(buffer, { note, start: i * 0.06, decay: 0.2, volume: 0.32 }))
    for (let i = 0; i < 8; i++) addNote(buffer, { note: i % 2 ? 'G7' : 'D7', start: 0.38 + i * 0.045, decay: 0.08, volume: 0.09 })
  },
  /** A bubble popping: a quick rising "plip" and a tiny click. */
  pop(buffer) {
    let phase = 0
    let noise = 12345
    for (let i = 0; i < buffer.length; i++) {
      const t = i / RATE
      const f = 500 + 2600 * Math.min(1, t / 0.045)
      phase += (2 * Math.PI * f) / RATE
      const envelope = Math.min(1, t / 0.002) * Math.exp(-t / 0.035)
      noise = (noise * 1103515245 + 12345) % 2147483648
      const click = t < 0.006 ? ((noise / 2147483648) * 2 - 1) * (1 - t / 0.006) * 0.5 : 0
      buffer[i] += envelope * Math.sin(phase) + click
    }
  },
  /** A knock at a door: two soft, woody taps (the red house, where nobody answers). */
  knock(buffer) {
    for (const start of [0, 0.17]) {
      const from = Math.floor(start * RATE)
      let noise = 987
      for (let i = 0; from + i < buffer.length && i < 0.12 * RATE; i++) {
        const t = i / RATE
        noise = (noise * 1103515245 + 12345) % 2147483648
        const body = Math.sin(2 * Math.PI * 180 * t) * Math.exp(-t / 0.03)
        const knuckle = ((noise / 2147483648) * 2 - 1) * Math.exp(-t / 0.006) * 0.6
        buffer[from + i] += body + knuckle
      }
    }
  },
  /** Falling into the water: a low "plop", a rush of spray dying down, and drops landing after it. */
  splash(buffer) {
    let noise = 4242
    let low = 0
    let phase = 0
    for (let i = 0; i < buffer.length; i++) {
      const t = i / RATE
      // The spray: noise through a low-pass filter that closes as it dies down.
      noise = (noise * 1103515245 + 12345) % 2147483648
      const cutoff = 800 + 5200 * Math.exp(-t / 0.12)
      low += (1 - Math.exp((-2 * Math.PI * cutoff) / RATE)) * ((noise / 2147483648) * 2 - 1 - low)
      const spray = low * Math.min(1, t / 0.004) * (Math.exp(-t / 0.13) + 0.5 * Math.exp(-Math.max(0, t - 0.05) / 0.1) * (t > 0.05 ? 1 : 0))
      // The plop: a short tone falling from 380 to 120 Hz.
      phase += (2 * Math.PI * (120 + 260 * Math.exp(-t / 0.03))) / RATE
      const plop = Math.sin(phase) * Math.min(1, t / 0.003) * Math.exp(-t / 0.07)
      buffer[i] += 1.6 * spray + 0.8 * plop
    }
    // Drops falling back: tiny rising "plinks".
    for (const [start, from] of [[0.13, 900], [0.19, 1300], [0.27, 1100], [0.33, 1600], [0.42, 1000]]) {
      let plink = 0
      for (let i = 0, at = Math.floor(start * RATE); at + i < buffer.length && i < 0.08 * RATE; i++) {
        const t = i / RATE
        plink += (2 * Math.PI * (from + 1400 * Math.min(1, t / 0.015))) / RATE
        buffer[at + i] += 0.22 * Math.sin(plink) * Math.min(1, t / 0.002) * Math.exp(-t / 0.018)
      }
    }
  },
  /** A new hat: a glittering run of high notes over a soft bell. */
  newItem(buffer) {
    addNote(buffer, { note: 'C6', start: 0, decay: 0.4, volume: 0.25 })
    ;['C7', 'E7', 'D7', 'G7', 'E7', 'A7', 'G7', 'C8'].forEach((note, i) =>
      addNote(buffer, { note, start: 0.05 + i * 0.05, decay: 0.09, volume: 0.13 }),
    )
  },
}

const lengths = { correct: 0.6, fanfare: 1.4, levelUp: 1.0, newItem: 0.9, pop: 0.2, knock: 0.45, splash: 0.7 }

function toWav(samples) {
  const data = Buffer.alloc(samples.length * 2)
  samples.forEach((s, i) => data.writeInt16LE(Math.round(Math.max(-1, Math.min(1, s)) * 32767), i * 2))
  const header = Buffer.alloc(44)
  header.write('RIFF', 0)
  header.writeUInt32LE(36 + data.length, 4)
  header.write('WAVEfmt ', 8)
  header.writeUInt32LE(16, 16)
  header.writeUInt16LE(1, 20) // PCM
  header.writeUInt16LE(1, 22) // mono
  header.writeUInt32LE(RATE, 24)
  header.writeUInt32LE(RATE * 2, 28)
  header.writeUInt16LE(2, 32)
  header.writeUInt16LE(16, 34)
  header.write('data', 36)
  header.writeUInt32LE(data.length, 40)
  return Buffer.concat([header, data])
}

mkdirSync(outDir, { recursive: true })
const work = path.join(tmpdir(), `larrutan-sfx-${Date.now()}`)
mkdirSync(work, { recursive: true })

for (const [name, draw] of Object.entries(sounds)) {
  const samples = new Float64Array(Math.floor(lengths[name] * RATE))
  draw(samples)
  // Normalise to a gentle peak and fade the tail so nothing clicks.
  const peak = samples.reduce((max, s) => Math.max(max, Math.abs(s)), 0) || 1
  const fade = Math.floor(0.05 * RATE)
  for (let i = 0; i < samples.length; i++) {
    const tail = Math.min(1, (samples.length - i) / fade)
    samples[i] = (samples[i] / peak) * 0.7 * tail
  }
  const wav = path.join(work, `${name}.wav`)
  writeFileSync(wav, toWav(samples))
  // Quieter than speech, so effects never startle.
  execFileSync(ffmpeg, ['-y', '-loglevel', 'error', '-i', wav, '-af', 'loudnorm=I=-20:TP=-3', '-ar', '44100', '-ac', '1', '-b:a', '64k', path.join(outDir, `${name}.mp3`)])
  console.log(`made ${name}.mp3`)
}
rmSync(work, { recursive: true, force: true })
