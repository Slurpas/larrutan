import Phaser from 'phaser'
import type { ChallengeId } from '../challenges/challengeIds'
import { TILE, cameraZoom } from './camera'
import { findPath, nearestWalkable } from './pathfinding'
import {
  kindAt,
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

/** Placeholder palette until Phase 2 art (PRD §9). Matches the CSS tokens. */
const colors = {
  ink: 0x2b4a6b,
  grass: 0x7cc56f,
  grassDark: 0x77c06a,
  path: 0xe9d7a1,
  pathEdge: 0xd8c48a,
  water: 0x6fc3ee,
  waterLight: 0xa6dcf7,
  trunk: 0x8a5a3b,
  leaves: 0x3f8f4a,
  leavesLight: 0x5fb35f,
  rock: 0xa7b0ba,
  rockLight: 0xc5ccd3,
  sign: 0xffffff,
  signHighlight: 0xffe28a,
  post: 0x8a5a3b,
  player: 0xff8a5b,
  flowers: [0xffffff, 0xffe066, 0xff9ecb],
} as const

/** Tiles per second. */
const WALK_SPEED = 4.5

const stationIcons: Record<ChallengeId, string> = {
  findLetter: 'AÖ',
  firstLetter: '☀️S',
  wordPicture: '🍎🐭',
}

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
  sign: Phaser.GameObjects.Graphics
  container: Phaser.GameObjects.Container
}

const tileCenter = (tile: Tile) => ({ x: (tile.col + 0.5) * TILE, y: (tile.row + 0.5) * TILE })

/**
 * The hub area: the child taps a spot to walk there, taps a sign to walk to it
 * and open its challenge, or uses the arrow keys / WASD and Enter / Space.
 * Placeholder shapes only; real art comes in Phase 2.
 */
export class HubScene extends Phaser.Scene {
  private readonly map: TileMap
  private readonly onOpenStation: (challenge: ChallengeId) => void
  private readonly reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

  private player!: Phaser.GameObjects.Container
  private playerBody!: Phaser.GameObjects.Container
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

