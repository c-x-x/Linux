import { useEffect, useRef, useState } from 'react'
import { FitAddon } from '@xterm/addon-fit'
import { Terminal } from '@xterm/xterm'
import {
  CircleStop,
  Download,
  Loader2,
  Pause,
  Play,
  Power,
  RefreshCw,
  Save,
} from 'lucide-react'
import {
  readInstallation,
  readSnapshot,
  saveSnapshot,
  writeInstallation,
} from '../installation/model'
import {
  VM_IMAGE_ID,
  VM_MEMORY_SIZE,
  VM_VERSION,
  V86Runtime,
  type VmPhase,
  type VmRuntimeEvent,
} from '../vm/V86Runtime'

interface TerminalPaneProps {
  onPhaseChange?: (phase: VmPhase) => void
}

export function TerminalPane({ onPhaseChange }: TerminalPaneProps) {
  const hostRef = useRef<HTMLDivElement>(null)
  const terminalRef = useRef<Terminal | null>(null)
  const runtimeRef = useRef<V86Runtime | null>(null)
  const [status, setStatus] = useState<VmRuntimeEvent>({
    phase: 'idle',
    message: '尚未启动',
  })
  const [snapshotAvailable, setSnapshotAvailable] = useState(false)
  const [snapshotSize, setSnapshotSize] = useState<number | null>(null)
  const [active, setActive] = useState(false)

  useEffect(() => {
    if (!hostRef.current) return
    const terminal = new Terminal({
      convertEol: true,
      cursorBlink: true,
      cursorStyle: 'block',
      fontFamily:
        "'SFMono-Regular', 'Cascadia Code', 'Roboto Mono', 'Noto Sans Mono CJK SC', monospace",
      fontSize: 16,
      lineHeight: 1.35,
      scrollback: 8_000,
      theme: {
        background: '#090c0b',
        foreground: '#d9e2dd',
        cursor: '#7dffb2',
        cursorAccent: '#090c0b',
        black: '#141a17',
        brightBlack: '#657069',
        green: '#58d68d',
        brightGreen: '#7dffb2',
        cyan: '#58c9d6',
        brightCyan: '#80ecf8',
        yellow: '#e0b86a',
        brightYellow: '#f4cf84',
        red: '#ef6f73',
        brightRed: '#ff9296',
        white: '#d9e2dd',
        brightWhite: '#ffffff',
      },
    })
    const fitAddon = new FitAddon()
    terminal.loadAddon(fitAddon)
    terminal.open(hostRef.current)
    fitAddon.fit()
    terminalRef.current = terminal

    const resizeObserver = new ResizeObserver(() => fitAddon.fit())
    resizeObserver.observe(hostRef.current)
    const input = terminal.onData((data) => runtimeRef.current?.send(data))
    void readSnapshot().then((snapshot) => {
      setSnapshotAvailable(Boolean(snapshot))
      setSnapshotSize(snapshot?.state.byteLength ?? null)
    })

    return () => {
      input.dispose()
      resizeObserver.disconnect()
      terminal.dispose()
      terminalRef.current = null
      void runtimeRef.current?.destroy()
      runtimeRef.current = null
    }
  }, [])

  function updateStatus(event: VmRuntimeEvent) {
    setStatus(event)
    onPhaseChange?.(event.phase)
    if (event.phase === 'error') void markInstallationError(event.message)
  }

  async function start(restore: boolean) {
    if (runtimeRef.current || !terminalRef.current) return
    let snapshot
    try {
      snapshot = restore ? await readSnapshot() : undefined
    } catch (error) {
      updateStatus({
        phase: 'error',
        message:
          error instanceof Error ? error.message : '无法读取浏览器中的检查点',
      })
      return
    }

    if (
      snapshot &&
      (snapshot.schemaVersion !== 2 ||
        snapshot.v86Version !== VM_VERSION ||
        snapshot.imageId !== VM_IMAGE_ID ||
        snapshot.memorySize !== VM_MEMORY_SIZE ||
        typeof snapshot.runtimeFingerprint !== 'string')
    ) {
      updateStatus({
        phase: 'error',
        message: '本地检查点属于不同的运行时或镜像，请启动新环境',
      })
      return
    }

    const runtime = new V86Runtime({
      onByte: (byte) => terminalRef.current?.write(Uint8Array.of(byte)),
      onStatus: updateStatus,
      onShellReady: () => void markInstallationReady(),
    })
    runtimeRef.current = runtime
    setActive(true)
    try {
      await runtime.start(snapshot?.state, snapshot?.runtimeFingerprint)
      terminalRef.current.focus()
    } catch (error) {
      runtimeRef.current = null
      setActive(false)
      updateStatus({
        phase: 'error',
        message: error instanceof Error ? error.message : '启动失败',
      })
    }
  }

  async function markInstallationReady() {
    const installation = await readInstallation()
    if (!installation || installation.status === 'ready') return
    await writeInstallation({
      ...installation,
      status: 'ready',
      runtimeVersion: VM_VERSION,
      imageId: VM_IMAGE_ID,
      errorMessage: null,
    })
  }

  async function markInstallationError(message: string) {
    try {
      const installation = await readInstallation()
      if (!installation) return
      await writeInstallation({
        ...installation,
        status: 'error',
        errorMessage: message,
      })
    } catch {
      // The visible VM error remains the source of truth if browser storage fails.
    }
  }

  async function save() {
    if (!runtimeRef.current) return
    try {
      const { state, runtimeFingerprint } = await runtimeRef.current.save()
      await saveSnapshot({
        id: 'current',
        schemaVersion: 2,
        v86Version: VM_VERSION,
        imageId: VM_IMAGE_ID,
        memorySize: VM_MEMORY_SIZE,
        runtimeFingerprint,
        createdAt: new Date().toISOString(),
        state,
      })
      setSnapshotAvailable(true)
      setSnapshotSize(state.byteLength)
    } catch (error) {
      updateStatus({
        phase: 'error',
        message: error instanceof Error ? error.message : '保存失败',
      })
    }
  }

  async function togglePause() {
    if (!runtimeRef.current) return
    if (status.phase === 'paused') await runtimeRef.current.resume()
    else await runtimeRef.current.pause()
  }

  async function stop() {
    try {
      await runtimeRef.current?.destroy()
    } finally {
      runtimeRef.current = null
      setActive(false)
    }
  }

  const busy = ['downloading', 'initializing', 'booting', 'restoring'].includes(
    status.phase,
  )
  const canSave = status.phase === 'ready'

  return (
    <section className="terminal-card">
      <header className="terminal-card__bar">
        <div className="terminal-card__identity">
          <span className={'vm-dot vm-dot--' + status.phase} />
          <div>
            <strong>ttyS0 · Buildroot Linux</strong>
            <small>{status.message}</small>
          </div>
        </div>
        <div className="terminal-card__controls">
          {!active && (
            <>
              <button type="button" onClick={() => void start(false)}>
                <Power size={15} /> 启动真实 Linux
              </button>
              {snapshotAvailable && (
                <button type="button" onClick={() => void start(true)}>
                  <Download size={15} /> 恢复检查点
                </button>
              )}
            </>
          )}
          {active && (
            <>
              <button
                type="button"
                onClick={() => void togglePause()}
                disabled={busy}
              >
                {status.phase === 'paused' ? (
                  <Play size={15} />
                ) : (
                  <Pause size={15} />
                )}
                {status.phase === 'paused' ? '继续' : '暂停'}
              </button>
              <button
                type="button"
                onClick={() => runtimeRef.current?.restart()}
                disabled={busy}
              >
                <RefreshCw size={15} /> 重启
              </button>
              <button type="button" onClick={() => void save()} disabled={!canSave}>
                <Save size={15} /> 保存
              </button>
              <button type="button" onClick={() => void stop()}>
                <CircleStop size={15} /> 关闭
              </button>
            </>
          )}
        </div>
      </header>
      {typeof status.progress === 'number' && status.phase === 'downloading' && (
        <div className="terminal-progress">
          <span style={{ width: status.progress + '%' }} />
        </div>
      )}
      <div className="terminal-stage">
        <div ref={hostRef} className="terminal-host" aria-label="真实 Linux 串口终端" />
        {!active && (
          <div className="terminal-empty">
            <TerminalGlyph />
            <h3>终端尚未连接</h3>
            <p>
              点击“启动真实 Linux”后才会下载约 9.6 MiB
              的技术探针。这里不会显示预先编写的命令输出。
            </p>
            {snapshotAvailable && (
              <span>
                已发现本地检查点
                {snapshotSize ? ' · ' + formatSize(snapshotSize) : ''}
              </span>
            )}
          </div>
        )}
        {busy && (
          <div className="terminal-loading" role="status">
            <Loader2 className="spin" size={18} />
            {status.message}
          </div>
        )}
      </div>
      <footer className="terminal-card__footer">
        <span>输入与输出：浏览器 ↔ v86 串口 ↔ Linux TTY</span>
        <span>v86 {VM_VERSION} · i686 · 64 MB RAM · 练习环境联网未配置</span>
      </footer>
    </section>
  )
}

function TerminalGlyph() {
  return (
    <div className="terminal-glyph" aria-hidden="true">
      <span>&gt;_</span>
    </div>
  )
}

function formatSize(bytes: number) {
  return (bytes / 1024 / 1024).toFixed(1) + ' MB'
}
