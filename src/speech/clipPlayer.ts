import type { EventLog } from './eventLog'

/** A clip that hasn't loaded by now is skipped; the game must never hang waiting for sound. */
const LOAD_LIMIT_MS = 3000

/** How a clip ended: played through, stopped for something newer, or couldn't play at all. */
export type ClipOutcome = 'finished' | 'stopped' | 'failed'

export interface ClipPlayer {
  /** Call synchronously inside the first tap, so iPad Safari lets this player start clips by itself later. */
  unlock(): void
  /** Plays one clip; resolves when it ends, fails, or is interrupted. */
  play(url: string, label: string): Promise<ClipOutcome>
  stop(): void
}

/** Plays the generated speech clips through one reused audio element. */
export function createClipPlayer(silenceUrl: string, log: EventLog): ClipPlayer {
  let audio: HTMLAudioElement | null = null
  let finishCurrent: ((how: string, outcome: ClipOutcome) => void) | null = null
  let unlocked = false

  // One element for everything: iPad Safari only lets an element play on its own after it has played inside a tap.
  function element(): HTMLAudioElement {
    if (!audio) {
      audio = new Audio()
      audio.preload = 'auto'
    }
    return audio
  }

  return {
    unlock() {
      if (unlocked) return
      unlocked = true
      const a = element()
      a.src = silenceUrl
      a.play().then(
        () => log.note('audio unlocked'),
        (error: Error) => log.note(`audio unlock failed (${error.name})`),
      )
    },

    play(url, label) {
      finishCurrent?.('interrupted', 'stopped')
      const a = element()

      return new Promise<ClipOutcome>((resolve) => {
        let done = false
        let endTimer: ReturnType<typeof setTimeout> | undefined
        const loadTimer = setTimeout(() => finish('did not load in time', 'failed'), LOAD_LIMIT_MS)

        const onLoaded = () => {
          clearTimeout(loadTimer)
          // 'ended' should come right after the clip's length; never wait much longer than that.
          const seconds = Number.isFinite(a.duration) ? a.duration : 5
          endTimer = setTimeout(() => finish('no end event, gave up waiting', 'finished'), seconds * 1000 + 1500)
        }
        const onEnded = () => finish('finished', 'finished')
        const onError = () => finish(`error (code ${a.error?.code ?? '?'})`, 'failed')

        const finish = (how: string, outcome: ClipOutcome) => {
          if (done) return
          done = true
          clearTimeout(loadTimer)
          clearTimeout(endTimer)
          a.removeEventListener('loadedmetadata', onLoaded)
          a.removeEventListener('ended', onEnded)
          a.removeEventListener('error', onError)
          if (finishCurrent === finish) finishCurrent = null
          log.note(`clip ${how}: ${label}`)
          resolve(outcome)
        }

        finishCurrent = finish
        a.addEventListener('loadedmetadata', onLoaded)
        a.addEventListener('ended', onEnded)
        a.addEventListener('error', onError)
        a.src = url
        a.play().then(
          () => {
            if (!done) log.note(`clip started: ${label}`)
          },
          (error: Error) => finish(`could not play (${error.name})`, 'failed'),
        )
      })
    },

    stop() {
      finishCurrent?.('stopped', 'stopped')
      if (audio && !audio.paused) audio.pause()
    },
  }
}
