import { getLetter } from '../content/letters'
import { phrases } from '../content/phrases'
import { getWord } from '../content/words'
import type { ChoiceQuestion } from './choiceQuestion'
import type { FirstLetterQuestion } from './firstLetter/createRound'

/**
 * Everything a challenge says, built from content. The speech catalogue uses
 * the same builders, so every sentence the game can say has an audio clip.
 */
export interface ChallengeVoice<Q extends ChoiceQuestion> {
  /** Said when a question starts and when the speaker is pressed: "Var är A?" */
  ask(question: Q): string
  /** Said once only the answer is left: "Här är A!" */
  reveal(question: Q): string
  /** Names a wrong choice the child tapped: "Det där är S." */
  nameChoice(choice: string): string
  /** Said on the end-of-round screen. */
  complete: string
}

const letterName = (id: string) => getLetter(id).spoken

export const findLetterVoice: ChallengeVoice<ChoiceQuestion> = {
  ask: (q) => phrases.findLetterQuestion(letterName(q.target)),
  reveal: (q) => phrases.hereIs(letterName(q.target)),
  nameChoice: (id) => phrases.thatIs(letterName(id)),
  complete: phrases.findLetterComplete,
}

export const firstLetterVoice: ChallengeVoice<FirstLetterQuestion> = {
  ask: (q) => phrases.firstLetterQuestion(getWord(q.word).base),
  reveal: (q) => phrases.firstLetterReveal(getWord(q.word).base, letterName(q.target)),
  nameChoice: (id) => phrases.thatIs(letterName(id)),
  complete: phrases.firstLetterComplete,
}

export const wordPictureVoice: ChallengeVoice<ChoiceQuestion> = {
  ask: (q) => phrases.wordPictureQuestion(getWord(q.target).definite),
  reveal: (q) => phrases.hereIs(getWord(q.target).definite),
  nameChoice: (id) => phrases.thatIs(getWord(id).indefinite),
  complete: phrases.wordPictureComplete,
}
