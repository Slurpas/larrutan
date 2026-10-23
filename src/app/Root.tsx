import { lazy, Suspense } from 'react'
import { App } from './App'
import { reviewingVoices } from './reviewMode'

// Dev builds only, so the review page isn't shipped in the release build at all.
const VoiceReview = import.meta.env.DEV ? lazy(() => import('../speech/review/VoiceReview')) : () => null

/** The game, or the clip review page when asked for. */
export function Root() {
  if (!reviewingVoices) return <App />
  return (
    <Suspense>
      <VoiceReview />
    </Suspense>
  )
}
