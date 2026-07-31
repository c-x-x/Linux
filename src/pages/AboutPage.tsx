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

const learningLayers = [
  ['Linux 基础', '认识内核、Shell、目录树、权限、进程、网络和软件包之间的关系。'],
  ['发行版', '理解 Debian、Ubuntu、Buildroot 与 Yocto 的定位、生命周期和工具差异。'],
  ['企业应用', '学习服务器、容器、服务管理、日志、自动化、安全更新与故障排查。'],
  ['嵌入式工程', '连接交叉编译、Bootloader、内核、设备树、rootfs、OTA 与产品交付。'],
]

export default function AboutPage() {
  return (
    <div className="page about-page">
      <header className="page-heading">
        <div>
          <span className="section-kicker">LINUX LEARNING GUIDE</span>
          <h1>Linux 学习地图</h1>
          <p>从 Linux 与发行版的全局认识开始，逐步进入企业系统管理和嵌入式软件交付。</p>
        </div>
        <Link className="button button--primary" to="/lab">
          <TerminalSquare size={17} /> 打开练习终端
        </Link>
      </header>

      <section className="truth-grid">
        <article className="truth-card truth-card--true">
          <ShieldCheck size={22} />
          <span>FOUNDATION</span>
          <h2>先建立正确的 Linux 认识</h2>
          <ul>
            <li>Linux 严格来说是内核，完整系统还包含 Shell、库、工具、服务和应用。</li>
            <li>发行版负责组织软件仓库、默认配置、发布节奏和支持周期。</li>
            <li>企业使用 Linux 构建服务器、云平台、容器、网络设备和边缘系统。</li>
            <li>学习命令时同时理解用途、输出、错误、风险和发行版差异。</li>
          </ul>
        </article>
        <article className="truth-card truth-card--boundary">
          <Box size={22} />
          <span>EMBEDDED PATH</span>
          <h2>再进入嵌入式工程</h2>
          <ul>
            <li>Buildroot 和 Yocto 用于生成可裁剪、可重复构建的目标系统。</li>
            <li>交叉工具链为 ARM 等目标架构生成程序和系统产物。</li>
            <li>Bootloader、内核、设备树和 rootfs 共同组成启动与运行链路。</li>
            <li>GPIO、I²C、SPI、驱动和掉电测试最终仍需开发板或专用模拟器。</li>
          </ul>
        </article>
      </section>

      <section className="architecture-section">
        <div className="section-heading">
          <div>
            <span className="section-kicker">LEARNING PATH</span>
            <h2>从基础到嵌入式的学习路线</h2>
          </div>
          <p>课程把知识、终端练习和工程场景连接起来，不要求一开始就理解虚拟化术语。</p>
        </div>
        <div className="architecture-flow">
          {learningLayers.map(([title, detail], index) => (
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
            <h2>网站怎样支持练习</h2>
          </div>
        </div>
        <div className="privacy-grid">
          <article>
            <Database size={20} />
            <h3>配置与进度</h3>
            <p>保存在当前站点的 IndexedDB。清理站点数据、无痕模式或更换浏览器会丢失。</p>
          </article>
          <article>
            <Globe2 size={20} />
            <h3>运行方式</h3>
            <p>Ubuntu 和 Debian 使用轻量教学模拟；Buildroot 技术练习需要下载浏览器内运行资源。</p>
          </article>
          <article>
            <LockKeyhole size={20} />
            <h3>终端内容</h3>
            <p>当前实现不把终端输入和练习结果发送到应用后端，也不需要登录账户。</p>
          </article>
          <article>
            <HardDrive size={20} />
            <h3>真实磁盘</h3>
            <p>练习环境只能接触浏览器提供的虚拟资源，安装流程不会扫描或改写电脑分区。</p>
          </article>
        </div>
      </section>

      <section className="roadmap-section">
        <div>
          <GitBranch size={22} />
          <span>OPEN DEVELOPMENT</span>
          <h2>持续完善的 Linux 学习环境</h2>
        </div>
        <ol>
          <li><strong>现在</strong><span>发行版认知、教学安装、命令模拟、课程进度与 Buildroot 技术练习。</span></li>
          <li><strong>下一步</strong><span>扩充命令覆盖、软件包管理、服务部署、Shell 脚本和故障排查实验。</span></li>
          <li><strong>扩展</strong><span>交叉编译、ELF 调试、rootfs 构建、设备树和真实开发板配套实验。</span></li>
        </ol>
      </section>
    </div>
  )
}
