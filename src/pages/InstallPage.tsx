import { useEffect, useMemo, useState } from 'react'
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  CircleDashed,
  Clock3,
  Cpu,
  Database,
  HardDrive,
  Keyboard,
  Loader2,
  LockKeyhole,
  Server,
  TerminalSquare,
} from 'lucide-react'
import { AppLink as Link } from '../components/AppLink'
import {
  createInstallationDraft,
  readInstallation,
  writeInstallation,
  type InstallationProfile,
} from '../features/installation/model'

const steps = [
  '环境检测',
  '认识系统',
  '选择镜像',
  '账户设置',
  '写入配置',
  '完成',
]

interface EnvironmentInfo {
  wasm: boolean
  indexedDb: boolean
  storageAvailable: number | null
  storageUsage: number | null
  memory: number | null
}

function formatBytes(value: number | null) {
  if (value === null) return '浏览器未报告'
  if (value >= 1024 ** 3) return (value / 1024 ** 3).toFixed(1) + ' GB'
  return Math.round(value / 1024 ** 2) + ' MB'
}

function validateUsername(value: string) {
  return /^[a-z_][a-z0-9_-]{0,30}$/.test(value)
}

function validateHostname(value: string) {
  return /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/.test(value)
}

export default function InstallPage() {
  const [step, setStep] = useState(0)
  const [profile, setProfile] = useState<InstallationProfile>(
    createInstallationDraft,
  )
  const [saving, setSaving] = useState(false)
  const [environment, setEnvironment] = useState<EnvironmentInfo>({
    wasm: typeof WebAssembly !== 'undefined',
    indexedDb: typeof indexedDB !== 'undefined',
    storageAvailable: null,
    storageUsage: null,
    memory: null,
  })

  useEffect(() => {
    void readInstallation().then((stored) => {
      if (stored) setProfile(stored)
    })
    const deviceMemory = (navigator as Navigator & { deviceMemory?: number })
      .deviceMemory
    void navigator.storage?.estimate().then((estimate) => {
      setEnvironment((current) => ({
        ...current,
        storageAvailable: estimate.quota ?? null,
        storageUsage: estimate.usage ?? null,
        memory: deviceMemory ?? null,
      }))
    })
  }, [])

  const accountValid = useMemo(
    () =>
      validateUsername(profile.username) &&
      validateHostname(profile.hostname),
    [profile.hostname, profile.username],
  )

  async function saveDraft(nextStep?: number) {
    setSaving(true)
    try {
      await writeInstallation({
        ...profile,
        status: step >= 4 ? 'configured' : 'draft',
      })
      if (typeof nextStep === 'number') setStep(nextStep)
    } finally {
      setSaving(false)
    }
  }

  async function finishConfiguration() {
    setSaving(true)
    try {
      const saved = await writeInstallation({
        ...profile,
        status: 'configured',
        imageId: 'v86-buildroot-bzimage68-probe',
        runtimeVersion: '0.5.424',
        errorMessage: null,
      })
      setProfile(saved)
      setStep(5)
    } finally {
      setSaving(false)
    }
  }

  const canContinue =
    (step !== 0 || (environment.wasm && environment.indexedDb)) &&
    (step !== 3 || accountValid)

  return (
    <div className="page install-page">
      <header className="page-heading">
        <div>
          <span className="section-kicker">GUIDED INSTALLATION</span>
          <h1>安装 Linux 学习系统</h1>
          <p>
            这是教学式配置流程：完成后由浏览器加载经过验证的 Linux
            来宾，而不是访问你的真实磁盘。
          </p>
        </div>
        <div className="page-heading__meta">
          <HardDrive size={18} />
          <span>预计本地占用</span>
          <strong>约 80–160 MB</strong>
        </div>
      </header>

      <div className="installer-layout">
        <aside className="installer-steps" aria-label="安装步骤">
          {steps.map((label, index) => (
            <button
              key={label}
              type="button"
              className={
                index === step
                  ? 'installer-step installer-step--active'
                  : index < step
                    ? 'installer-step installer-step--done'
                    : 'installer-step'
              }
              disabled={index > step}
              onClick={() => index < step && setStep(index)}
            >
              <span>{index < step ? <Check size={15} /> : index + 1}</span>
              <small>STEP {String(index + 1).padStart(2, '0')}</small>
              <strong>{label}</strong>
            </button>
          ))}
        </aside>

        <section className="installer-panel">
          {step === 0 && (
            <div className="installer-content">
              <div className="installer-title">
                <Cpu size={27} />
                <div>
                  <span>PRE-FLIGHT CHECK</span>
                  <h2>这台设备可以运行吗？</h2>
                </div>
              </div>
              <p className="installer-intro">
                虚拟机完全运行在浏览器中。我们先检查关键能力，不会读取你的文件。
              </p>
              <div className="check-grid">
                <CheckRow
                  icon={TerminalSquare}
                  title="WebAssembly"
                  detail="运行 x86 指令翻译器"
                  ok={environment.wasm}
                />
                <CheckRow
                  icon={Database}
                  title="IndexedDB"
                  detail="保存配置与虚拟机快照"
                  ok={environment.indexedDb}
                />
                <CheckRow
                  icon={HardDrive}
                  title="浏览器存储"
                  detail={
                    formatBytes(environment.storageUsage) +
                    ' 已用 / ' +
                    formatBytes(environment.storageAvailable)
                  }
                  ok={environment.storageAvailable !== 0}
                />
                <CheckRow
                  icon={Cpu}
                  title="设备内存"
                  detail={
                    environment.memory
                      ? environment.memory + ' GB（浏览器报告）'
                      : '未报告，将使用保守配置'
                  }
                  ok
                />
              </div>
              {!canContinue && (
                <div className="notice notice--danger">
                  <AlertTriangle size={18} />
                  当前浏览器缺少 WebAssembly 或 IndexedDB，无法继续真实终端。
                </div>
              )}
              <div className="notice">
                <LockKeyhole size={18} />
                系统数据仅保存在当前浏览器。无痕模式、清理站点数据或更换设备会丢失环境。
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="installer-content">
              <div className="installer-title">
                <Server size={27} />
                <div>
                  <span>SYSTEM ANATOMY</span>
                  <h2>你将安装什么？</h2>
                </div>
              </div>
              <p className="installer-intro">
                一个可启动系统不是“一个 Linux 文件”，而是一条连续的启动链。
              </p>
              <div className="boot-chain">
                {[
                  ['01', '虚拟硬件', 'v86 提供 32 位 x86 CPU、内存与串口'],
                  ['02', '固件 / BIOS', '初始化硬件并把控制权交给内核'],
                  ['03', 'Linux Kernel', '管理进程、内存、设备与文件系统'],
                  ['04', 'rootfs', '包含 BusyBox、Shell、配置和学习文件'],
                  ['05', '交互 Shell', '接收你的命令并启动真实程序'],
                ].map(([number, title, detail]) => (
                  <article key={number}>
                    <span>{number}</span>
                    <div>
                      <h3>{title}</h3>
                      <p>{detail}</p>
                    </div>
                    <ArrowRight size={18} />
                  </article>
                ))}
              </div>
              <div className="notice notice--warning">
                <AlertTriangle size={18} />
                当前来宾是 32 位 x86 Buildroot/BusyBox 技术探针，不会伪装成 ARM
                开发板。ARM、GPIO、I²C 与 SPI 属于后续硬件扩展课程。
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="installer-content">
              <div className="installer-title">
                <HardDrive size={27} />
                <div>
                  <span>IMAGE PROFILE</span>
                  <h2>选择学习镜像</h2>
                </div>
              </div>
              <div className="image-options">
                <button
                  type="button"
                  className="image-option image-option--selected"
                  onClick={() =>
                    setProfile({ ...profile, imageProfile: 'core' })
                  }
                >
                  <span className="image-option__flag">当前可验证</span>
                  <TerminalSquare size={25} />
                  <h3>Core · 技术探针</h3>
                  <p>v86 官方 Buildroot 演示镜像 + BusyBox 串口 Shell，用于真实终端学习。</p>
                  <dl>
                    <div>
                      <dt>下载</dt>
                      <dd>约 9.6 MiB</dd>
                    </div>
                    <div>
                      <dt>内存</dt>
                      <dd>64 MB</dd>
                    </div>
                    <div>
                      <dt>架构</dt>
                      <dd>i686</dd>
                    </div>
                  </dl>
                </button>
                <div className="image-option image-option--locked">
                  <span className="image-option__flag">Phase 3</span>
                  <Cpu size={25} />
                  <h3>Embedded · 开发版</h3>
                  <p>计划包含 GCC、binutils、gdb、strace、dtc 与 rootfs 实验。</p>
                  <div className="locked-line">
                    <LockKeyhole size={15} /> 等自建镜像和许可证验证完成后开放
                  </div>
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="installer-content">
              <div className="installer-title">
                <Keyboard size={27} />
                <div>
                  <span>IDENTITY</span>
                  <h2>设置学习档案</h2>
                </div>
              </div>
              <div className="form-grid">
                <label>
                  <span>用户名</span>
                  <input
                    value={profile.username}
                    onChange={(event) =>
                      setProfile({ ...profile, username: event.target.value })
                    }
                    autoComplete="username"
                    aria-invalid={!validateUsername(profile.username)}
                  />
                  <small>保存为课程偏好；当前技术探针不会创建这个来宾账户。</small>
                </label>
                <label>
                  <span>主机名</span>
                  <input
                    value={profile.hostname}
                    onChange={(event) =>
                      setProfile({ ...profile, hostname: event.target.value })
                    }
                    aria-invalid={!validateHostname(profile.hostname)}
                  />
                  <small>用于后续自建镜像；当前技术探针不会修改来宾主机名。</small>
                </label>
                <label>
                  <span>时区</span>
                  <select
                    value={profile.timezone}
                    onChange={(event) =>
                      setProfile({ ...profile, timezone: event.target.value })
                    }
                  >
                    <option value="Asia/Shanghai">Asia/Shanghai</option>
                    <option value="Asia/Hong_Kong">Asia/Hong_Kong</option>
                    <option value="Asia/Taipei">Asia/Taipei</option>
                    <option value="UTC">UTC</option>
                  </select>
                </label>
                <div className="identity-preview">
                  <span>未来自建镜像身份预览</span>
                  <code>
                    {profile.username || 'student'}@
                    {profile.hostname || 'kernel-lab'}:~$
                  </code>
                </div>
              </div>
              {!accountValid && (
                <div className="notice notice--danger">
                  <AlertTriangle size={18} />
                  请修正用户名或主机名格式后继续。
                </div>
              )}
              <div className="notice notice--warning">
                <AlertTriangle size={18} />
                V1 技术探针只保存这些学习偏好，不把用户名、主机名或时区注入当前远程来宾。
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="installer-content">
              <div className="installer-title">
                <CircleDashed size={27} />
                <div>
                  <span>PROVISION</span>
                  <h2>准备首次启动</h2>
                </div>
              </div>
              <div className="provision-list">
                {[
                  ['环境检测', 'WebAssembly 与浏览器存储可用', true],
                  ['档案写入', '学习偏好保存到 IndexedDB，尚未注入来宾', true],
                  ['镜像清单', '固定 v86 版本与远程 Buildroot 探针', true],
                  ['真实启动', '进入实验室后启动内核并等待 Shell 提示符', false],
                  ['健康检查', '只有真实来宾就绪后才标记 ready', false],
                ].map(([title, detail, done]) => (
                  <div key={title as string}>
                    {done ? (
                      <CheckCircle2 size={19} />
                    ) : (
                      <Clock3 size={19} />
                    )}
                    <span>
                      <strong>{title as string}</strong>
                      <small>{detail as string}</small>
                    </span>
                    <em>{done ? '完成' : '首次启动时执行'}</em>
                  </div>
                ))}
              </div>
              <div className="notice">
                <Database size={18} />
                此步骤不会显示随机进度条。镜像下载、启动和健康检查会在命令行实验室中展示真实状态。
              </div>
            </div>
          )}

          {step === 5 && (
            <div className="installer-content installer-complete">
              <span className="installer-complete__icon">
                <Check size={34} />
              </span>
              <span className="section-kicker">CONFIGURATION SAVED</span>
              <h2>配置完成，等待真实首次启动</h2>
              <p>
                进入实验室并点击“启动真实 Linux”。检测到来宾 Shell
                提示符后，系统才会从“已配置”变为“可使用”。
              </p>
              <div className="complete-summary">
                <div>
                  <span>配置</span>
                  <strong>Core · Buildroot 探针</strong>
                </div>
                <div>
                  <span>学习档案（未注入探针）</span>
                  <strong>
                    {profile.username}@{profile.hostname}
                  </strong>
                </div>
                <div>
                  <span>保存</span>
                  <strong>当前浏览器 IndexedDB</strong>
                </div>
              </div>
              <Link className="button button--primary" to="/lab">
                进入命令行实验室 <ArrowRight size={18} />
              </Link>
            </div>
          )}

          {step < 5 && (
            <footer className="installer-footer">
              <button
                className="button button--ghost"
                type="button"
                onClick={() => setStep(Math.max(0, step - 1))}
                disabled={step === 0 || saving}
              >
                <ArrowLeft size={17} /> 上一步
              </button>
              {step < 4 ? (
                <button
                  className="button button--primary"
                  type="button"
                  disabled={!canContinue || saving}
                  onClick={() => void saveDraft(step + 1)}
                >
                  {saving ? <Loader2 className="spin" size={17} /> : null}
                  继续 <ArrowRight size={17} />
                </button>
              ) : (
                <button
                  className="button button--primary"
                  type="button"
                  disabled={saving}
                  onClick={() => void finishConfiguration()}
                >
                  {saving ? <Loader2 className="spin" size={17} /> : null}
                  写入配置 <ArrowRight size={17} />
                </button>
              )}
            </footer>
          )}
        </section>
      </div>
    </div>
  )
}

function CheckRow({
  icon: Icon,
  title,
  detail,
  ok,
}: {
  icon: typeof Cpu
  title: string
  detail: string
  ok: boolean
}) {
  return (
    <article className={ok ? 'check-row check-row--ok' : 'check-row check-row--bad'}>
      <Icon size={20} />
      <span>
        <strong>{title}</strong>
        <small>{detail}</small>
      </span>
      {ok ? <Check size={17} /> : <AlertTriangle size={17} />}
    </article>
  )
}
