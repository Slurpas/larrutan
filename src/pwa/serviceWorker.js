// The offline cache (PRD §12): the whole game is stored on the device, so it starts and plays,
// voice included, without a network. This is a template: the serviceWorker plugin in
// vite.config.ts fills in VERSION and FILES (every file of the build) and writes it as sw.js.
const VERSION = '__VERSION__'
const FILES = __FILES__
const CACHE = `larrutan-${VERSION}`

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(FILES)))
})

// A new version takes over the next time the game starts, never in the middle of a round.
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key.startsWith('larrutan-') && key !== CACHE).map((key) => caches.delete(key))))
      .then(() => self.clients.claim()),
  )
})

self.addEventListener('fetch', (event) => {
  const request = event.request
  if (request.method !== 'GET' || new URL(request.url).origin !== self.location.origin) return
  event.respondWith(respond(request))
})

async function respond(request) {
  const cache = await caches.open(CACHE)
  // Every page address (?seed=…, ?debug=voices) is the same one-page game. ignoreVary: hosts send
  // "Vary: Origin", and the game's scripts are requested with an Origin header the cached copy lacks.
  const cached = await cache.match(request.mode === 'navigate' ? './' : request, { ignoreVary: true })
  if (!cached) return fetch(request)
  const range = request.headers.get('range')
  if (range) return partialResponse(cached, range)
  // Browsers refuse a response that was redirected when it was stored (e.g. by a host's "pretty URLs").
  return cached.redirected ? new Response(cached.body, { status: cached.status, statusText: cached.statusText, headers: cached.headers }) : cached
}

// Safari only plays audio that answers its range requests ("bytes=0-1") with 206 Partial Content.
async function partialResponse(response, range) {
  const body = await response.clone().arrayBuffer()
  const size = body.byteLength
  const match = /^bytes=(\d*)-(\d*)$/.exec(range.trim())
  if (!match || (match[1] === '' && match[2] === '')) return response
  let start
  let end
  if (match[1] === '') {
    // "bytes=-500": the last 500 bytes
    start = Math.max(size - Number(match[2]), 0)
    end = size - 1
  } else {
    start = Number(match[1])
    end = match[2] === '' ? size - 1 : Math.min(Number(match[2]), size - 1)
  }
  if (start > end) return new Response(null, { status: 416, headers: { 'Content-Range': `bytes */${size}` } })
  return new Response(body.slice(start, end + 1), {
    status: 206,
    headers: {
      'Content-Type': response.headers.get('Content-Type') ?? 'application/octet-stream',
      'Content-Range': `bytes ${start}-${end}/${size}`,
      'Content-Length': String(end - start + 1),
      'Accept-Ranges': 'bytes',
    },
  })
}
