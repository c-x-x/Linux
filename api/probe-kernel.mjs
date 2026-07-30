const SOURCE_URL = 'https://i.copy.sh/buildroot-bzimage.bin'
const EXPECTED_SIZE = 5_166_352

export default async function handler(request, response) {
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    response.setHeader('Allow', 'GET, HEAD')
    response.status(405).send('Method Not Allowed')
    return
  }

  let upstream
  try {
    upstream = await fetch(SOURCE_URL, {
      method: request.method,
      headers: {
        'User-Agent': 'KernelLab-TechnicalProbe/0.1',
        Accept: 'application/octet-stream',
      },
    })
  } catch {
    response.status(502).send('Linux probe source is unavailable')
    return
  }

  if (!upstream.ok || (request.method === 'GET' && !upstream.body)) {
    response.status(502).send('Linux probe source is unavailable')
    return
  }

  const upstreamLengthHeader = upstream.headers.get('content-length')
  if (upstreamLengthHeader !== null) {
    const upstreamLength = Number(upstreamLengthHeader)
    if (!Number.isFinite(upstreamLength) || upstreamLength !== EXPECTED_SIZE) {
      response.status(502).send('Linux probe source size changed')
      return
    }
  }

  response.statusCode = 200
  response.setHeader('Content-Type', 'application/octet-stream')
  response.setHeader('Content-Length', String(EXPECTED_SIZE))
  response.setHeader('Cache-Control', 'public, max-age=0, must-revalidate')
  response.setHeader('Vercel-CDN-Cache-Control', 'public, max-age=43200')
  response.setHeader('X-Content-Type-Options', 'nosniff')

  if (request.method === 'HEAD') {
    response.end()
    return
  }

  const reader = upstream.body.getReader()
  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      response.write(value)
    }
    response.end()
  } catch {
    response.destroy()
  } finally {
    reader.releaseLock()
  }
}
