import Phaser from 'phaser'
import type { Outfit } from '../art/outfit'
import { HubScene, type HubSceneOptions } from './HubScene'
import './hubTestApi'

export interface HubGame {
  /** Inactive while a challenge covers the map: the game loop sleeps and ignores the keyboard. */
  setActive(active: boolean): void
  /** What the character wears. */
  setOutfit(outfit: Outfit): void
  destroy(): void
}

export function createHubGame(parent: HTMLElement, options: HubSceneOptions): HubGame {
  const scene = new HubScene(options)
  const game = new Phaser.Game({
    type: Phaser.AUTO,
    parent,
    backgroundColor: '#84c669',
    banner: false,
    // Crisp 16×16 pixel art: no smoothing, whole pixels (docs/ART_DIRECTION.md).
    pixelArt: true,
    // The scene listens to the DOM itself, so nothing is captured while a challenge is open.
    input: { keyboard: false },
    // All sound is speech (src/speech). Phaser's own audio context could compete with it on iPad.
    audio: { noAudio: true },
    scale: {
      mode: Phaser.Scale.RESIZE,
      width: parent.clientWidth || 1,
      height: parent.clientHeight || 1,
    },
    scene,
  })

  let active = false
  function setActive(next: boolean) {
    if (next === active) return
    active = next
    if (active) {
      game.loop.wake()
      // Re-measure where the canvas is; layout may have changed while a challenge covered it.
      game.scale.refresh()
      window.addEventListener('keydown', scene.handleKeyDown)
      window.addEventListener('keyup', scene.handleKeyUp)
    } else {
      window.removeEventListener('keydown', scene.handleKeyDown)
      window.removeEventListener('keyup', scene.handleKeyUp)
      scene.releaseKeys()
      game.loop.sleep()
    }
  }

  if (import.meta.env.DEV) {
    window.__larrutanHub = {
      playerTile: () => scene.getPlayerTile(),
      isMoving: () => scene.isMoving(),
      outfit: () => scene.getOutfit(),
      stationPoint: (challenge) => scene.stationScreenPoint(challenge),
    }
  }

  return {
    setActive,
    setOutfit: (outfit) => scene.setOutfit(outfit),
    destroy() {
      setActive(false)
      game.destroy(true)
      if (import.meta.env.DEV) delete window.__larrutanHub
    },
  }
}
