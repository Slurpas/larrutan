import Phaser from 'phaser'
import type { ChallengeId } from '../challenges/challengeIds'
import { characterFeetRow, characterHeadTop, characterSize } from '../art/character'
import { tinyTown } from '../art/kenney'
import { signPanel, signSize } from '../art/signs'
import { TILE, cameraZoom } from './camera'
import { groundTile } from './groundTiles'
import { findPath, nearestWalkable } from './pathfinding'
import {
  addArtTextures,
  characterFrameKey,
  iconKeys,
  rockKey,
  shadowKey,
  signKey,
  tinyTownKey,
  waterTexture,
  type CharacterFacing,
} from './textures'
import {
  sameTile,
  stationApproaches,
  stationAt,
  stationNextTo,
  tryStep,
  type Direction,
  type Station,
  type Tile,
  type TileMap,
} from './tileMap'

/** Tiles per second. */
const WALK_SPEED = 4.5

/** What each station's sign shows: pictures (src/art/signs.ts) and letters (in Andika). */
const stationContent: Record<ChallengeId, { pictures: (keyof typeof iconKeys)[]; letters: string }> = {
  findLetter: { pictures: [], letters: 'AÖ' },
  firstLetter: { pictures: ['sun'], letters: 'S' },
  wordPicture: { pictures: ['apple', 'mouse'], letters: '' },
}

/** Walk frames per second, and where the feet are: the bottom of the tile the character stands on. */
const WALK_FRAMES_PER_SECOND = 8
const FEET_Y = TILE / 2

const keyDirections: Record<string, Direction> = {
  ArrowUp: 'up',
  ArrowDown: 'down',
  ArrowLeft: 'left',
  ArrowRight: 'right',
  w: 'up',
  s: 'down',
  a: 'left',
  d: 'right',
}

export interface HubSceneOptions {
  map: TileMap
  onOpenStation: (challenge: ChallengeId) => void
}

interface StationMarker {
  station: Station
  sign: Phaser.GameObjects.Image
  container: Phaser.GameObjects.Container
}

const tileCenter = (tile: Tile) => ({ x: (tile.col + 0.5) * TILE, y: (tile.row + 0.5) * TILE })

/**
 * The hub area: the child taps a spot to walk there, taps a sign to walk to it
 * and open its challenge, or uses the arrow keys / WASD and Enter / Space.
 * 16×16 pixel art (docs/ART_DIRECTION.md): Kenney's Tiny Town scenery plus our
 * own water, rocks, signs and character (src/art).
 */
export class HubScene extends Phaser.Scene {
  private readonly map: TileMap
  private readonly onOpenStation: (challenge: ChallengeId) => void
  private readonly reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

  private player!: Phaser.GameObjects.Container
  private playerSprite!: Phaser.GameObjects.Image
  private facing: CharacterFacing = 'down'
  private hatText: Phaser.GameObjects.Text | null = null
  /** The worn hat (emoji); may be set before the scene has been created. */
  private hat: string | null = null
  private playerTile: Tile
  /** The tile the player is walking into right now, if any. */
  private moveTarget: Tile | null = null
  private path: Tile[] = []
  /** Opened once the player arrives next to it. */
  private pendingStation: Station | null = null
  private readonly heldKeys: Direction[] = []
  /** A quick key tap still moves one step, even if the key is released before the next frame. */
  private queuedStep: Direction | null = null
  private markers: StationMarker[] = []
  private highlighted: Station | undefined
  /** Frames drawn so far; the camera's view is only known after the first one. */
  private frames = 0
  private lastTime: number | null = null

  constructor({ map, onOpenStation }: HubSceneOptions) {
    super('hub')
    this.map = map
    this.onOpenStation = onOpenStation
    this.playerTile = map.start
  }

  preload() {
    this.load.spritesheet(tinyTownKey, tinyTown.url, { frameWidth: tinyTown.tileSize, frameHeight: tinyTown.tileSize })
  }

  create() {
    addArtTextures(this)
    this.drawGround()
    this.markers = this.map.stations.map((station) => this.drawStation(station))
    this.player = this.drawPlayer()
    const start = tileCenter(this.playerTile)
    this.player.setPosition(start.x, start.y)

    const camera = this.cameras.main
    camera.setBounds(0, 0, this.map.cols * TILE, this.map.rows * TILE)
    this.fitCamera()
    camera.centerOn(start.x, start.y)
    camera.startFollow(this.player, false, 0.12, 0.12)

    this.scale.on('resize', this.fitCamera, this)
    this.input.on('pointerdown', this.handlePointer, this)
    this.updateHighlight()
  }

