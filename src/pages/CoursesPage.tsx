import { useEffect, useMemo, useState } from 'react'
import {
  AlertTriangle, ArrowLeft, ArrowRight, BookOpen, Check, CheckCircle2,
  Clipboard, Clock3, Cpu, RotateCcw, TerminalSquare,
} from 'lucide-react'
import { AppLink as Link } from '../components/AppLink'
import { courseLessons } from '../content/courses'
import {
  readCourseProgress,
  writeCourseProgress,
  type CourseProgress,
} from '../features/installation/model'

const modeCopy = {
  'guided-learning': '知识导学',
  'terminal-practice': '终端练习',
  'embedded-extension': '嵌入式进阶',
} as const

function lessonIdFromLocation() {
  const requested = new URLSearchParams(window.location.search).get('lesson')
  return courseLessons.some((lesson) => lesson.id === requested)
    ? requested as string
    : courseLessons[0].id
}

export default function CoursesPage() {
  const [activeId, setActiveId] = useState<string>(lessonIdFromLocation)
  const [progress, setProgress] = useState<Record<string, CourseProgress>>({})
  const [copied, setCopied] = useState<string | null>(null)
  const [loaded, setLoaded] = useState(false)
  const activeIndex = courseLessons.findIndex((lesson) => lesson.id === activeId)
  const active = useMemo(
    () => courseLessons.find((lesson) => lesson.id === activeId) ?? courseLessons[0],
    [activeId],
  )

  useEffect(() => {
    void readCourseProgress().then((records) => {
      setProgress(Object.fromEntries(records.map((record) => [record.lessonId, record])))
      setLoaded(true)
    }).catch(() => setLoaded(true))
  }, [])

  useEffect(() => {
    const handleNavigation = () => setActiveId(lessonIdFromLocation())
    window.addEventListener('popstate', handleNavigation)
    return () => window.removeEventListener('popstate', handleNavigation)
  }, [])

  function selectLesson(lessonId: string, scroll = true) {
    setActiveId(lessonId)
    const url = new URL(window.location.href)
    url.searchParams.set('lesson', lessonId)
    window.history.pushState(null, '', url)
    if (scroll) window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  async function saveLesson(lessonId: string, completedSteps: string[], completed: boolean) {
    const value: CourseProgress = { lessonId, completedSteps, completed, updatedAt: new Date().toISOString() }
    await writeCourseProgress(value)
    setProgress((current) => ({ ...current, [lessonId]: value }))
  }

  async function toggleStep(stepId: string) {
    const current = progress[active.id]?.completedSteps ?? []
    const completedSteps = current.includes(stepId)
      ? current.filter((id) => id !== stepId)
      : [...current, stepId]
    await saveLesson(active.id, completedSteps, completedSteps.length === active.labSteps.length)
  }

  async function finishAndContinue() {
    await saveLesson(active.id, active.labSteps.map((step) => step.id), true)
    const next = courseLessons[activeIndex + 1]
    if (next) {
      selectLesson(next.id)
    }
  }

  async function copy(command: string) {
    await navigator.clipboard.writeText(command)
    setCopied(command)
    window.setTimeout(() => setCopied(null), 1_400)
  }

  const currentSteps = progress[active.id]?.completedSteps ?? []
  const completedLessons = courseLessons.filter((lesson) => progress[lesson.id]?.completed).length
  const totalMinutes = courseLessons.reduce((sum, lesson) => sum + lesson.durationMinutes, 0)

  return (
    <div className="page courses-page">
      <header className="page-heading">
        <div>
          <span className="section-kicker">LINUX LEARNING PATH</span>
          <h1>从 Linux 认知到嵌入式交付</h1>
          <p>先理解 Linux、发行版与企业应用，再循序练习命令行、系统管理、网络和嵌入式工程。</p>
        </div>
        <Link className="button button--primary" to={`/lab?lesson=${active.id}`}>打开练习终端 <TerminalSquare size={17} /></Link>
      </header>

      <div className="notice course-probe-note">
        <BookOpen size={18} />
        <span>学习进度会保存在本浏览器。课程同时标出通用 Linux 知识与发行版差异；命令是否可用以当前运行环境为准。</span>
      </div>

      <div className="course-layout">
        <aside className="course-index" aria-label="课程目录">
          <div className="course-index__header">
            <span>COURSE INDEX</span>
            <strong>{courseLessons.length} 节 · 约 {Math.round(totalMinutes / 60)} 小时</strong>
            <small>{loaded ? `已完成 ${completedLessons}/${courseLessons.length}` : '正在读取进度…'}</small>
          </div>
          {courseLessons.map((lesson, index) => (
            <button key={lesson.id} type="button"
              className={lesson.id === active.id ? 'course-index__item is-active' : 'course-index__item'}
              aria-current={lesson.id === active.id ? 'step' : undefined}
              onClick={() => selectLesson(lesson.id)}>
              <span>{progress[lesson.id]?.completed ? <CheckCircle2 size={18} /> : String(index + 1).padStart(2, '0')}</span>
              <div><strong>{lesson.title}</strong><small>{lesson.level} · {lesson.durationMinutes} 分钟</small></div>
              <ArrowRight size={16} />
            </button>
          ))}
        </aside>

        <article className="course-detail">
          <header className="course-detail__header">
            <div>
              <div className="course-tags"><span>{active.level}</span><span>{modeCopy[active.mode]}</span><span><Clock3 size={13} /> {active.durationMinutes} 分钟</span></div>
              <h2>{active.title}</h2><p>{active.summary}</p>
            </div>
            <div className="course-progress" aria-label="本课进度"><strong>{currentSteps.length}/{active.labSteps.length}</strong><span>学习任务</span></div>
          </header>

          <section className="course-objectives">
            <h3>完成后你应该能</h3>
            <ul>{active.objectives.map((objective) => <li key={objective}><CheckCircle2 size={16} /> {objective}</li>)}</ul>
          </section>

          <section className="course-concepts">
            <div className="subsection-heading"><div><span>CORE CONCEPTS</span><h3>核心知识</h3></div></div>
            <ol>{active.concepts.map((concept) => <li key={concept}>{concept}</li>)}</ol>
          </section>

          <section className="lab-steps">
            <div className="subsection-heading">
              <div><span>LEARNING TASKS</span><h3>学习与练习任务</h3></div>
              <button type="button" onClick={() => void saveLesson(active.id, [], false)}><RotateCcw size={14} /> 重置本课</button>
            </div>
            {active.labSteps.map((step, index) => {
              const done = currentSteps.includes(step.id)
              return (
                <article className={done ? 'lab-step is-done' : 'lab-step'} key={step.id}>
                  <button className="lab-step__check" type="button" aria-label={done ? '取消完成此任务' : '标记完成此任务'} aria-pressed={done} onClick={() => void toggleStep(step.id)}>
                    {done ? <Check size={16} /> : String(index + 1).padStart(2, '0')}
                  </button>
                  <div className="lab-step__body"><span>TASK {String(index + 1).padStart(2, '0')}</span><h4>{step.title}</h4><p>{step.instruction}</p>
                    {step.commands.length > 0 && <div className="lab-step__commands">{step.commands.map((command) => (
                      <button key={command} type="button" onClick={() => void copy(command)}><code>{command}</code>{copied === command ? <Check size={14} /> : <Clipboard size={14} />}</button>
                    ))}</div>}
                    <div className="observation"><strong>你应该理解或观察到</strong><p>{step.expectedObservation}</p></div>
                    {step.safetyNote && <div className="step-warning"><AlertTriangle size={15} /> {step.safetyNote}</div>}
                  </div>
                </article>
              )
            })}
          </section>

          <section className="course-boundary"><div><Cpu size={18} /><h3>练习边界</h3></div><ul>{active.hardwareLimitations.map((item) => <li key={item}>{item}</li>)}</ul></section>

          <footer className="course-navigation">
            <button type="button" disabled={activeIndex === 0} onClick={() => selectLesson(courseLessons[activeIndex - 1].id)}><ArrowLeft size={16} /> 上一课</button>
            <span>第 {activeIndex + 1} / {courseLessons.length} 课</span>
            <button className="button--primary" type="button" onClick={() => void finishAndContinue()}>{activeIndex === courseLessons.length - 1 ? '完成学习路径' : '完成本课并进入下一课'} <ArrowRight size={16} /></button>
          </footer>
        </article>
      </div>
    </div>
  )
}
