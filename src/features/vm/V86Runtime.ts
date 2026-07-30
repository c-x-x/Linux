import { V86 } from 'v86'

export const VM_VERSION = '0.5.424'
export const VM_IMAGE_ID = 'v86-buildroot-bzimage68-probe'
export const VM_MEMORY_SIZE = 64 * 1024 * 1024
const VM_VGA_MEMORY_SIZE = 8 * 1024 * 1024
const VM_CMDLINE = 'tsc=reliable mitigations=off random.trust_cpu=on'

export type VmPhase =
  | 'idle'
  | 'downloading'
  | 'initializing'
  | 'booting'
  | 'ready'
  | 'paused'
  | 'saving'
  | 'restoring'
  | 'stopped'
  | 'error'

export interface VmRuntimeEvent {
  phase: VmPhase
  message: string
  progress?: number
}

export interface V86RuntimeOptions {
  onByte: (byte: number) => void
  onStatus: (event: VmRuntimeEvent) => void
  onShellReady: () => void
}

interface ProbeAssetManifest {
  schemaVersion: 1
  id: string
  runtimeVersion: string
  distributionMode: 'technical-probe-only'
  integrityStatus: 'sha256-recorded-source-unverified'
  assets: {
    wasm: { url: string }
    bios: { url: string }
    vgaBios: { url: string }
    kernel: { url: string; size: number; sha256: string }
  }
}

const manifestUrl =
  import.meta.env.VITE_LINUX_ASSET_MANIFEST ?? '/assets-manifest.json'

function throwIfAborted(signal: AbortSignal) {
  if (signal.aborted) {
    throw new DOMException('虚拟机启动已取消', 'AbortError')
  }
}

async function loadProbeManifest(
  signal: AbortSignal,
): Promise<ProbeAssetManifest> {
  const response = await fetch(manifestUrl, {
    cache: 'no-store',
    credentials: 'same-origin',
    signal,
  })
  if (!response.ok) {
    throw new Error(`无法读取来宾资源清单（HTTP ${response.status}）`)
  }

  const candidate = (await response.json()) as Partial<ProbeAssetManifest>
  const assets = candidate.assets
  if (
    candidate.schemaVersion !== 1 ||
    candidate.id !== VM_IMAGE_ID ||
    candidate.runtimeVersion !== VM_VERSION ||
    candidate.distributionMode !== 'technical-probe-only' ||
    candidate.integrityStatus !== 'sha256-recorded-source-unverified' ||
    !assets?.wasm?.url ||
    !assets.bios?.url ||
    !assets.vgaBios?.url ||
    !assets.kernel?.url ||
    typeof assets.kernel.size !== 'number' ||
    !/^[a-f0-9]{64}$/.test(assets.kernel.sha256 ?? '')
  ) {
    throw new Error('来宾资源清单与当前技术探针不兼容')
  }

  return candidate as ProbeAssetManifest
}

async function fetchVerifiedKernel(
  asset: ProbeAssetManifest['assets']['kernel'],
  onProgress: (progress: number | undefined) => void,
  signal: AbortSignal,
) {
  const response = await fetch(asset.url, {
    credentials: 'same-origin',
    signal,
  })
  throwIfAborted(signal)
  if (!response.ok) {
    throw new Error(`无法下载 Linux 技术探针（HTTP ${response.status}）`)
  }

  const reportedSizeHeader = response.headers.get('content-length')
  if (reportedSizeHeader !== null) {
    const reportedSize = Number(reportedSizeHeader)
    if (Number.isFinite(reportedSize) && reportedSize !== asset.size) {
      throw new Error('Linux 技术探针大小与清单不一致')
    }
  }

  let buffer: ArrayBuffer
  if (response.body) {
    const reader = response.body.getReader()
    const bytes = new Uint8Array(asset.size)
    let offset = 0
    while (true) {
      const { done, value } = await reader.read()
      throwIfAborted(signal)
      if (done) break
      if (offset + value.byteLength > bytes.byteLength) {
        throw new Error('Linux 技术探针超过清单声明大小')
      }
      bytes.set(value, offset)
      offset += value.byteLength
      onProgress(Math.round((offset / asset.size) * 100))
    }
    if (offset !== asset.size) {
      throw new Error('Linux 技术探针下载不完整')
    }
    buffer = bytes.buffer
  } else {
    throwIfAborted(signal)
    buffer = await response.arrayBuffer()
    throwIfAborted(signal)
    onProgress(undefined)
  }

  if (buffer.byteLength !== asset.size) {
    throw new Error('Linux 技术探针大小与清单不一致')
  }

  throwIfAborted(signal)
  const digest = await crypto.subtle.digest('SHA-256', buffer)
  throwIfAborted(signal)
  const digestHex = Array.from(new Uint8Array(digest), (byte) =>
    byte.toString(16).padStart(2, '0'),
  ).join('')
  if (digestHex !== asset.sha256) {
    throw new Error('Linux 技术探针 SHA-256 校验失败')
  }

  return buffer
}

