import { useMemo, useState } from 'react'
import {
  AlertTriangle,
  ArrowRight,
  Check,
  CheckCircle2,
  Clipboard,
  Clock3,
  Cpu,
  RotateCcw,
  TerminalSquare,
} from 'lucide-react'
import { AppLink as Link } from '../components/AppLink'
import { courseLessons } from '../content/courses'

const modeCopy = {
  'real-guest-lab': '来宾实验',
  'concept-demonstration': '概念演示',
  'hardware-extension': '硬件扩展',
} as const

export default function CoursesPage() {
  const [activeId, setActiveId] = useState<string>(courseLessons[0].id)
  const [checkedSteps, setCheckedSteps] = useState<Record<string, boolean>>({})
  const [copied, setCopied] = useState<string | null>(null)
  const active = useMemo(
    () => courseLessons.find((lesson) => lesson.id === activeId) ?? courseLessons[0],
    [activeId],
  )

  function toggleStep(stepId: string) {
    const key = active.id + ':' + stepId
    setCheckedSteps((current) => ({ ...current, [key]: !current[key] }))
  }

  async function copy(command: string) {
    await navigator.clipboard.writeText(command)
    setCopied(command)
    window.setTimeout(() => setCopied(null), 1_400)
  }

  const completed = active.labSteps.filter(
    (step) => step && checkedSteps[active.id + ':' + step.id],
  ).length

  return (
    <div className="page courses-page">
      <header className="page-heading">
        <div>
          <span className="section-kicker">EMBEDDED LINUX PATH</span>
          <h1>从 Shell 到 rootfs</h1>
          <p>
            五节课程草案把命令放回系统语境。勾选只记录本次阅读进度；结果必须由真实来宾输出核对。
          </p>
        </div>
        <Link className="button button--primary" to="/lab">
          打开实验终端 <TerminalSquare size={17} />
        </Link>
      </header>

      <div className="notice notice--warning course-probe-note">
        <AlertTriangle size={18} />
        <span>
          这些课程面向后续自建教学镜像。当前公共 BusyBox 技术探针不保证存在
          <code> /home/student </code>、GNU 工具或课程检查器；失败输出本身会被保留。
        </span>
      </div>

      <div className="course-layout">
        <aside className="course-index" aria-label="课程目录">
          <div className="course-index__header">
            <span>COURSE INDEX</span>
            <strong>{courseLessons.length} 节 · 约 3 小时</strong>
          </div>
          {courseLessons.map((lesson, index) => (
            <button
              key={lesson.id}
              type="button"
              className={lesson.id === active.id ? 'course-index__item is-active' : 'course-index__item'}
              onClick={() => setActiveId(lesson.id)}
            >
              <span>{String(index + 1).padStart(2, '0')}</span>
              <div>
                <strong>{lesson.title}</strong>
                <small>
                  {lesson.level} · {lesson.durationMinutes} 分钟
                </small>
              </div>
              <ArrowRight size={16} />
            </button>
          ))}
        </aside>

        <article className="course-detail">
          <header className="course-detail__header">
            <div>
              <div className="course-tags">
                <span>{active.level}</span>
                <span>{modeCopy[active.mode]}</span>
                <span>
                  <Clock3 size={13} /> {active.durationMinutes} 分钟
                </span>
              </div>
              <h2>{active.title}</h2>
              <p>{active.summary}</p>
            </div>
            <div className="course-progress" aria-label="本课本次进度">
              <strong>
                {completed}/{active.labSteps.length}
              </strong>
              <span>本次勾选</span>
            </div>
          </header>

          <section className="course-objectives">
            <h3>完成后你应该能</h3>
            <ul>
              {active.objectives.map((objective) => (
                <li key={objective}>
                  <CheckCircle2 size={16} /> {objective}
                </li>
              ))}
            </ul>
          </section>

          <section className="lab-steps">
            <div className="subsection-heading">
              <div>
                <span>HANDS-ON LAB</span>
                <h3>实验步骤</h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  const next = { ...checkedSteps }
                  active.labSteps.forEach((step) => {
                    if (step) delete next[active.id + ':' + step.id]
                  })
                  setCheckedSteps(next)
                }}
              >
                <RotateCcw size={14} /> 清除本次勾选
              </button>
            </div>
            {active.labSteps.map((step, index) => {
              if (!step) return null
              const key = active.id + ':' + step.id
              const done = Boolean(checkedSteps[key])
              return (
                <article className={done ? 'lab-step is-done' : 'lab-step'} key={step.id}>
                  <button
                    className="lab-step__check"
                    type="button"
                    aria-label={done ? '取消完成此步骤' : '标记完成此步骤'}
                    aria-pressed={done}
                    onClick={() => toggleStep(step.id)}
                  >
                    {done ? <Check size={16} /> : String(index + 1).padStart(2, '0')}
                  </button>
                  <div className="lab-step__body">
                    <span>STEP {String(index + 1).padStart(2, '0')}</span>
                    <h4>{step.title}</h4>
                    <p>{step.instruction}</p>
                    <div className="lab-step__commands">
                      {step.commands.map((command) => (
                        <button
                          key={command}
                          type="button"
                          onClick={() => void copy(command)}
                        >
                          <code>{command}</code>
                          {copied === command ? <Check size={14} /> : <Clipboard size={14} />}
                        </button>
                      ))}
                    </div>
                    <div className="observation">
                      <strong>预期观察</strong>
                      <p>{step.expectedObservation}</p>
                    </div>
                    {step.safetyNote && (
                      <div className="step-warning">
                        <AlertTriangle size={15} /> {step.safetyNote}
                      </div>
                    )}
                  </div>
                </article>
              )
            })}
          </section>

          <section className="course-boundary">
            <div>
              <Cpu size={18} />
              <h3>本课边界</h3>
            </div>
            <ul>
              {active.hardwareLimitations.map((limitation) => (
                <li key={limitation}>{limitation}</li>
              ))}
            </ul>
          </section>

          <footer className="course-checks">
            <div>
              <span>未来自建镜像检查器</span>
              <code>{active.checkCommand}</code>
            </div>
            <div>
              <span>未来自建镜像重置器</span>
              <code>{active.resetCommand}</code>
            </div>
            <p>
              当前公共技术探针可能返回 <code>command not found</code>；这是诚实失败，不由网页伪造成成功。
            </p>
          </footer>
        </article>
      </div>
    </div>
  )
}
