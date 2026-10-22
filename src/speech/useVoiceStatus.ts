import { useSyncExternalStore } from 'react'
import { getVoiceStatus, subscribeVoiceStatus, type VoiceStatus } from './speech'

export function useVoiceStatus(): VoiceStatus {
  return useSyncExternalStore(subscribeVoiceStatus, getVoiceStatus)
}
