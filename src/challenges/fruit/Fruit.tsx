import { useState } from 'react'
import type { ChallengeScreenProps } from '../challengeProps'
import { ChoiceChallenge } from '../ChoiceChallenge'
import { levelIntro, levelParams } from '../levels'
import { fruitVoice } from '../voices'
import { createFruitRound, factKey } from './createRound'
import { FruitSum } from './FruitSum'

/**
 * Räkna frukterna, in the town of maths: count two kinds of fruit and tap how many there are in
 * all. Level 1 writes the whole sum ("3 + 4 = 7": find the 7), level 2 leaves out the answer,
 * level 3 shows only the first number, level 4 none. After a wrong answer every fruit shows its
 * number, to count by. A number key picks that number.
 */
export function Fruit({ seed, level, announceLevel, knowsChallenge, practiceBox, onRoundComplete, onExit, onPlayAgain }: ChallengeScreenProps) {
  const { maxSum, choices, shown } = levelParams('fruit', level)
  const [round] = useState(() => createFruitRound({ seed, maxSum, choices, practiceBox }))

  return (
    <ChoiceChallenge
      round={round}
      voice={fruitVoice}
      level={level}
      levelIntro={announceLevel ? levelIntro('fruit', level) : undefined}
      onRoundComplete={onRoundComplete}
      practiceItem={(q) => factKey(q.parts)}
      knowsChallenge={knowsChallenge}
      choiceKind="letter"
      renderChoice={(id) => id}
      choiceLabel={(id) => id}
      showcase={(q, help) => <FruitSum question={q} shown={shown} counting={help.wrongTaps > 0} solved={help.solved} />}
      showcaseKind="scene"
      // A digit picks its own number; 0 is 10.
      keyChoice={(key, q) => q.choices.find((choice) => choice === (key === '0' ? '10' : key))}
      onExit={onExit}
      onPlayAgain={onPlayAgain}
    />
  )
}