  create() {
    this.drawGround()
    this.drawObstacles()
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

    // A small hop while walking.
    const walking = this.moveTarget !== null && !this.reducedMotion
    this.playerBody.y = walking ? -Math.abs(Math.sin(this.time.now / 70)) * 1.5 : 0
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

  // --- Drawing (placeholders) --------------------------------------------

  private drawGround() {
    const g = this.add.graphics()
    for (let row = 0; row < this.map.rows; row++) {
      for (let col = 0; col < this.map.cols; col++) {
        const x = col * TILE
        const y = row * TILE
        const kind = kindAt(this.map, { col, row })
        g.fillStyle((col + row) % 2 === 0 ? colors.grass : colors.grassDark)
        g.fillRect(x, y, TILE, TILE)

        if (kind === 'path') {
          g.fillStyle(colors.path)
          g.fillRect(x, y, TILE, TILE)
          // A darker edge wherever the path meets grass, so it reads as one continuous path.
          g.lineStyle(1.5, colors.pathEdge)
          const isPath = (dc: number, dr: number) => kindAt(this.map, { col: col + dc, row: row + dr }) === 'path'
          if (!isPath(0, -1)) g.lineBetween(x, y + 0.75, x + TILE, y + 0.75)
          if (!isPath(0, 1)) g.lineBetween(x, y + TILE - 0.75, x + TILE, y + TILE - 0.75)
          if (!isPath(-1, 0)) g.lineBetween(x + 0.75, y, x + 0.75, y + TILE)
          if (!isPath(1, 0)) g.lineBetween(x + TILE - 0.75, y, x + TILE - 0.75, y + TILE)
        } else if (kind === 'water') {
          g.fillStyle(colors.water)
          g.fillRect(x, y, TILE, TILE)
          g.lineStyle(1, colors.waterLight)
          g.lineBetween(x + 3, y + 5, x + 8, y + 5)
          g.lineBetween(x + 8, y + 11, x + 13, y + 11)
        } else if (kind === 'flowers') {
          colors.flowers.forEach((color, i) => {
            g.fillStyle(color)
            g.fillCircle(x + 4 + i * 4, y + 5 + (i % 2) * 6, 1.3)
          })
        }
      }
    }
  }

  private drawObstacles() {
    const g = this.add.graphics()
    for (let row = 0; row < this.map.rows; row++) {
      for (let col = 0; col < this.map.cols; col++) {
        const { x, y } = tileCenter({ col, row })
        const kind = kindAt(this.map, { col, row })
        if (kind === 'tree') {
          g.fillStyle(colors.trunk)
          g.fillRect(x - 1.5, y + 2, 3, 6)
          g.fillStyle(colors.leaves)
          g.lineStyle(1, colors.ink)
          g.fillCircle(x, y - 1, 7)
          g.strokeCircle(x, y - 1, 7)
          g.fillStyle(colors.leavesLight)
          g.fillCircle(x - 2.5, y - 3.5, 2.5)
        } else if (kind === 'rock') {
          g.fillStyle(colors.rock)
          g.lineStyle(1, colors.ink)
          g.fillEllipse(x, y + 1, 13, 10)
          g.strokeEllipse(x, y + 1, 13, 10)
          g.fillStyle(colors.rockLight)
          g.fillEllipse(x - 2, y - 1, 5, 3)
        }
      }
    }
  }

  private drawStation(station: Station): StationMarker {
    // Centre of the 2×2 block.
    const x = (station.origin.col + 1) * TILE
    const y = (station.origin.row + 1) * TILE

    // Sign and post stay inside the 2×2 block, so they never cover the child standing next to it.
    const post = this.add.graphics()
    post.fillStyle(colors.post)
    post.lineStyle(1, colors.ink)
    post.fillRect(-2, 6, 4, 9)
    post.strokeRect(-2, 6, 4, 9)

    const sign = this.add.graphics()
    this.paintSign(sign, false)

    // Text is rendered large and scaled down so it stays sharp when the camera zooms in.
    const icon = this.add
      .text(0, -2, stationIcons[station.challenge], {
        fontFamily: 'ui-rounded, "SF Pro Rounded", "Segoe UI", system-ui, "Apple Color Emoji", "Segoe UI Emoji", sans-serif',
        fontSize: '64px',
        fontStyle: 'bold',
        color: '#2b4a6b',
      })
      .setOrigin(0.5)
      .setScale(0.22)

    const board = this.add.container(0, 0, [sign, icon])
    const container = this.add.container(x, y, [post, board])

    if (!this.reducedMotion) {
      this.tweens.add({
        targets: board,
        y: -1.5,
        duration: 900,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
        delay: station.origin.col * 37,
      })
    }
    return { station, sign, container }
  }

  private paintSign(sign: Phaser.GameObjects.Graphics, highlighted: boolean) {
    sign.clear()
    sign.fillStyle(colors.ink)
    sign.fillRoundedRect(-15, -13, 30, 22, 5)
    sign.fillStyle(highlighted ? colors.signHighlight : colors.sign)
    sign.fillRoundedRect(-13.5, -11.5, 27, 19, 4)
  }

  private drawPlayer(): Phaser.GameObjects.Container {
    const shadow = this.add.graphics()
    shadow.fillStyle(0x000000, 0.18)
    shadow.fillEllipse(0, 6, 11, 4)

    const body = this.add.graphics()
    body.fillStyle(colors.player)
    body.lineStyle(1.2, colors.ink)
    body.fillCircle(0, 0, 6)
    body.strokeCircle(0, 0, 6)
    body.fillStyle(colors.ink)
    body.fillCircle(-2.1, -1.2, 0.9)
    body.fillCircle(2.1, -1.2, 0.9)
    body.lineStyle(0.9, colors.ink)
    body.beginPath()
    body.arc(0, 0.6, 2.4, 0.15 * Math.PI, 0.85 * Math.PI)
    body.strokePath()

    // The worn hat sits on top of the head and hops along with it.
    this.hatText = this.add
      .text(0, -4.5, '', { fontFamily: '"Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif', fontSize: '64px' })
      .setOrigin(0.5, 1)
      .setScale(0.15)
    this.applyHat()

    this.playerBody = this.add.container(0, 0, [body, this.hatText])
    return this.add.container(0, 0, [shadow, this.playerBody]).setDepth(10)
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
    for (const marker of this.markers) {
      const on = marker.station === next
      this.paintSign(marker.sign, on)
      marker.container.setScale(on ? 1.12 : 1)
    }
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
