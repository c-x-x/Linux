import { useEffect, useState } from 'react'
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
  Network,
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
  '选择发行版',
  '磁盘分区',
  '网络配置',
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

function validateIpv4(value: string, allowCidr = false) {
  const [address, prefix] = value.split('/')
  if (prefix !== undefined) {
    if (!allowCidr || !/^\d{1,2}$/.test(prefix)) return false
    const prefixLength = Number(prefix)
    if (prefixLength < 0 || prefixLength > 32) return false
  }
  const octets = address.split('.')
  return (
    octets.length === 4 &&
    octets.every((octet) => /^\d{1,3}$/.test(octet) && Number(octet) <= 255)
  )
}

function validateDnsServers(value: string) {
  const servers = value
    .split(',')
    .map((server) => server.trim())
    .filter(Boolean)
  return servers.length > 0 && servers.every((server) => validateIpv4(server))
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

  const accountValid =
    validateUsername(profile.username) && validateHostname(profile.hostname)
  const diskValid =
    profile.diskSizeMiB >= 512 &&
    profile.rootSizeMiB >= 256 &&
    profile.swapSizeMiB >= 0 &&
    profile.rootSizeMiB + profile.swapSizeMiB + 64 <= profile.diskSizeMiB
  const networkValid =
    profile.networkMode === 'dhcp' ||
    (validateIpv4(profile.ipv4Address, true) &&
      validateIpv4(profile.gateway) &&
      validateDnsServers(profile.dnsServers))

  async function saveDraft(nextStep?: number) {
    setSaving(true)
    try {
      await writeInstallation({
        ...profile,
        status: step >= 6 ? 'configured' : 'draft',
      })
      if (typeof nextStep === 'number') setStep(nextStep)
    } finally {
      setSaving(false)
    }
  }

  async function finishConfiguration() {
    setSaving(true)
    try {
      const simulated = profile.distribution !== 'buildroot'
      const saved = await writeInstallation({
        ...profile,
        status: simulated ? 'ready' : 'configured',
        imageId: simulated
          ? `simulated-${profile.distribution}-learning-environment`
          : 'v86-buildroot-bzimage68-probe',
        runtimeVersion: simulated ? 'teaching-simulator-1' : '0.5.424',
        errorMessage: null,
      })
      setProfile(saved)
      setStep(7)
    } finally {
      setSaving(false)
    }
  }

  const canContinue =
    (step !== 0 || (environment.wasm && environment.indexedDb)) &&
    (step !== 3 || diskValid) &&
    (step !== 4 || networkValid) &&
    (step !== 5 || accountValid)

  return (
    <div className="page install-page">
      <header className="page-heading">
        <div>
          <span className="section-kicker">GUIDED INSTALLATION</span>
          <h1>安装 Linux 学习系统</h1>
          <p>
            这是教学式配置流程：Buildroot 可启动真实内核，Debian 和 Ubuntu
            使用明确标识的浏览器模拟环境，都不会访问你的真实磁盘。
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
              aria-current={index === step ? 'step' : undefined}
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
                当前可启动环境是 32 位 x86 Buildroot/BusyBox 技术探针，不会伪装成 ARM
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
              <p className="installer-intro">
                发行版决定用户空间、软件包工具和课程内容。你可以选择真实轻量环境，
                也可以选择覆盖面更完整的发行版教学模拟。
              </p>
              <div className="image-options image-options--distributions">
                <button
                  type="button"
                  className={profile.distribution === 'buildroot' ? 'image-option image-option--selected' : 'image-option'}
                  aria-pressed={profile.distribution === 'buildroot'}
                  onClick={() =>
                    setProfile({
                      ...profile,
                      distribution: 'buildroot',
                      imageProfile: 'core',
                    })
                  }
                >
                  <span className="image-option__flag">现在可启动</span>
                  <TerminalSquare size={25} />
                  <h3>Buildroot Core</h3>
                  <p>轻量 Linux + BusyBox 串口 Shell，适合启动链、rootfs 与嵌入式基础。</p>
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
                <button
                  type="button"
                  className={profile.distribution === 'debian' ? 'image-option image-option--selected' : 'image-option'}
                  aria-pressed={profile.distribution === 'debian'}
                  onClick={() => setProfile({ ...profile, distribution: 'debian', imageProfile: 'core' })}
                >
                  <span className="image-option__flag">教学模拟 · 可使用</span>
                  <Server size={25} />
                  <h3>Debian 12</h3>
                  <p>模拟 Bookworm、apt、GNU 用户空间、systemd、磁盘、网络与服务器管理。</p>
                  <div className="locked-line">
                    <CheckCircle2 size={15} /> 无需下载大镜像，安装后立即进入终端
                  </div>
                </button>
                <button
                  type="button"
                  className={profile.distribution === 'ubuntu' ? 'image-option image-option--selected' : 'image-option'}
                  aria-pressed={profile.distribution === 'ubuntu'}
                  onClick={() => setProfile({ ...profile, distribution: 'ubuntu', imageProfile: 'core' })}
                >
                  <span className="image-option__flag">教学模拟 · 可使用</span>
                  <Cpu size={25} />
                  <h3>Ubuntu 24.04 LTS</h3>
                  <p>模拟 Noble、apt、systemd、SSH、云服务器与企业应用学习场景。</p>
                  <div className="locked-line">
                    <CheckCircle2 size={15} /> 无需在浏览器运行过期的 32 位系统
                  </div>
                </button>
              </div>
              <div className="notice notice--warning">
                <AlertTriangle size={18} />
                “教学模拟”会生成符合所选发行版的文件、命令和系统状态，但不是完整虚拟机。
                需要观察真实内核行为时，请选择 Buildroot Core。
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="installer-content">
              <div className="installer-title">
                <HardDrive size={27} />
                <div>
                  <span>STORAGE LAYOUT</span>
                  <h2>分配虚拟磁盘</h2>
                </div>
              </div>
              <p className="installer-intro">
                练习安装器会检查分区容量并保存方案。当前 Buildroot 探针内置 rootfs，暂时不会真正格式化这个虚拟磁盘。
              </p>
              <div className="choice-tabs" role="group" aria-label="分区方式">
                <button
                  type="button"
                  className={profile.diskLayout === 'guided' ? 'is-active' : ''}
                  aria-pressed={profile.diskLayout === 'guided'}
                  onClick={() =>
                    setProfile({
                      ...profile,
                      diskLayout: 'guided',
                      rootSizeMiB: profile.diskSizeMiB - 192,
                      swapSizeMiB: 128,
                    })
                  }
                >
                  自动分区（推荐）
                </button>
                <button
                  type="button"
                  className={profile.diskLayout === 'manual' ? 'is-active' : ''}
                  aria-pressed={profile.diskLayout === 'manual'}
                  onClick={() => setProfile({ ...profile, diskLayout: 'manual' })}
                >
                  手动分区
                </button>
              </div>
              <div className="form-grid storage-form">
                <label>
                  <span>虚拟磁盘容量</span>
                  <select
                    value={profile.diskSizeMiB}
                    onChange={(event) => {
                      const diskSizeMiB = Number(event.target.value)
                      setProfile({
                        ...profile,
                        diskSizeMiB,
                        rootSizeMiB:
                          profile.diskLayout === 'guided'
                            ? diskSizeMiB - 192
                            : Math.min(profile.rootSizeMiB, diskSizeMiB - 192),
                      })
                    }}
                  >
                    <option value={512}>512 MiB</option>
                    <option value={1024}>1 GiB</option>
                    <option value={2048}>2 GiB</option>
                    <option value={4096}>4 GiB</option>
                  </select>
                </label>
                <label>
                  <span>根分区 /（ext4）</span>
                  <input
                    type="number"
                    min="256"
                    step="64"
                    value={profile.rootSizeMiB}
                    disabled={profile.diskLayout === 'guided'}
                    onChange={(event) =>
                      setProfile({ ...profile, rootSizeMiB: Number(event.target.value) })
                    }
                  />
                </label>
                <label>
                  <span>Swap</span>
                  <input
                    type="number"
                    min="0"
                    step="64"
                    value={profile.swapSizeMiB}
                    disabled={profile.diskLayout === 'guided'}
                    onChange={(event) =>
                      setProfile({ ...profile, swapSizeMiB: Number(event.target.value) })
                    }
                  />
                </label>
              </div>
              <div className="partition-map" aria-label="分区预览">
                <div className="partition-map__boot" style={{ flex: 64 }}>
                  <strong>/boot</strong><span>64 MiB</span>
                </div>
                <div className="partition-map__root" style={{ flex: profile.rootSizeMiB }}>
                  <strong>/</strong><span>{profile.rootSizeMiB} MiB · ext4</span>
                </div>
                {profile.swapSizeMiB > 0 && (
                  <div className="partition-map__swap" style={{ flex: profile.swapSizeMiB }}>
                    <strong>swap</strong><span>{profile.swapSizeMiB} MiB</span>
                  </div>
                )}
              </div>
              {!diskValid && (
                <div className="notice notice--danger">
                  <AlertTriangle size={18} />
                  分区总容量超过虚拟磁盘，或根分区小于 256 MiB。
                </div>
              )}
            </div>
          )}

          {step === 4 && (
            <div className="installer-content">
              <div className="installer-title">
                <Network size={27} />
                <div>
                  <span>NETWORK SETUP</span>
                  <h2>配置网络</h2>
                </div>
              </div>
              <p className="installer-intro">
                DHCP 适合初学者；静态 IPv4 用于学习地址、网关和 DNS 的关系。
              </p>
              <div className="choice-tabs" role="group" aria-label="网络配置方式">
                <button
                  type="button"
                  className={profile.networkMode === 'dhcp' ? 'is-active' : ''}
                  aria-pressed={profile.networkMode === 'dhcp'}
                  onClick={() => setProfile({ ...profile, networkMode: 'dhcp' })}
                >
                  DHCP 自动获取（推荐）
                </button>
                <button
                  type="button"
                  className={profile.networkMode === 'static' ? 'is-active' : ''}
                  aria-pressed={profile.networkMode === 'static'}
                  onClick={() => setProfile({ ...profile, networkMode: 'static' })}
                >
                  静态 IPv4
                </button>
              </div>
              {profile.networkMode === 'dhcp' ? (
                <div className="network-summary">
                  <Network size={25} />
                  <div><strong>自动获取网络参数</strong><span>安装方案将记录 DHCP；当前练习环境暂不开放联网。</span></div>
                </div>
              ) : (
                <div className="form-grid">
                  <label>
                    <span>IPv4 地址 / 前缀</span>
                    <input
                      value={profile.ipv4Address}
                      aria-invalid={!validateIpv4(profile.ipv4Address, true)}
                      onChange={(event) => setProfile({ ...profile, ipv4Address: event.target.value })}
                      placeholder="192.168.1.100/24"
                    />
                  </label>
                  <label>
                    <span>默认网关</span>
                    <input
                      value={profile.gateway}
                      aria-invalid={!validateIpv4(profile.gateway)}
                      onChange={(event) => setProfile({ ...profile, gateway: event.target.value })}
                      placeholder="192.168.1.1"
                    />
                  </label>
                  <label>
                    <span>DNS 服务器（逗号分隔）</span>
                    <input
                      value={profile.dnsServers}
                      aria-invalid={!validateDnsServers(profile.dnsServers)}
                      onChange={(event) => setProfile({ ...profile, dnsServers: event.target.value })}
                      placeholder="1.1.1.1, 8.8.8.8"
                    />
                  </label>
                </div>
              )}
              {!networkValid && (
                <div className="notice notice--danger">
                  <AlertTriangle size={18} /> 请检查 IPv4、网关和 DNS 地址格式。
                </div>
              )}
              <div className="notice notice--warning">
                <AlertTriangle size={18} />
                浏览器练习环境的网络需要独立代理和安全设计；本步骤当前只用于教学与保存配置，不承诺公网连接。
              </div>
            </div>
          )}

          {step === 5 && (
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
                  <small>{profile.distribution === 'buildroot' ? '保存为课程偏好；真实探针不会创建此账户。' : '会成为模拟终端的用户名和主目录。'}</small>
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
                  <small>{profile.distribution === 'buildroot' ? '保存为课程偏好；真实探针不会修改主机名。' : '会显示在模拟终端提示符和系统信息中。'}</small>
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
                  <span>终端身份预览</span>
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
                {profile.distribution === 'buildroot'
                  ? 'Buildroot 真实探针只保存这些学习偏好，不会修改内部默认账户。'
                  : '模拟环境会应用用户名、主机名和时区；这些设置仅保存在当前浏览器。'}
              </div>
            </div>
          )}

          {step === 6 && (
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
                  ['发行版', profile.distribution === 'buildroot' ? 'Buildroot Core 已通过真实启动验证' : `${profile.distribution === 'debian' ? 'Debian 12' : 'Ubuntu 24.04 LTS'} 教学模拟环境`, true],
                  ['磁盘方案', `${profile.diskSizeMiB} MiB · ext4 根分区 · ${profile.swapSizeMiB} MiB swap`, true],
                  ['网络方案', profile.networkMode === 'dhcp' ? 'DHCP 自动获取' : `${profile.ipv4Address} · 网关 ${profile.gateway}`, true],
                  ['档案写入', '安装方案保存到当前浏览器 IndexedDB', true],
                  ['运行方式', profile.distribution === 'buildroot' ? '固定 v86 版本与 Buildroot 探针' : '浏览器内教学命令模拟器', true],
                  ['终端启动', profile.distribution === 'buildroot' ? '进入实验室后启动内核并等待 Shell' : '配置写入后立即可用', profile.distribution !== 'buildroot'],
                  ['状态验证', profile.distribution === 'buildroot' ? '真实 Shell 就绪后标记 ready' : '模拟配置完整性已检查', profile.distribution !== 'buildroot'],
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
                {profile.distribution === 'buildroot'
                  ? '镜像下载、启动和健康检查会在命令行实验室展示真实状态。'
                  : '模拟环境不会下载系统镜像；写入配置后立即生成对应发行版的学习终端。'}
              </div>
            </div>
          )}

          {step === 7 && (
            <div className="installer-content installer-complete">
              <span className="installer-complete__icon">
                <Check size={34} />
              </span>
              <span className="section-kicker">CONFIGURATION SAVED</span>
              <h2>{profile.distribution === 'buildroot' ? '配置完成，等待真实首次启动' : '模拟系统安装完成'}</h2>
              <p>
                {profile.distribution === 'buildroot'
                  ? '进入实验室并启动真实 Linux，检测到 Shell 提示符后即可使用。'
                  : '进入实验室即可使用发行版教学终端，练习命令、Tab 补全、磁盘、网络和服务管理。'}
              </p>
              <div className="complete-summary">
                <div>
                  <span>发行版</span>
                  <strong>{profile.distribution === 'buildroot' ? 'Buildroot Core（真实）' : profile.distribution === 'debian' ? 'Debian 12（模拟）' : 'Ubuntu 24.04 LTS（模拟）'}</strong>
                </div>
                <div>
                  <span>磁盘方案</span>
                  <strong>{profile.diskSizeMiB} MiB · ext4</strong>
                </div>
                <div>
                  <span>网络方案</span>
                  <strong>{profile.networkMode === 'dhcp' ? 'DHCP' : '静态 IPv4'}</strong>
                </div>
                <div>
                  <span>学习档案</span>
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

          {step < 7 && (
            <footer className="installer-footer">
              <button
                className="button button--ghost"
                type="button"
                onClick={() => setStep(Math.max(0, step - 1))}
                disabled={step === 0 || saving}
              >
                <ArrowLeft size={17} /> 上一步
              </button>
              {step < 6 ? (
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