async function createSnapshotFingerprint(manifest: ProbeAssetManifest) {
  const configuration = JSON.stringify({
    schemaVersion: manifest.schemaVersion,
    imageId: manifest.id,
    runtimeVersion: manifest.runtimeVersion,
    assets: manifest.assets,
    memorySize: VM_MEMORY_SIZE,
    vgaMemorySize: VM_VGA_MEMORY_SIZE,
    cmdline: VM_CMDLINE,
    filesystem: {},
    disableKeyboard: true,
    disableMouse: true,
    disableSpeaker: true,
  })
  const digest = await crypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(configuration),
  )
  return Array.from(new Uint8Array(digest), (byte) =>
    byte.toString(16).padStart(2, '0'),
  ).join('')
}

export class V86Runtime {
  private emulator: V86 | null = null
  private bootTail = ''
  private decoder = new TextDecoder()
  private bootTimeout: number | null = null
  private shellReady = false
  private probeSent = false
  private startController: AbortController | null = null
  private startGeneration = 0
  private destroyed = false
  private snapshotFingerprint: string | null = null

  constructor(private readonly options: V86RuntimeOptions) {}

  async start(initialState?: ArrayBuffer, expectedFingerprint?: string) {
    if (this.emulator || this.startController || this.destroyed) return

    const generation = ++this.startGeneration
    const controller = new AbortController()
    this.startController = controller

    try {
      this.options.onStatus({
        phase: 'downloading',
        message: '正在读取 Linux 技术探针清单',
        progress: 0,
      })

      const manifest = await loadProbeManifest(controller.signal)
      this.assertStartActive(generation, controller.signal)
      const snapshotFingerprint = await createSnapshotFingerprint(manifest)
      this.assertStartActive(generation, controller.signal)
      if (
        expectedFingerprint !== undefined &&
        expectedFingerprint !== snapshotFingerprint
      ) {
        throw new Error('本地检查点与当前虚拟机配置指纹不一致，请启动新环境')
      }
      this.snapshotFingerprint = snapshotFingerprint
      const kernelBuffer = await fetchVerifiedKernel(
        manifest.assets.kernel,
        (progress) => {
          if (!this.isStartActive(generation, controller.signal)) return
          this.options.onStatus({
            phase: 'downloading',
            message: '正在下载并校验 Linux 技术探针',
            progress,
          })
        },
        controller.signal,
      )
      this.assertStartActive(generation, controller.signal)

      const emulator = new V86({
        wasm_path: manifest.assets.wasm.url,
        bios: { url: manifest.assets.bios.url },
        vga_bios: { url: manifest.assets.vgaBios.url },
        bzimage: { buffer: kernelBuffer },
        filesystem: {},
        cmdline: VM_CMDLINE,
        memory_size: VM_MEMORY_SIZE,
        vga_memory_size: VM_VGA_MEMORY_SIZE,
        disable_keyboard: true,
        disable_mouse: true,
        disable_speaker: true,
        autostart: false,
      })
      this.emulator = emulator

      emulator.add_listener('download-progress', (event) => {
        if (!this.ownsEmulator(generation, emulator)) return
        const progress =
          event.lengthComputable && event.total > 0
            ? Math.min(100, Math.round((event.loaded / event.total) * 100))
            : undefined
        this.options.onStatus({
          phase: 'downloading',
          message: '正在加载 ' + event.file_name.split('/').at(-1),
          progress,
        })
      })

      emulator.add_listener('download-error', (event) => {
        if (!this.ownsEmulator(generation, emulator)) return
        this.fail('无法下载 ' + event.file_name + '，请检查网络后重试')
      })

      emulator.add_listener('serial0-output-byte', (byte) => {
        if (!this.ownsEmulator(generation, emulator)) return
        this.options.onByte(byte)
        const text = this.decoder.decode(Uint8Array.of(byte), { stream: true })
        this.bootTail = (this.bootTail + text).slice(-2_048)

        if (!this.probeSent && /(?:^|\r?\n)~% $/.test(this.bootTail)) {
          this.probeSent = true
          this.send(
            `printf '__KERNEL_LAB_HEALTH_%s__\\n' "$(uname -s)"\n`,
          )
        }

        if (
          !this.shellReady &&
          this.bootTail.includes('__KERNEL_LAB_HEALTH_Linux__')
        ) {
          this.shellReady = true
          if (this.bootTimeout) window.clearTimeout(this.bootTimeout)
          this.options.onStatus({
            phase: 'ready',
            message: '真实 Linux Shell 已就绪',
            progress: 100,
          })
          this.options.onShellReady()
        }
      })

      emulator.add_listener('emulator-ready', () => {
        if (!this.ownsEmulator(generation, emulator)) return
        void this.onEmulatorReady(emulator, initialState, generation)
      })
    } catch (error) {
      if (this.isStartCancelled(generation, controller.signal)) return
      throw error
    } finally {
      if (this.startController === controller) this.startController = null
    }
  }