  update() {
    this.frames++
    // Phaser's own time and delta are smoothed towards its target frame rate, so on a slow
    // device the character would walk in slow motion. Use the real clock, capped after pauses.
    const now = performance.now()
    const delta = this.lastTime === null ? 0 : Math.min(now - this.lastTime, 100)
    this.lastTime = now

    if (!this.moveTarget) {
      const next = this.path.shift() ?? this.keyboardStep()
      if (next) {
        this.moveTarget = next
      } else if (this.pendingStation) {
        const station = this.pendingStation
        this.pendingStation = null
        this.openStation(station)
      }
    }

    if (this.moveTarget) {
      const target = tileCenter(this.moveTarget)
      const stepLength = (WALK_SPEED * TILE * delta) / 1000
      const dx = target.x - this.player.x
      const dy = target.y - this.player.y
      const distance = Math.hypot(dx, dy)
      if (distance <= stepLength) {
        this.player.setPosition(target.x, target.y)
        this.playerTile = this.moveTarget
        this.moveTarget = null
        this.updateHighlight()
      } else {
        this.player.setPosition(this.player.x + (dx / distance) * stepLength, this.player.y + (dy / distance) * stepLength)
      }
    }

    this.animatePlayer(now)
  }

  /** Faces the way the character walks and steps through the walk frames; stands still otherwise. */
  private animatePlayer(now: number) {
    let frame = 0
    if (this.moveTarget) {
      const target = tileCenter(this.moveTarget)
      const dx = target.x - this.player.x
      const dy = target.y - this.player.y
      if (dx !== 0 || dy !== 0) {
        this.facing = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'side' : 'left') : dy > 0 ? 'down' : 'up'
      }
      frame = Math.floor((now / 1000) * WALK_FRAMES_PER_SECOND) % 4
    }
    this.playerSprite.setTexture(characterFrameKey(this.facing, frame))
    // Drawn in front of whatever is above it on the map, and behind what is below.
    this.player.setDepth(this.player.y + FEET_Y)
  }

  // --- Input -------------------------------------------------------------

  readonly handleKeyDown = (event: KeyboardEvent) => {
    const direction = keyDirections[event.key] ?? keyDirections[event.key.toLowerCase()]
    if (direction) {
      event.preventDefault()
      // The keyboard takes over from any walk started by a tap.
      this.path = []
      this.pendingStation = null
      if (!this.heldKeys.includes(direction)) this.heldKeys.push(direction)
      if (!event.repeat) this.queuedStep = direction
    } else if ((event.key === 'Enter' || event.key === ' ') && !event.repeat) {
      event.preventDefault()
      const station = this.moveTarget ? undefined : stationNextTo(this.map, this.playerTile)
      if (station) this.openStation(station)
    }
  }

  readonly handleKeyUp = (event: KeyboardEvent) => {
    const direction = keyDirections[event.key] ?? keyDirections[event.key.toLowerCase()]
    const index = direction ? this.heldKeys.indexOf(direction) : -1
    if (index !== -1) this.heldKeys.splice(index, 1)
  }

  /** Forget held keys, e.g. when a challenge opens over the map mid key-press. */
  releaseKeys() {
    this.heldKeys.length = 0
    this.queuedStep = null
  }

  private keyboardStep(): Tile | null {
    const direction = this.heldKeys.at(-1) ?? this.queuedStep
    this.queuedStep = null
    if (!direction) return null
    const next = tryStep(this.map, this.playerTile, direction)
    return sameTile(next, this.playerTile) ? null : next
  }

  private handlePointer(pointer: Phaser.Input.Pointer) {
    const world = pointer.positionToCamera(this.cameras.main) as Phaser.Math.Vector2
    const tapped = { col: Math.floor(world.x / TILE), row: Math.floor(world.y / TILE) }
    const station = stationAt(this.map, tapped)

    if (station) {
      this.walkTo(stationApproaches(this.map, station), station)
    } else {
      const goal = nearestWalkable(this.map, tapped)
      if (goal) this.walkTo([goal], null)
    }
  }

  private walkTo(goals: Tile[], station: Station | null) {
    // Finish the step in progress, then follow the new route from there.
    const from = this.moveTarget ?? this.playerTile
    const path = findPath(this.map, from, goals)
    if (path === null) return
    this.releaseKeys()
    this.path = path
    this.pendingStation = station
  }

  private openStation(station: Station) {
    this.path = []
    this.pendingStation = null
    this.releaseKeys()
    this.onOpenStation(station.challenge)
  }

  // --- Camera ------------------------------------------------------------

  private fitCamera() {
    const { width, height } = this.scale
    if (width === 0 || height === 0) return
    this.cameras.main.setZoom(cameraZoom(width, height, this.map.cols * TILE, this.map.rows * TILE))
  }

  // --- Drawing --------------------------------------------------------------

  /**
   * Every tile once (src/world/groundTiles.ts): Kenney's grass, paths, houses, trees and
   * flowers; our water and rocks. Tall trees are sorted by depth with the character, so
   * the child can walk behind their crowns.
   */
  private drawGround() {
    for (let row = 0; row < this.map.rows; row++) {
      for (let col = 0; col < this.map.cols; col++) {
        const x = col * TILE
        const y = row * TILE
        const ground = groundTile(this.map, { col, row })
        if (ground.kind === 'water') {
          this.add.image(x, y, waterTexture(this, ground.edges, ground.variant)).setOrigin(0)
        } else if (ground.kind === 'ground') {
          this.add.image(x, y, tinyTownKey, ground.frame).setOrigin(0)
        } else if (ground.kind === 'decor') {
          this.add.image(x, y, tinyTownKey, ground.under).setOrigin(0)
          if (ground.decor === 'rock') this.add.image(x, y, rockKey).setOrigin(0)
          else this.add.image(x, y, tinyTownKey, ground.decor).setOrigin(0)
        } else {
          this.add.image(x, y, tinyTownKey, ground.under).setOrigin(0)
          const depth = y + TILE
          this.add.image(x, y, tinyTownKey, ground.trunk).setOrigin(0).setDepth(depth)
          this.add.image(x, y - TILE, tinyTownKey, ground.crown).setOrigin(0).setDepth(depth)
        }
      }
    }
  }

  private drawStation(station: Station): StationMarker {
    // The container sits at the centre of the 2×2 block (tests tap there); the sign fills the block.
    const x = (station.origin.col + 1) * TILE
    const y = (station.origin.row + 1) * TILE
    const sign = this.add.image(0, signSize.height / 2, signKey(false)).setOrigin(0.5, 1)

    // The panel's centre, relative to the container.
    const panelX = -signSize.width / 2 + signPanel.x + signPanel.width / 2
    const panelY = -signSize.height / 2 + signPanel.y + signPanel.height / 2
    const { pictures, letters } = stationContent[station.challenge]
    const items: Phaser.GameObjects.GameObject[] = [sign]
    const slots = pictures.length + (letters ? 1 : 0)
    const slotX = (index: number) => panelX + (slots === 1 ? 0 : index === 0 ? -6 : 6)
    pictures.forEach((picture, index) => items.push(this.add.image(slotX(index), panelY, iconKeys[picture])))
    if (letters) {
      // Letters are never pixel art: Andika, rendered large and scaled down so they stay sharp.
      const text = this.add
        .text(slotX(pictures.length), panelY + 0.5, letters, {
          fontFamily: 'Andika, ui-rounded, "Segoe UI", system-ui, sans-serif',
          fontSize: '96px',
          fontStyle: 'bold',
          color: '#3f2631',
        })
        .setOrigin(0.5)
      text.setScale((signPanel.height * 0.95) / text.height)
      text.texture.setFilter(Phaser.Textures.FilterMode.LINEAR)
      items.push(text)
    }

    const container = this.add.container(x, y, items).setDepth((station.origin.row + 2) * TILE)
    if (!this.reducedMotion) {
      // A gentle one-pixel bob, so the signs look alive and invite a tap.
      this.tweens.add({
        targets: container,
        y: y - 1,
        duration: 700,
        yoyo: true,
        repeat: -1,
        ease: 'Stepped',
        delay: station.origin.col * 37,
      })
    }
    return { station, sign, container }
  }

  private drawPlayer(): Phaser.GameObjects.Container {
    const shadow = this.add.image(0, FEET_Y - 1, shadowKey).setAlpha(0.25)
    this.playerSprite = this.add
      .image(0, FEET_Y, characterFrameKey('down', 0))
      .setOrigin(0.5, (characterFeetRow + 1) / characterSize.height)

    // The worn hat sits on top of the head.
    const headTop = FEET_Y - (characterFeetRow + 1 - characterHeadTop)
    this.hatText = this.add
      .text(0, headTop + 7, '', { fontFamily: '"Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif', fontSize: '64px' })
      .setOrigin(0.5, 1)
      .setScale(0.16)
    this.hatText.texture.setFilter(Phaser.Textures.FilterMode.LINEAR)
    this.applyHat()

    return this.add.container(0, 0, [shadow, this.playerSprite, this.hatText])
  }

  /** Shows the worn hat (an emoji) on the character, or none. */
  setHat(hat: string | null) {
    this.hat = hat
    this.applyHat()
  }

  private applyHat() {
    if (!this.hatText) return
    this.hatText.setText(this.hat ?? '')
    this.hatText.setVisible(this.hat !== null)
  }

  private updateHighlight() {
    const next = stationNextTo(this.map, this.playerTile)
    if (next === this.highlighted) return
    this.highlighted = next
    for (const marker of this.markers) marker.sign.setTexture(signKey(marker.station === next))
  }

  // --- For tests (dev builds only, see hubGame.ts) -----------------------

  getPlayerTile(): Tile {
    return { ...this.playerTile }
  }

  getHat(): string | null {
    return this.hatText?.visible ? this.hat : null
  }

  isMoving(): boolean {
    return this.moveTarget !== null || this.path.length > 0
  }

  /** Where a station is on screen, in CSS pixels relative to the canvas. */
  stationScreenPoint(challenge: ChallengeId): { x: number; y: number } | null {
    const marker = this.markers.find((m) => m.station.challenge === challenge)
    if (!marker || this.frames < 2) return null
    const camera = this.cameras.main
    return {
      x: (marker.container.x - camera.worldView.x) * camera.zoom,
      y: (marker.container.y - camera.worldView.y) * camera.zoom,
    }
  }
}
