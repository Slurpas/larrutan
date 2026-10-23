import { useEffect, useEffectEvent, useMemo, useRef, useState } from 'react'
import { spokenGroups } from '../catalogue'
import { clipFileName } from '../clipName'
import { clipUrl } from '../speech'
import { countReviews, voiceReviewEndpoint, type Approvals, type ReviewRequest } from './approvals'
import styles from './VoiceReview.module.css'

interface Clip {
  file: string
  text: string
  url: string | undefined
  group: string
  picture?: string
}

type Filter = 'unreviewed' | 'rejected' | 'approved' | 'all'
const filters: { id: Filter; label: string }[] = [
  { id: 'unreviewed', label: 'To review' },
  { id: 'rejected', label: 'Wrong' },
  { id: 'approved', label: 'Good' },
  { id: 'all', label: 'All' },
]

/**
 * For the adult, on the dev server (`?review=voices`): listen to every generated
 * clip and mark it good or wrong (PRD §7). Decisions are saved to
 * src/speech/audio/sv/approvals.json; wrong clips get fixed and come back as new clips.
 */
export default function VoiceReview() {
  const clips = useMemo<Clip[]>(
    () =>
      spokenGroups().flatMap((group) =>
        group.texts.map((text) => ({
          file: clipFileName(text),
          text,
          url: clipUrl(text),
          group: group.title,
          picture: group.picture,
        })),
      ),
    [],
  )
  const [approvals, setApprovals] = useState<Approvals | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<Filter>('unreviewed')
  /** Clips decided since the filter last changed stay in view, so a wrong one can get its note. */
  const [decided, setDecided] = useState<ReadonlySet<string>>(new Set())
  const [selected, setSelected] = useState<string | null>(null)
  const [playing, setPlaying] = useState<string | null>(null)
  const audio = useRef<HTMLAudioElement | null>(null)
  const noteInputs = useRef(new Map<string, HTMLInputElement>())
  /** A clip just marked wrong: its note box gets the focus once it has been drawn. */
  const askNoteFor = useRef<string | null>(null)

  useEffect(() => {
    fetch(voiceReviewEndpoint)
      .then((response) => (response.ok ? (response.json() as Promise<Approvals>) : Promise.reject(new Error(String(response.status)))))
      .then(setApprovals)
      .catch(() => setError('Could not load the approvals. The review page only works with `npm run dev`.'))
  }, [])

  const statusOf = (file: string) => approvals?.clips[file]?.status ?? 'unreviewed'
  const visible = clips.filter((clip) => filter === 'all' || statusOf(clip.file) === filter || decided.has(clip.file))
  const counts = approvals ? countReviews(clips.map((clip) => clip.file), approvals) : null

  function play(clip: Clip) {
    setSelected(clip.file)
    if (!clip.url) return
    audio.current ??= new Audio()
    const element = audio.current
    element.onplaying = () => setPlaying(clip.file)
    element.onended = element.onerror = element.onpause = () => setPlaying(null)
    element.src = clip.url
    void element.play().catch(() => setPlaying(null))
  }

  async function decide(clip: Clip, status: ReviewRequest['status'], note?: string) {
    const index = visible.findIndex((other) => other.file === clip.file)
    const next = visible.slice(index + 1).find((other) => other.file !== clip.file)
    try {
      const response = await fetch(voiceReviewEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ file: clip.file, status, note } satisfies ReviewRequest),
      })
      if (!response.ok) throw new Error(((await response.json()) as { error?: string }).error ?? String(response.status))
      setApprovals((await response.json()) as Approvals)
      setDecided((files) => new Set(files).add(clip.file))
      setError(null)
    } catch (failure) {
      setError(`Not saved: ${String(failure)}`)
      return
    }
    if (status === 'rejected' && note === undefined) {
      setSelected(clip.file)
      // Ask what's wrong; the note is saved when the box is left or Enter is pressed.
      askNoteFor.current = clip.file
    } else if (status === 'approved' && next) {
      play(next)
    }
  }

  // After every render: focus the note box of a clip just marked wrong, once it exists.
  useEffect(() => {
    const input = askNoteFor.current && noteInputs.current.get(askNoteFor.current)
    if (!input) return
    input.focus()
    askNoteFor.current = null
  })

  const handleKey = useEffectEvent((event: KeyboardEvent) => {
    if (event.target instanceof HTMLInputElement) return
    const index = visible.findIndex((clip) => clip.file === selected)
    const current = visible[index]
    const move = (step: number) => {
      const target = visible[Math.min(Math.max(index + step, 0), visible.length - 1)]
      if (target) play(target)
    }
    if (event.key === 'ArrowDown' || event.key === 'j') move(index === -1 ? 0 : 1)
    else if (event.key === 'ArrowUp' || event.key === 'k') move(-1)
    else if (event.key === ' ' && current) play(current)
    else if (event.key === 'a' && current) void decide(current, 'approved')
    else if (event.key === 'r' && current) void decide(current, 'rejected')
    else if (event.key === 'u' && current) void decide(current, 'unreviewed')
    else return
    event.preventDefault()
  })

  useEffect(() => {
    const listener = (event: KeyboardEvent) => handleKey(event)
    window.addEventListener('keydown', listener)
    return () => window.removeEventListener('keydown', listener)
  }, [])

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1>Voice review</h1>
        <p>
          Listen to each clip and mark it <strong>Good</strong> or <strong>Wrong</strong>. For a wrong one, write what's
          wrong (e.g. "säger öka"); it gets fixed and comes back here as a new clip. Keys: ↓ ↑ next/previous (plays),
          space play, A good, R wrong, U undo.
        </p>
        {counts && (
          <p className={styles.counts}>
            {clips.length} clips: {counts.approved} good, {counts.rejected} wrong, {counts.unreviewed} to review
          </p>
        )}
        <div className={styles.filters} role="group" aria-label="Show">
          {filters.map(({ id, label }) => (
            <button
              key={id}
              type="button"
              aria-pressed={filter === id}
              onClick={() => {
                setFilter(id)
                setDecided(new Set())
              }}
            >
              {label}
            </button>
          ))}
        </div>
        {error && (
          <p role="alert" className={styles.error}>
            {error}
          </p>
        )}
      </header>

      {approvals && visible.length === 0 && <p className={styles.empty}>Nothing here.</p>}
      {approvals && (
        <ol className={styles.list}>
          {visible.map((clip, index) => {
            const status = statusOf(clip.file)
            const review = approvals.clips[clip.file]
            const firstOfGroup = visible[index - 1]?.group !== clip.group
            return (
              <li key={clip.file} className={styles.item}>
                {firstOfGroup && (
                  <h2 className={styles.group}>
                    {clip.picture && <span aria-hidden="true">{clip.picture} </span>}
                    {clip.group}
                  </h2>
                )}
                <div className={styles.row} data-status={status} data-selected={selected === clip.file}>
                  <button
                    type="button"
                    className={styles.play}
                    onClick={() => play(clip)}
                    disabled={!clip.url}
                    aria-label={`Play: ${clip.text}`}
                  >
                    {playing === clip.file ? '■' : '▶'}
                  </button>
                  <span className={styles.text}>
                    {clip.text}
                    {!clip.url && <em> (no clip, run npm run speech)</em>}
                  </span>
                  <button
                    type="button"
                    className={styles.good}
                    aria-pressed={status === 'approved'}
                    onClick={() => void decide(clip, status === 'approved' ? 'unreviewed' : 'approved')}
                  >
                    Good
                  </button>
                  <button
                    type="button"
                    className={styles.wrong}
                    aria-pressed={status === 'rejected'}
                    onClick={() => void decide(clip, status === 'rejected' ? 'unreviewed' : 'rejected')}
                  >
                    Wrong
                  </button>
                  {status === 'rejected' && (
                    <input
                      ref={(input) => {
                        if (input) noteInputs.current.set(clip.file, input)
                        else noteInputs.current.delete(clip.file)
                      }}
                      className={styles.note}
                      aria-label={`What's wrong with: ${clip.text}`}
                      placeholder="What's wrong? e.g. säger öka"
                      maxLength={300}
                      defaultValue={review?.note ?? ''}
                      onBlur={(event) => {
                        if (event.target.value.trim() !== (review?.note ?? '')) void decide(clip, 'rejected', event.target.value)
                      }}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter') event.currentTarget.blur()
                      }}
                    />
                  )}
                </div>
              </li>
            )
          })}
        </ol>
      )}
    </div>
  )
}
