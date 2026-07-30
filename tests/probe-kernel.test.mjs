// @vitest-environment node

import { afterEach, describe, expect, it, vi } from 'vitest'
import handler from '../api/probe-kernel.mjs'

function createResponse() {
  const headers = new Map()
  const chunks = []
  return {
    headers,
    chunks,
    statusCode: 200,
    ended: false,
    setHeader(name, value) {
      headers.set(name.toLowerCase(), String(value))
    },
    status(code) {
      this.statusCode = code
      return this
    },
    send(body) {
      this.chunks.push(new TextEncoder().encode(String(body)))
      this.ended = true
    },
    write(chunk) {
      this.chunks.push(new Uint8Array(chunk))
    },
    end() {
      this.ended = true
    },
    destroy() {
      this.ended = true
    },
  }
}

afterEach(() => vi.unstubAllGlobals())

describe('fixed Linux probe proxy', () => {
  it('rejects methods other than GET and HEAD without contacting upstream', async () => {
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)
    const response = createResponse()

    await handler({ method: 'POST' }, response)

    expect(response.statusCode).toBe(405)
    expect(response.headers.get('allow')).toBe('GET, HEAD')
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('streams only the fixed upstream with explicit integrity-sized headers', async () => {
    const payload = Uint8Array.of(0x4b, 0x4c, 0x41, 0x42)
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(payload, {
        headers: { 'content-length': '5166352' },
      }),
    )
    vi.stubGlobal('fetch', fetchMock)
    const response = createResponse()

    await handler({ method: 'GET' }, response)

    expect(fetchMock).toHaveBeenCalledWith(
      'https://i.copy.sh/buildroot-bzimage.bin',
      expect.objectContaining({
        method: 'GET',
        headers: expect.objectContaining({
          'User-Agent': 'KernelLab-TechnicalProbe/0.1',
        }),
      }),
    )
    expect(response.statusCode).toBe(200)
    expect(response.headers.get('content-length')).toBe('5166352')
    expect(response.headers.get('vercel-cdn-cache-control')).toBe(
      'public, max-age=43200',
    )
    expect(response.chunks).toEqual([payload])
    expect(response.ended).toBe(true)
  })
})
