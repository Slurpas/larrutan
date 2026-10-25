import { useEffect, useEffectEvent, useState } from 'react'
import type { Practiced } from '../learning/mastery'
import type { RoundOutcome } from '../rewards/progress'
import { speak, stopSpeech } from '../speech/speech'
import type { ChoiceQuestion, ChoiceRound } from './choiceQuestion'
import { firstTryScore } from './levels'
import { advance, choose as chooseIn, currentQuestion, isAnswerRevealed, startRound, type RoundState } from './roundState'
import type { ChallengeVoice } from './voices'

/** After the voice names a wrong choice, a breath before the question comes again (user feedback 2026-10-25). */
export const WRONG_PAUSE_MS = 500

/** What a finished round tells the app. */
export interface RoundResult {
  /** How well it went, from 0 (no better than guessing) to 1 (flawless): moves the station's level. */
  score: number
  practiced: Practiced[]
}

export interface ChoiceRoundOptions<Q extends ChoiceQuestion> {
  round: ChoiceRound<Q>
  /** What the challenge says (src/challenges/voices.ts). */
  voice: ChallengeVoice<Q>
  /** Said before the first question when the station has just gone up a level (src/challenges/levels.ts). */
  levelIntro?: string
  /** Called once when the last question is answered; returns what the round earned. */
  onRoundComplete?: (result: RoundResult) => RoundOutcome
  /** What a question practises, for mastery: the letter in Hitta bokstaven, the word in the others. */
  practiceItem: (question: Q) => string
  /** The child has finished this challenge before, so even the first question can be the short form. */
  knowsChallenge?: boolean
  /** How long a right answer is celebrated (a happy sound plays meanwhile) before the next question. */
  correctPauseMs: number
}

/**
 * The round as every challenge screen plays it, whatever it looks like (cards, the mine
 * cart): asking out loud, graduated help after a wrong choice, a happy sound for a right
 * one, and reporting the finished round. The screen only decides when a choice is made.
 */
export function useChoiceRound<Q extends ChoiceQuestion>({
  round,
  voice,
  levelIntro,
  onRoundComplete,
  practiceItem,
  knowsChallenge = false,
  correctPauseMs,
}: ChoiceRoundOptions<Q>) {
  const [state, setState] = useState(() => startRound(round))
  const [outcome, setOutcome] = useState<RoundOutcome | null>(null)

  const question = currentQuestion(state)
  const revealed = isAnswerRevealed(state)

  // The full question only until the child knows the game: the very first question they ever get here.
  // After that the short form, also after a wrong choice. The speaker button always gives the full question.
  const short = (q: Q) => (voice.askAgain ? voice.askAgain(q) : voice.ask(q))
  const useShort = knowsChallenge || state.questionIndex > 0
  const questionText = !question ? null : useShort ? short(question) : voice.ask(question)

  function promptFor(s: RoundState<Q>, full = false): string {
    const q = currentQuestion(s)
    if (!q) return ''
    if (isAnswerRevealed(s)) return voice.reveal(q)
    return full ? voice.ask(q) : short(q)
  }

  // Ask each new question out loud, even one worded like the last ("Läs ordet!"); the first
  // round at a new level starts by saying what is harder.
  const { questionIndex } = state
  const isFirstQuestion = questionIndex === 0
  useEffect(() => {
    if (!questionText) return
    void speak(isFirstQuestion && levelIntro ? [levelIntro, questionText] : questionText)
  }, [questionText, questionIndex, isFirstQuestion, levelIntro])

  // Stop talking when the child leaves.
  useEffect(() => stopSpeech, [])

  const finishRound = useEffectEvent(() => {
    if (!onRoundComplete) return
    const practiced = state.round.questions.map((q, i) => ({ item: practiceItem(q), firstTry: state.firstTry[i] ?? false }))
    const score = firstTryScore(
      practiced.map((p) => p.firstTry),
      state.round.questions.map((q) => q.choices.length),
    )
    setOutcome(onRoundComplete({ score, practiced }))
  })

  // After a correct answer: a happy chime, then the next question (or the end of the round).
  useEffect(() => {
    if (state.phase !== 'correct') return
    let cancelled = false
    const isLast = state.questionIndex === state.round.questions.length - 1
    void Promise.all([speak({ sound: 'correct' }), pause(correctPauseMs)]).then(() => {
      if (cancelled) return
      if (isLast) finishRound()
      setState(advance)
    })
    return () => {
      cancelled = true
    }
  }, [state.phase, state.questionIndex, state.round.questions.length, correctPauseMs])

  /** The child picks a choice. Wrong: name it, then ask again (or point at the answer once it is the only one left). */
  function choose(choice: string) {
    const next = chooseIn(state, choice)
    if (next === state) return
    setState(next)
    if (next.phase === 'asking') void speak([voice.nameChoice(choice), { pause: WRONG_PAUSE_MS }, promptFor(next)])
  }

  /** The speaker button: the full question, for a child who needs to hear what to do. */
  function replay() {
    if (state.phase === 'asking') void speak(promptFor(state, true))
  }

  /** Tapping the picture: just the word again. */
  function sayAgain() {
    if (state.phase === 'asking') void speak(promptFor(state))
  }

  return { state, question, revealed, outcome, choose, replay, sayAgain }
}

function pause(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
