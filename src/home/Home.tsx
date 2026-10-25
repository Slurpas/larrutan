import { useEffect, useEffectEvent, useLayoutEffect, useRef, useState, type CSSProperties } from 'react'
import { bedArt, floorTile, mirrorArt, mirrorGlass, rugArt, wallTile, wardrobeOpen, wardrobeShut, windowArt } from '../art/home'
import { composeCharacter, outfitFeetRow, type CharacterFacing } from '../art/outfit'
import { useProgress } from '../rewards/store'
import { playEffect } from '../speech/speech'
import { DoorIcon, StarIcon } from '../ui/icons'
import { pixelBackground } from '../ui/pixelImage'
import { PixelSprite } from '../ui/PixelSprite'
import { RoundButton } from '../ui/RoundButton'
import styles from './Home.module.css'

const backgrounds = { wall: pixelBackground(wallTile), floor: pixelBackground(floorTile) }
/** The wardrobe stands open a moment before "Mina saker" comes up. */
const OPEN_MS = 450
/** A twirl in front of the mirror: each way the child faces, and how long; the back lingers, to see a cape or wings. */
const twirl: readonly { facing: CharacterFacing; ms: number }[] = [
  { facing: 'side', ms: 250 },
  { facing: 'up', ms: 1100 },
  { facing: 'left', ms: 250 },
]

interface HomeProps {
  onClose: () => void
  /** The wardrobe: "Mina saker". */
  onOpenWardrobe: () => void
}

/**
 * The child's room in the blue house (the child asked why they couldn't go into the houses,
 * 2026-10-25). The wardrobe holds the clothes ("Mina saker"); in front of the mirror the
 * child twirls round, so a cape or wings can be seen from behind. No words: the room
 * explains itself, and a star twinkles over the wardrobe.
 */
export function Home({ onClose, onOpenWardrobe }: HomeProps) {
  const outfit = useProgress().worn
  const [open, setOpen] = useState(false)
  const [twirlStep, setTwirlStep] = useState<number | null>(null)

  const sceneRef = useRef<HTMLElement>(null)
  const [size, setSize] = useState(() => ({ width: window.innerWidth, height: window.innerHeight }))
  useLayoutEffect(() => {
    const scene = sceneRef.current
    if (!scene) return
    const observer = new ResizeObserver(([entry]) => {
      if (entry) setSize({ width: entry.contentRect.width, height: entry.contentRect.height })
    })
    observer.observe(scene)
    return () => observer.disconnect()
  }, [])

  const openWardrobe = useEffectEvent(() => onOpenWardrobe())
  useEffect(() => {
    if (!open) return
    const timer = setTimeout(() => openWardrobe(), OPEN_MS)
    return () => clearTimeout(timer)
  }, [open])

  useEffect(() => {
    if (twirlStep === null) return
    const step = twirl[twirlStep]
    const timer = setTimeout(() => setTwirlStep(twirlStep + 1 < twirl.length ? twirlStep + 1 : null), step?.ms ?? 0)
    return () => clearTimeout(timer)
  }, [twirlStep])

  function handleWardrobe() {
    if (open) return
    playEffect('pop')
    setOpen(true)
  }

  function handleMirror() {
    if (twirlStep !== null) return
    playEffect('pop')
    setTwirlStep(0)
  }

  // Layout, in screen pixels: the wall above, the floor below, the furniture standing on it.
  // A whole-number zoom, a little bigger than the game scenes': the room has less in it.
  const px = Math.max(2, Math.min(6, Math.floor(Math.min(size.width / 200, size.height / 150))))
  const floorTop = Math.round(size.height * 0.66)
  const place = (grid: readonly string[], centerX: number, bottom: number): CSSProperties => {
    const width = (grid[0]?.length ?? 0) * px
    return { left: Math.round(centerX - width / 2), top: bottom - grid.length * px, width, height: grid.length * px }
  }
  const facing = twirlStep === null ? 'down' : (twirl[twirlStep]?.facing ?? 'down')
  const child = composeCharacter(facing, 0, outfit)
  const childX = size.width * 0.4
  const feet = floorTop + 18 * px
  const childBox: CSSProperties = {
    left: Math.round(childX - ((child[0]?.length ?? 0) * px) / 2),
    top: feet - (outfitFeetRow + 1) * px,
    width: (child[0]?.length ?? 0) * px,
    height: child.length * px,
  }
  const mirrorBox = place(mirrorArt, size.width * 0.64, floorTop + 10 * px)
  // The window in the middle of the wall, below the top bar.
  const windowBottom = Math.round(130 + (floorTop - 130 + windowArt.length * px) / 2)
  const glass = {
    left: mirrorGlass.x * px,
    top: mirrorGlass.y * px,
    width: mirrorGlass.width * px,
    height: mirrorGlass.height * px,
  }

  return (
    <main ref={sceneRef} className={styles.scene} aria-label="Hemma" style={{ '--px': `${px}px` } as CSSProperties}>
      <div className={styles.wall} style={{ height: floorTop, backgroundImage: backgrounds.wall }} />
      <div className={styles.floor} style={{ top: floorTop, backgroundImage: backgrounds.floor }} />

      <PixelSprite grid={windowArt} className={styles.sprite} style={place(windowArt, size.width * 0.5, windowBottom)} />
      <PixelSprite grid={bedArt} className={styles.sprite} style={place(bedArt, size.width * 0.86, floorTop + 26 * px)} />
      <PixelSprite grid={rugArt} className={styles.sprite} style={place(rugArt, childX, feet + 5 * px)} />

      <button type="button" className={styles.furniture} aria-label="Garderoben" style={place(open ? wardrobeOpen : wardrobeShut, size.width * 0.15, floorTop + 6 * px)} onClick={handleWardrobe}>
        <PixelSprite grid={open ? wardrobeOpen : wardrobeShut} className={styles.fill} />
        {!open && (
          <span className={styles.sparkle}>
            <StarIcon />
          </span>
        )}
      </button>

      <button type="button" className={styles.furniture} aria-label="Spegeln" style={mirrorBox} onClick={handleMirror}>
        <PixelSprite grid={mirrorArt} className={styles.fill} />
        {/* The reflection: the child, mirrored, inside the glass. */}
        <span className={styles.glass} style={glass}>
          <PixelSprite grid={child} className={styles.reflection} />
        </span>
      </button>

      <PixelSprite grid={child} className={styles.sprite} style={childBox} />

      <div className={styles.top}>
        <RoundButton label="Till kartan" onClick={onClose}>
          <DoorIcon />
        </RoundButton>
      </div>
    </main>
  )
}
