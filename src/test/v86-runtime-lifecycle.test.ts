import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const { v86Constructed } = vi.hoisted(() => ({
  v86Constructed: vi.fn(),
}))

vi.mock('v86', () => ({
  V86: class {
    constructor(options: unknown) {
      v86Constructed(options)
    }
  },
}))

import { V86Runtime } from '../features/vm/V86Runtime'

const manifest = {
  schemaVersion: 1,
  id: 'buildroot-linux-5.6.15-spike',
  runtimeVersion: '0.5.424',
  distributionMode: 'technical-probe-only',
  integrityStatus: 'sha256-recorded-source-unverified',
  assets: {
    wasm: { url: 'https://example.test/v86.wasm' },
    bios: { url: 'https://example.test/seabios.bin' },
    vgaBios: { url: 'https://example.test/vgabios.bin' },
    kernel: {
      url: '/api/probe-kernel',
      size: 1,
      sha256: '0'.repeat(64),
    },
  },
}

function manifestResponse() {
  return {
    ok: true,
    json: vi.fn().mockResolvedValue(manifest),
  } as unknown as Response
}

function kernelResponse() {
  return {
    ok: true,
    headers: { get: () => '1' },
    body: null,
    arrayBuffer: vi.fn().mockResolvedValue(Uint8Array.of(0).buffer),
  } as unknown as Response
}

function deferred<T>() {
  let resolve!: (value: T) => void
  let reject!: (reason?: unknown) => void
  const promise = new Promise<T>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise
    reject = rejectPromise
  })
  return { promise, resolve, reject }
}

describe('V86Runtime startup lifecycle', () => {
  beforeEach(() => {
    v86Constructed.mockReset()
    vi.stubGlobal('crypto', {
      subtle: {
        digest: vi.fn().mockResolvedValue(new Uint8Array(32).buffer),
      },
    })
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('aborts an in-flight kernel request without reporting an error', async () => {
    const fetchMock = vi.fn()
    let kernelSignal: AbortSignal | undefined
    fetchMock.mockResolvedValueOnce(manifestResponse())
    fetchMock.mockImplementationOnce(
      (_input: RequestInfo | URL, init?: RequestInit) =>
        new Promise<Response>((_resolve, reject) => {
          kernelSignal = init?.signal as AbortSignal | undefined
          kernelSignal?.addEventListener('abort', () => {
            reject(new DOMException('Aborted', 'AbortError'))
          })
        }),
    )
    vi.stubGlobal('fetch', fetchMock)

    const onStatus = vi.fn()
    const runtime = new V86Runtime({
      onByte: vi.fn(),
      onStatus,
      onShellReady: vi.fn(),
    })

    const starting = runtime.start()
    await vi.waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2))
    await runtime.destroy()
    await expect(starting).resolves.toBeUndefined()

    expect(kernelSignal?.aborted).toBe(true)
    expect(v86Constructed).not.toHaveBeenCalled()
    expect(onStatus.mock.calls.map(([event]) => event.phase)).not.toContain(
      'error',
    )
  })

  it('does not construct v86 when a fetch ignores abort and resolves late', async () => {
    const fetchMock = vi.fn()
    const pendingKernel = deferred<Response>()
    fetchMock.mockResolvedValueOnce(manifestResponse())
    fetchMock.mockImplementationOnce(() => pendingKernel.promise)
    vi.stubGlobal('fetch', fetchMock)

    const onStatus = vi.fn()
    const runtime = new V86Runtime({
      onByte: vi.fn(),
      onStatus,
      onShellReady: vi.fn(),
    })

    const starting = runtime.start()
    await vi.waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2))
    await runtime.destroy()
    const lateResponse = kernelResponse()
    pendingKernel.resolve(lateResponse)
    await expect(starting).resolves.toBeUndefined()

    expect(v86Constructed).not.toHaveBeenCalled()
    expect(lateResponse.arrayBuffer).not.toHaveBeenCalled()
    expect(onStatus.mock.calls.map(([event]) => event.phase)).not.toContain(
      'error',
    )
  })

  it('rejects an incompatible snapshot fingerprint before downloading the kernel', async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce(manifestResponse())
    vi.stubGlobal('fetch', fetchMock)

    const runtime = new V86Runtime({
      onByte: vi.fn(),
      onStatus: vi.fn(),
      onShellReady: vi.fn(),
    })

    await expect(
      runtime.start(new ArrayBuffer(1), 'f'.repeat(64)),
    ).rejects.toThrow('本地检查点与当前虚拟机配置指纹不一致')

    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(v86Constructed).not.toHaveBeenCalled()
  })
})
