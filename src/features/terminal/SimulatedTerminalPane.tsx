import { useEffect, useRef, useState } from 'react'
import { FitAddon } from '@xterm/addon-fit'
import { Terminal } from '@xterm/xterm'
import { RefreshCw } from 'lucide-react'
import type { InstallationProfile } from '../installation/model'
import { completeInput, createSimulatorState, distributionLabel, executeSimulatedCommand, loadSimulatorState, resetSimulatorState, saveSimulatorState } from './simulator'

interface SimulatedTerminalPaneProps {
  profile: InstallationProfile
  commandDraft?: string | null
  onCommandDraftConsumed?: () => void
}

export function SimulatedTerminalPane({
  profile,
  commandDraft,
  onCommandDraftConsumed,
}: SimulatedTerminalPaneProps) {
  const hostRef = useRef<HTMLDivElement>(null)
  const terminalRef = useRef<Terminal | null>(null)
  const stateRef = useRef(createSimulatorState(profile))
  const lineRef = useRef('')
  const replaceLineRef = useRef<((value: string) => void) | null>(null)
  const historyIndexRef = useRef(0)
  const [session, setSession] = useState(0)

  useEffect(() => {
    if (!hostRef.current) return
    stateRef.current = loadSimulatorState(profile)
    lineRef.current = ''
    const terminal = new Terminal({
      cursorBlink: true,
      fontFamily: "'SFMono-Regular', 'Cascadia Code', 'Roboto Mono', monospace",
      fontSize: 16,
      lineHeight: 1.35,
      scrollback: 5000,
      theme: { background: '#090c0b', foreground: '#d9e2dd', cursor: '#7dffb2', green: '#58d68d', brightGreen: '#7dffb2', cyan: '#58c9d6', yellow: '#e0b86a', red: '#ef6f73' },
    })
    const fit = new FitAddon()
    terminal.loadAddon(fit)
    terminal.open(hostRef.current)
    fit.fit()
    terminalRef.current = terminal

    const prompt = () => {
      const state = stateRef.current
      const home = `/home/${profile.username}`
      const location = state.cwd === home ? '~' : state.cwd
      terminal.write(`\r\n\x1b[1;32m${profile.username}@${profile.hostname}\x1b[0m:\x1b[1;34m${location}\x1b[0m$ `)
    }
    terminal.writeln(`\x1b[1;36m${distributionLabel(profile.distribution)} 教学模拟终端\x1b[0m`)
    terminal.writeln('输入 help 查看建议命令。此环境用于学习，不连接真实服务器。')
    prompt()

    const replaceLine = (value: string) => {
      terminal.write(`\r\x1b[2K\x1b[1;32m${profile.username}@${profile.hostname}\x1b[0m:\x1b[1;34m${stateRef.current.cwd === `/home/${profile.username}` ? '~' : stateRef.current.cwd}\x1b[0m$ ${value}`)
      lineRef.current = value
    }
    replaceLineRef.current = replaceLine

    const input = terminal.onData((data) => {
      if (data === '\r') {
        const command = lineRef.current
        terminal.write('\r\n')
        const result = executeSimulatedCommand(command, stateRef.current, profile)
        saveSimulatorState(profile, stateRef.current)
        if (result.clear) terminal.clear()
        else if (result.output) terminal.write(result.output.replaceAll('\n', '\r\n'))
        lineRef.current = ''
        historyIndexRef.current = stateRef.current.history.length
        prompt()
      } else if (data === '\u007F') {
        if (lineRef.current) {
          lineRef.current = lineRef.current.slice(0, -1)
          terminal.write('\b \b')
        }
      } else if (data === '\t') {
        const completion = completeInput(lineRef.current, stateRef.current)
        if (completion.listing) {
          terminal.write(`\r\n${completion.listing}`)
          prompt()
          terminal.write(lineRef.current)
        } else if (completion.value !== lineRef.current) replaceLine(completion.value)
      } else if (data === '\u001b[A' || data === '\u001b[B') {
        const direction = data === '\u001b[A' ? -1 : 1
        historyIndexRef.current = Math.max(0, Math.min(stateRef.current.history.length, historyIndexRef.current + direction))
        replaceLine(stateRef.current.history[historyIndexRef.current] ?? '')
      } else if (data >= ' ' && data !== '\u007f') {
        lineRef.current += data
        terminal.write(data)
      }
    })
    const observer = new ResizeObserver(() => fit.fit())
    observer.observe(hostRef.current)
    terminal.focus()
    return () => { input.dispose(); observer.disconnect(); terminal.dispose(); terminalRef.current = null; replaceLineRef.current = null }
  }, [profile, session])

  useEffect(() => {
    if (!commandDraft || !replaceLineRef.current) return
    replaceLineRef.current(commandDraft)
    terminalRef.current?.focus()
    onCommandDraftConsumed?.()
  }, [commandDraft, onCommandDraftConsumed])

  return (
    <section className="terminal-card simulated-terminal">
      <header className="terminal-card__bar">
        <div className="terminal-card__identity"><span className="vm-dot vm-dot--ready" /><div><strong>{profile.username}@{profile.hostname} · {distributionLabel(profile.distribution)}</strong><small>教学模拟模式 · Tab 补全和命令历史已启用</small></div></div>
        <div className="terminal-card__controls"><button type="button" onClick={() => { resetSimulatorState(profile); stateRef.current = createSimulatorState(profile); setSession((value) => value + 1) }}><RefreshCw size={15} /> 重置模拟环境</button></div>
      </header>
      <div className="simulation-banner">SIMULATION · 输出按发行版教学场景生成，不代表真实服务器当前状态</div>
      <div className="terminal-stage"><div ref={hostRef} className="terminal-host" aria-label={`${distributionLabel(profile.distribution)} 教学模拟终端`} /></div>
      <footer className="terminal-card__footer"><span>输入与输出：浏览器内教学模拟器</span><span>{distributionLabel(profile.distribution)} · i386 教学配置 · 512 MB 模拟内存</span></footer>
    </section>
  )
}
