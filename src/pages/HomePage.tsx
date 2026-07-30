import {
  ArrowRight,
  Binary,
  CheckCircle2,
  ChevronRight,
  CircuitBoard,
  HardDrive,
  ShieldCheck,
  TerminalSquare,
} from 'lucide-react'
import { AppLink as Link } from '../components/AppLink'
import { useInstallation } from '../features/installation/useInstallation'

const statusCopy = {
  draft: ['配置未完成', '继续完成安装设置'],
  configured: ['等待首次启动', '进入终端完成健康检查'],
  ready: ['系统可以启动', '继续你的 Linux 环境'],
  error: ['环境需要处理', '查看错误并尝试恢复'],
  'not-installed': ['尚未安装', '先创建学习系统'],
} as const

export default function HomePage() {
  const { installation, loading } = useInstallation()
  const status = installation?.status ?? 'not-installed'
  const [statusTitle, statusAction] = statusCopy[status]

  return (
    <div className="page home-page">
      <section className="hero">
        <div className="hero__eyebrow">
          <span className="hero__eyebrow-line" />
          EMBEDDED LINUX LEARNING SYSTEM
        </div>
        <h1>
          把 Linux 拆开，
          <br />
          <span>再亲手装回去。</span>
        </h1>
        <p className="hero__lead">
          从磁盘、rootfs 与启动流程开始，进入浏览器内真正运行的 Linux
          命令行。每条输出都来自浏览器内运行的 Linux，不靠前端伪造。
        </p>
        <div className="hero__actions">
          <Link className="button button--primary" to="/install">
            开始装系统 <ArrowRight size={18} />
          </Link>
          <Link className="button button--ghost" to="/lab">
            打开命令行实验室
          </Link>
        </div>
        <div className="hero__proof">
          <span>
            <CheckCircle2 size={15} /> 真实内核
          </span>
          <span>
            <CheckCircle2 size={15} /> 真实退出码
          </span>
          <span>
            <CheckCircle2 size={15} /> BusyBox Tab 补全
          </span>
        </div>
        <div className="hero__terminal" aria-hidden="true">
          <div className="hero__terminal-bar">
            <span />
            <span />
            <span />
            <small>DEMO ONLY · 界面示意</small>
          </div>
          <pre>
            <code>
              <span className="term-muted"># 真实输出只在实验室启动后出现</span>
              {'\n'}
              <span className="term-muted"># 此处不预演固定命令结果</span>
              {'\n'}
              <span className="term-path">~</span>% uname -a
              {'\n'}
              <span className="term-muted">[由浏览器内 Linux 返回真实结果]</span>
              {'\n'}
              <span className="term-path">~</span>% <span className="term-cursor" />
            </code>
          </pre>
        </div>
      </section>

      <section className="status-strip" aria-live="polite">
        <div>
          <span
            className={'status-strip__light status-strip__light--' + status}
          />
          <small>你的学习系统</small>
          <strong>{loading ? '正在检查…' : statusTitle}</strong>
        </div>
        <div className="status-strip__meta">
          <span>配置</span>
          <strong>
            {installation?.distribution === 'debian'
              ? 'Debian'
              : installation?.distribution === 'ubuntu'
                ? 'Ubuntu'
                : 'Buildroot Core'}
          </strong>
        </div>
        <div className="status-strip__meta">
          <span>保存位置</span>
          <strong>本机浏览器</strong>
        </div>
        <Link to={status === 'ready' ? '/lab' : '/install'}>
          {statusAction} <ChevronRight size={17} />
        </Link>
      </section>

      <section className="section-block">
        <div className="section-heading">
          <div>
            <span className="section-kicker">TWO LEARNING SURFACES</span>
            <h2>先理解系统，再掌握系统</h2>
          </div>
          <p>安装和使用共享同一个本地环境，学到的不是动画，而是系统行为。</p>
        </div>
        <div className="path-grid">
          <Link className="path-card path-card--install" to="/install">
            <div className="path-card__number">01</div>
            <div className="path-card__icon">
              <HardDrive size={25} />
            </div>
            <span>INSTALL</span>
            <h3>装系统</h3>
            <p>认识内核、引导、分区、文件系统和首次启动，生成属于你的学习环境。</p>
            <ul>
              <li>环境与存储检测</li>
              <li>分区和 rootfs 教学</li>
              <li>可恢复的本地配置</li>
            </ul>
            <span className="path-card__action">
              进入安装器 <ArrowRight size={18} />
            </span>
          </Link>
          <Link className="path-card path-card--lab" to="/lab">
            <div className="path-card__number">02</div>
            <div className="path-card__icon">
              <TerminalSquare size={25} />
            </div>
            <span>OPERATE</span>
            <h3>使用系统</h3>
            <p>通过串口进入真实 Linux 用户空间，练习命令、管道、权限与程序调试。</p>
            <ul>
              <li>真实 BusyBox/Linux 探针</li>
              <li>Tab、历史与 Ctrl+C 已实测</li>
              <li>课程和命令提示并行</li>
            </ul>
            <span className="path-card__action">
              启动实验室 <ArrowRight size={18} />
            </span>
          </Link>
        </div>
      </section>

      <section className="section-block foundations">
        <div className="section-heading">
          <div>
            <span className="section-kicker">BUILT FOR EMBEDDED</span>
            <h2>围绕嵌入式 Linux 的知识骨架</h2>
          </div>
        </div>
        <div className="foundation-grid">
          <article>
            <CircuitBoard size={22} />
            <h3>系统组成</h3>
            <p>Kernel · BusyBox · rootfs · init</p>
          </article>
          <article>
            <Binary size={22} />
            <h3>构建分析</h3>
            <p>GCC · ELF · binutils · Make</p>
          </article>
          <article>
            <TerminalSquare size={22} />
            <h3>调试运维</h3>
            <p>gdb · strace · procfs · sysfs</p>
          </article>
          <article>
            <ShieldCheck size={22} />
            <h3>边界诚实</h3>
            <p>浏览器 x86 环境不等于 ARM 真实硬件</p>
          </article>
        </div>
      </section>
    </div>
  )
}
