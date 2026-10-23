/**
 * The pixel art palette (docs/ART_DIRECTION.md): Kenney's Tiny Town colours, so our own
 * sprites match its scenery. Sprites are text grids with one character per colour;
 * "." is transparent. Several characters may share a colour when their roles differ.
 */
export const palette: Readonly<Record<string, string>> = {
  o: '#3f2631', // outline, eyes
  w: '#ffffff',
  // Skin, with its shadow and cheeks
  s: '#fcbc8f',
  z: '#eaa56c',
  c: '#f28462',
  // Hair
  h: '#763b36',
  j: '#bd6c4a',
  // Shirt (red), light and dark
  r: '#e84537',
  R: '#c34b35',
  p: '#ff706d',
  // Trousers and shoes
  b: '#5a6988',
  B: '#262b44',
  k: '#763b36',
  // Stone
  g: '#c0cbdc',
  n: '#8b9bb4',
  m: '#5a6988',
  // Wood
  d: '#bd6c4a',
  D: '#763b36',
  L: '#eaa56c',
  // Water
  u: '#009adc',
  U: '#76e4ff',
  // Yellow and orange
  y: '#fdbe53',
  Y: '#e38628',
  // Grass and leaves
  q: '#84c669',
  Q: '#65a556',
  G: '#479f4a',
}
