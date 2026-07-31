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
import { findLabLesson, labLessons } from '../content/labLessons'
import { useInstallation } from '../features/installation/useInstallation'
import { TerminalPane } from '../features/terminal/TerminalPane'
import { SimulatedTerminalPane } from '../features/terminal/SimulatedTerminalPane'
import { distributionLabel } from '../features/terminal/simulator'
import type { VmPhase } from '../features/vm/V86Runtime'

export default function LabPage() {
  const { installation, loading } = useInstallation()
  const [phase, setPhase] = useState<VmPhase>('idle')
  const [copied, setCopied] = useState<string | null>(null)
  const [activeLessonId, setActiveLessonId] = useState(() => (
    findLabLesson(new URLSearchParams(window.location.search).get('lesson')).id
  ))
  const activeLesson = findLabLesson(activeLessonId)
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

  function selectLesson(lessonId: string) {
    setActiveLessonId(lessonId)
    const url = new URL(window.location.href)
    url.searchParams.set('lesson', lessonId)
    window.history.replaceState(null, '', url)
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
            {labLessons.map((lesson) => (
              <li key={lesson.id}>
                <button
                  type="button"
                  className={lesson.id === activeLesson.id ? 'is-current' : ''}
                  aria-current={lesson.id === activeLesson.id ? 'step' : undefined}
                  onClick={() => selectLesson(lesson.id)}
                >
                  {lesson.id === activeLesson.id ? <CheckCircle2 size={16} /> : <Circle size={14} />}
                  <span>
                    <strong>{lesson.title}</strong>
                    <small>{lesson.objective}</small>
                  </span>
                  <ChevronRight size={15} />
                </button>
              </li>
            ))}
          </ol>
          <Link className="sidebar-link" to={`/courses?lesson=${activeLesson.fullLessonId}`}>
            打开完整课程 <ChevronRight size={15} />
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
            <h3>{activeLesson.objective}</h3>
            <p>{activeLesson.summary}</p>
          </div>
          <div className="command-suggestions">
            {activeLesson.commands.map(({ command, detail }) => (
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
          <div className="coach-card coach-card--completion">
            <span>完成条件</span>
            <p>{activeLesson.completion}</p>
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
                ? activeLesson.boundary
                : `当前是真实 BusyBox Shell。${activeLesson.boundary}`}
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
