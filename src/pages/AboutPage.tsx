import {
  Box,
  Database,
  GitBranch,
  Globe2,
  HardDrive,
  LockKeyhole,
  ShieldCheck,
  TerminalSquare,
} from 'lucide-react'
import { AppLink as Link } from '../components/AppLink'

const layers = [
  ['学习界面', 'React 负责路由、课程、提示与安装配置，不解释 Linux 命令。'],
  ['终端', 'xterm.js 负责键盘输入、字符绘制和终端控制序列。'],
  ['虚拟硬件', 'v86 在 WebAssembly 中模拟 32 位 x86 计算机。'],
  ['来宾系统', 'Linux 内核与 BusyBox 产生真实进程、文件、错误和退出码。'],
]

export default function AboutPage() {
  return (
    <div className="page about-page">
      <header className="page-heading">
        <div>
          <span className="section-kicker">HOW IT REALLY WORKS</span>
          <h1>这里“真实”的边界</h1>
          <p>
            它是真实运行的 Linux 来宾，但不是远程服务器、不是你的电脑系统，也不是 ARM 开发板。
          </p>
        </div>
        <Link className="button button--primary" to="/lab">
          <TerminalSquare size={17} /> 打开真实终端
        </Link>
      </header>

      <section className="truth-grid">
        <article className="truth-card truth-card--true">
          <ShieldCheck size={22} />
          <span>TRUE</span>
          <h2>真实发生的部分</h2>
          <ul>
            <li>Linux 内核在浏览器的 v86 虚拟机中启动。</li>
            <li>命令由来宾 Shell 解析，程序在来宾中执行。</li>
            <li>标准输出、错误信息和退出状态来自来宾。</li>
            <li>BusyBox 的 Tab、命令历史与 Ctrl+C 已在浏览器实测。</li>
          </ul>
        </article>
        <article className="truth-card truth-card--boundary">
          <Box size={22} />
          <span>BOUNDARY</span>
          <h2>不会假装的部分</h2>
          <ul>
            <li>当前探针是 i686 Buildroot/BusyBox，不宣称是 Bash。</li>
            <li>x86 虚拟硬件不能代表 ARM SoC、GPIO、I²C 或 SPI。</li>
            <li>安装器不会分区或覆盖设备的真实磁盘。</li>
            <li>未在来宾清单验证的命令，不宣称已经安装。</li>
          </ul>
        </article>
      </section>

      <section className="architecture-section">
        <div className="section-heading">
          <div>
            <span className="section-kicker">ARCHITECTURE</span>
            <h2>一条可以检查的输入输出链</h2>
          </div>
          <p>网页不维护“命令 → 固定答案”表。</p>
        </div>
        <div className="architecture-flow">
          {layers.map(([title, detail], index) => (
            <article key={title}>
              <span>{String(index + 1).padStart(2, '0')}</span>
              <div>
                <h3>{title}</h3>
                <p>{detail}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="privacy-section">
        <div className="section-heading">
          <div>
            <span className="section-kicker">LOCAL-FIRST</span>
            <h2>保存与网络</h2>
          </div>
        </div>
        <div className="privacy-grid">
          <article>
            <Database size={20} />
            <h3>配置与快照</h3>
            <p>保存在当前站点的 IndexedDB。清理站点数据、无痕模式或更换浏览器会丢失。</p>
          </article>
          <article>
            <Globe2 size={20} />
            <h3>首次资源下载</h3>
            <p>启动探针时下载固定 v86、BIOS 与约 5 MB 内核镜像；之后是否缓存由浏览器决定。</p>
          </article>
          <article>
            <LockKeyhole size={20} />
            <h3>终端内容</h3>
            <p>当前实现不把输入和来宾输出发送到应用后端，也不需要登录账户。</p>
          </article>
          <article>
            <HardDrive size={20} />
            <h3>真实磁盘</h3>
            <p>来宾只能接触浏览器提供的虚拟资源，安装流程不会扫描或改写电脑分区。</p>
          </article>
        </div>
      </section>

      <section className="roadmap-section">
        <div>
          <GitBranch size={22} />
          <span>OPEN DEVELOPMENT</span>
          <h2>从技术探针走向可分发学习镜像</h2>
        </div>
        <ol>
          <li><strong>现在</strong><span>真实启动、串口终端、配置与快照链路。</span></li>
          <li><strong>下一步</strong><span>自建固定 Buildroot、Bash/Readline、命令清单和完整许可证材料。</span></li>
          <li><strong>扩展</strong><span>交叉编译、ELF 调试、rootfs 构建和真实开发板配套实验。</span></li>
        </ol>
      </section>
    </div>
  )
}
