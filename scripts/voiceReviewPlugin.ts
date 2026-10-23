import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import type { IncomingMessage, ServerResponse } from 'node:http'
import { join } from 'node:path'
import type { Plugin } from 'vite'
import { applyReview, noApprovals, voiceReviewEndpoint, type Approvals } from '../src/speech/review/approvals.ts'

/**
 * Lets the clip review page save approvals to src/speech/audio/sv/approvals.json
 * (PRD §7). Only the dev server has it, so the hosted game can't change anything.
 */
export function voiceReview(): Plugin {
  return {
    name: 'larrutan-voice-review',
    apply: 'serve',
    configureServer(server) {
      const audioDir = join(server.config.root, 'src/speech/audio/sv')
      const approvalsPath = join(audioDir, 'approvals.json')
      const readApprovals = (): Approvals =>
        existsSync(approvalsPath) ? (JSON.parse(readFileSync(approvalsPath, 'utf8')) as Approvals) : noApprovals

      server.middlewares.use(voiceReviewEndpoint, (request, response) => {
        if (request.method === 'GET') {
          send(response, 200, readApprovals())
          return
        }
        if (request.method !== 'POST') {
          send(response, 405, { error: 'GET or POST only' })
          return
        }
        readBody(request)
          .then((body) => {
            const manifest = JSON.parse(readFileSync(join(audioDir, 'clips.json'), 'utf8')) as {
              clips: { text: string; file: string }[]
            }
            const clipTexts = new Map(manifest.clips.map((clip) => [clip.file, clip.text]))
            const approvals = applyReview(readApprovals(), JSON.parse(body), clipTexts, new Date())
            writeFileSync(approvalsPath, `${JSON.stringify(approvals, null, 2)}\n`, 'utf8')
            send(response, 200, approvals)
          })
          .catch((error: unknown) => send(response, 400, { error: String(error) }))
      })
    },
  }
}

function send(response: ServerResponse, status: number, body: unknown) {
  response.statusCode = status
  response.setHeader('Content-Type', 'application/json')
  response.end(JSON.stringify(body))
}

/** A review is a few hundred bytes; anything much bigger is refused. */
function readBody(request: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    let body = ''
    request.setEncoding('utf8')
    request.on('data', (chunk: string) => {
      body += chunk
      if (body.length > 4096) {
        reject(new Error('Request too large'))
        request.destroy()
      }
    })
    request.on('end', () => resolve(body))
    request.on('error', reject)
  })
}
