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
  /** The full question: the first time a child plays, and whenever the speaker is pressed. "Var är A?" */
  ask(question: Q): string
  /** A shorter form once the child knows the game, also after a wrong tap. Defaults to `ask`. */
  askAgain?(question: Q): string
  /** Said once only the answer is left: "Här är A!" */
  reveal(question: Q): string
  /** Names a wrong choice the child tapped: "Det där är S." */
  nameChoice(choice: string): string
  /** Said before the first question of a hard round: what is harder. */
  hardIntro?: string
}

const letterName = (id: string) => getLetter(id).spoken

export const findLetterVoice: ChallengeVoice<ChoiceQuestion> = {
  ask: (q) => phrases.findLetterQuestion(letterName(q.target)),
  reveal: (q) => phrases.hereIs(letterName(q.target)),
  nameChoice: (id) => phrases.thatIs(letterName(id)),
}

/** Mata draken (Hitta bokstaven): "Draken vill ha ett A!" */
export const dragonVoice: ChallengeVoice<ChoiceQuestion> = {
  ask: (q) => phrases.dragonQuestion(letterName(q.target)),
  reveal: (q) => phrases.hereIs(letterName(q.target)),
  nameChoice: (id) => phrases.thatIs(letterName(id)),
  hardIntro: phrases.lookAlikesIntro,
}

export const firstLetterVoice: ChallengeVoice<FirstLetterQuestion> = {
  ask: (q) => phrases.firstLetterQuestion(getWord(q.word).base),
  askAgain: (q) => phrases.firstLetterShort(getWord(q.word).base),
  reveal: (q) => phrases.firstLetterReveal(getWord(q.word).base, letterName(q.target)),
  nameChoice: (id) => phrases.thatIs(letterName(id)),
  hardIntro: phrases.fourTunnelsIntro,
}

export const wordPictureVoice: ChallengeVoice<ChoiceQuestion> = {
  ask: (q) => phrases.wordPictureQuestion(getWord(q.target).definite),
  reveal: (q) => phrases.hereIs(getWord(q.target).definite),
  nameChoice: (id) => phrases.thatIs(getWord(id).indefinite),
}
