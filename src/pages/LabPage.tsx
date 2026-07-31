import { useMemo, useState } from 'react'
import {
  AlertTriangle,
  BookOpen,
  CheckCircle2,
  ChevronRight,
  Circle,
  Clipboard,
  Cpu,
  Info,
  Keyboard,
  TerminalSquare,
} from 'lucide-react'
import { AppLink as Link } from '../components/AppLink'
import { useInstallation } from '../features/installation/useInstallation'
import { TerminalPane } from '../features/terminal/TerminalPane'
import { SimulatedTerminalPane } from '../features/terminal/SimulatedTerminalPane'
import { distributionLabel } from '../features/terminal/simulator'
import type { VmPhase } from '../features/vm/V86Runtime'

const starterCommands = [
  ['uname -a', '查看内核、主机与架构'],
  ['pwd && ls -la', '确认当前位置并列出隐藏文件'],
  ["printf 'a\\nb\\n' | grep b", '体验管道与真实标准输出'],
  ['cat /proc/cpuinfo | head', '读取 Linux 内核暴露的 CPU 信息'],
]

export default function LabPage() {
  const { installation, loading } = useInstallation()
  const [phase, setPhase] = useState<VmPhase>('idle')
  const [copied, setCopied] = useState<string | null>(null)
  const simulated = installation?.distribution === 'debian' || installation?.distribution === 'ubuntu'
  const ready = installation?.status === 'ready'
  const statusLabel = useMemo(() => {
    if (simulated) return '模拟终端已就绪'
    if (phase === 'ready') return 'Shell 已就绪'
    if (phase === 'error') return '启动失败'
    if (phase === 'idle') return '等待启动'
    return '正在建立真实终端'
  }, [phase, simulated])

  async function copyCommand(command: string) {
    await navigator.clipboard.writeText(command)
    setCopied(command)
    window.setTimeout(() => setCopied(null), 1_500)
  }

  return (
    <div className="page lab-page">
      <header className="lab-heading">
        <div>
          <span className="section-kicker">{simulated ? 'TEACHING SIMULATION' : 'REAL LINUX TERMINAL'}</span>
          <h1>命令行实验室</h1>
          <p>{simulated
            ? `${distributionLabel(installation.distribution)} 教学模拟：命令状态保存在浏览器，输出不代表生产服务器。`
            : '前端只转发终端字节；命令、错误和退出码都由浏览器内运行的 Linux 产生。'}</p>
        </div>
        <div className="lab-heading__status">
          <span className={'vm-dot vm-dot--' + (simulated ? 'ready' : phase)} />
          <div>
            <small>SESSION STATUS</small>
            <strong>{statusLabel}</strong>
          </div>
        </div>
      </header>

      {!loading && !installation && (
        <div className="notice notice--warning lab-notice">
          <AlertTriangle size={19} />
          <span>
            你还没有保存安装配置。可以先以技术探针模式启动，或
            <Link to="/install">完成教学安装</Link>。
          </span>
        </div>
      )}

      {!loading && installation?.status === 'configured' && !simulated && (
        <div className="notice lab-notice">
          <Info size={19} />
          <span>
            配置已保存。首次检测到真实 Shell 提示符后，安装状态将自动变为 ready。
          </span>
        </div>
      )}

      <div className="lab-layout">
        <aside className="lab-sidebar lab-sidebar--lessons">
          <div className="lab-sidebar__title">
            <BookOpen size={17} />
            <span>
              <small>LEARNING PATH</small>
              <strong>入门课程</strong>
            </span>
          </div>
          <ol className="lesson-mini-list">
            {[
              ['系统与 Shell', '理解 ttyS0 与当前架构'],
              ['文件与链接', '路径、目录和 inode'],
              ['管道与重定向', '连接标准输入输出'],
              ['权限与进程', '用户、信号和作业'],
              ['嵌入式系统组成', 'BusyBox、rootfs 与伪文件系统'],
            ].map(([title, detail], index) => (
              <li key={title} className={index === 0 ? 'is-current' : ''}>
                {index === 0 && phase === 'ready' ? (
                  <CheckCircle2 size={16} />
                ) : (
                  <Circle size={14} />
                )}
                <span>
                  <strong>{title}</strong>
                  <small>{detail}</small>
                </span>
                <ChevronRight size={15} />
              </li>
            ))}
          </ol>
          <Link className="sidebar-link" to="/courses">
            查看全部课程 <ChevronRight size={15} />
          </Link>
        </aside>

        {simulated && installation
          ? <SimulatedTerminalPane profile={installation} />
          : <TerminalPane onPhaseChange={setPhase} />}

        <aside className="lab-sidebar lab-sidebar--coach">
          <div className="lab-sidebar__title">
            <Cpu size={17} />
            <span>
              <small>COMMAND COACH</small>
              <strong>本节提示</strong>
            </span>
          </div>
          <div className="coach-card">
            <span>当前目标</span>
            <h3>确认你运行在哪里</h3>
            <p>先观察内核、架构、工作目录和根文件系统，再开始修改文件。</p>
          </div>
          <div className="command-suggestions">
            {starterCommands.map(([command, detail]) => (
              <button
                key={command}
                type="button"
                onClick={() => void copyCommand(command)}
              >
                <code>{command}</code>
                <span>{copied === command ? '已复制' : detail}</span>
                <Clipboard size={14} />
              </button>
            ))}
          </div>
          <div className="shortcut-list">
            <span>
              <Keyboard size={15} /> 终端快捷键
            </span>
            <div>
              <kbd>Tab</kbd>
              <small>当前探针补全已实测</small>
            </div>
            <div>
              <kbd>Ctrl</kbd> + <kbd>C</kbd>
              <small>中断前台任务</small>
            </div>
            <div>
              <kbd>↑</kbd> / <kbd>↓</kbd>
              <small>当前探针历史已实测</small>
            </div>
          </div>
          <div className="coach-boundary">
            <TerminalSquare size={16} />
            <span>
              {simulated
                ? '当前是教学模拟器：适合课程练习，不用于验证真实内核、性能或生产故障。'
                : '当前是真实 BusyBox Shell；Debian/Ubuntu 可在安装页选择教学模拟。'}
            </span>
          </div>
        </aside>
      </div>

      <section className="lab-facts">
        <article>
          <strong>{simulated ? 'SIMULATED' : ready ? 'READY' : 'PROBE'}</strong>
          <span>安装状态</span>
        </article>
        <article>
          <strong>{simulated ? (installation?.distribution === 'ubuntu' ? 'amd64 教学' : 'i386 教学') : 'i686'}</strong>
          <span>练习环境架构</span>
        </article>
        <article>
          <strong>{simulated ? '512 MB 教学' : '64 MB'}</strong>
          <span>练习环境内存</span>
        </article>
        <article>
          <strong>{simulated ? 'SIMULATED' : 'LOCAL'}</strong>
          <span>执行位置</span>
        </article>
      </section>
    </div>
  )
}