  private async onEmulatorReady(
    emulator: V86,
    initialState: ArrayBuffer | undefined,
    generation: number,
  ) {
    if (!this.ownsEmulator(generation, emulator)) return
    try {
      this.options.onStatus({
        phase: initialState ? 'restoring' : 'initializing',
        message: initialState ? '正在恢复本地快照' : 'v86 已初始化，准备启动内核',
      })
      if (initialState) await emulator.restore_state(initialState)
      if (!this.ownsEmulator(generation, emulator)) return
      this.options.onStatus({
        phase: 'booting',
        message: initialState ? '快照已恢复，正在执行健康检查' : 'Linux 内核正在通过串口启动',
      })
      await emulator.run()
      if (!this.ownsEmulator(generation, emulator)) return
      this.armBootTimeout()
      if (initialState) {
        window.setTimeout(() => {
          if (this.ownsEmulator(generation, emulator)) this.send('\n')
        }, 250)
      }
    } catch (error) {
      if (!this.ownsEmulator(generation, emulator)) return
      this.fail(error instanceof Error ? error.message : '虚拟机初始化失败')
    }
  }

  send(data: string) {
    if (!this.emulator) return
    this.emulator.serial_send_bytes(0, new TextEncoder().encode(data))
  }

  async save() {
    if (!this.emulator || !this.shellReady || !this.snapshotFingerprint) {
      throw new Error('来宾 Shell 尚未就绪，不能保存')
    }
    this.options.onStatus({ phase: 'saving', message: '正在创建本地检查点' })
    this.send('sync\n')
    await new Promise((resolve) => window.setTimeout(resolve, 180))
    const wasRunning = this.emulator.is_running()
    if (wasRunning) await this.emulator.stop()
    try {
      return {
        state: await this.emulator.save_state(),
        runtimeFingerprint: this.snapshotFingerprint,
      }
    } finally {
      if (wasRunning) await this.emulator.run()
      this.options.onStatus({ phase: 'ready', message: '检查点已保存' })
    }
  }

  async pause() {
    if (!this.emulator || !this.emulator.is_running()) return
    await this.emulator.stop()
    this.options.onStatus({ phase: 'paused', message: '虚拟机已暂停' })
  }

  async resume() {
    if (!this.emulator || this.emulator.is_running()) return
    await this.emulator.run()
    this.options.onStatus({
      phase: this.shellReady ? 'ready' : 'booting',
      message: this.shellReady ? '虚拟机继续运行' : '继续等待 Shell 启动',
    })
  }

  restart() {
    if (!this.emulator) return
    this.shellReady = false
    this.probeSent = false
    this.bootTail = ''
    this.options.onStatus({ phase: 'booting', message: '正在强制重启来宾系统' })
    this.emulator.restart()
    this.armBootTimeout()
  }

  isRunning() {
    return this.emulator?.is_running() ?? false
  }

  async destroy() {
    this.destroyed = true
    this.startGeneration += 1
    const controller = this.startController
    this.startController = null
    controller?.abort()
    if (this.bootTimeout) window.clearTimeout(this.bootTimeout)
    const emulator = this.emulator
    this.emulator = null
    if (emulator) await emulator.destroy()
    this.options.onStatus({ phase: 'stopped', message: '虚拟机已关闭' })
  }

  private isStartActive(generation: number, signal: AbortSignal) {
    return (
      !this.destroyed &&
      !signal.aborted &&
      generation === this.startGeneration
    )
  }

  private isStartCancelled(generation: number, signal: AbortSignal) {
    return !this.isStartActive(generation, signal)
  }

  private assertStartActive(generation: number, signal: AbortSignal) {
    if (!this.isStartActive(generation, signal)) {
      throwIfAborted(signal)
      throw new DOMException('虚拟机启动已取消', 'AbortError')
    }
  }

  private ownsEmulator(generation: number, emulator: V86) {
    return (
      !this.destroyed &&
      generation === this.startGeneration &&
      this.emulator === emulator
    )
  }

  private armBootTimeout() {
    if (this.bootTimeout) window.clearTimeout(this.bootTimeout)
    this.bootTimeout = window.setTimeout(() => {
      if (!this.shellReady) {
        this.fail('虚拟机已运行，但 60 秒内未通过来宾 Shell 健康检查')
      }
    }, 60_000)
  }

  private fail(message: string) {
    if (this.bootTimeout) window.clearTimeout(this.bootTimeout)
    this.options.onStatus({ phase: 'error', message })
  }
}
