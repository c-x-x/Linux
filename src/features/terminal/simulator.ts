import type { InstallationProfile, LinuxDistribution } from '../installation/model'

export interface SimulatorState {
  cwd: string
  files: Record<string, string>
  directories: string[]
  history: string[]
}

const distributionInfo = {
  debian: {
    label: 'Debian GNU/Linux 12 (bookworm)',
    osRelease: 'PRETTY_NAME="Debian GNU/Linux 12 (bookworm)"\nNAME="Debian GNU/Linux"\nVERSION_ID="12"\nVERSION="12 (bookworm)"\nID=debian\nHOME_URL="https://www.debian.org/"',
    kernel: 'Linux 6.1.0-32-686-pae',
  },
  ubuntu: {
    label: 'Ubuntu 24.04.2 LTS',
    osRelease: 'PRETTY_NAME="Ubuntu 24.04.2 LTS"\nNAME="Ubuntu"\nVERSION_ID="24.04"\nVERSION="24.04.2 LTS (Noble Numbat)"\nVERSION_CODENAME=noble\nID=ubuntu\nID_LIKE=debian',
    kernel: 'Linux 6.8.0-57-generic',
  },
} as const

export const simulatedCommands = [
  'alias', 'apt', 'basename', 'blkid', 'cat', 'cd', 'chmod', 'chown', 'clear',
  'command', 'cp', 'curl', 'date', 'df', 'dmesg', 'dpkg', 'du', 'echo', 'env',
  'export', 'file', 'find', 'free', 'grep', 'groups', 'head', 'help', 'history',
  'hostname', 'id', 'ip', 'jobs', 'journalctl', 'kill', 'less', 'ln', 'ls',
  'lsblk', 'man', 'mkdir', 'mount', 'mv', 'passwd', 'pgrep', 'ping', 'printf',
  'ps', 'pwd', 'rm', 'scp', 'sed', 'shutdown', 'sleep', 'sort', 'ss', 'ssh',
  'stat', 'sudo', 'systemctl', 'tail', 'tar', 'top', 'touch', 'uname', 'uniq',
  'uptime', 'wc', 'wget', 'which', 'who', 'whoami', 'xargs',
] as const

export function createSimulatorState(profile: InstallationProfile): SimulatorState {
  const home = `/home/${profile.username}`
  return {
    cwd: home,
    directories: ['/', '/bin', '/boot', '/dev', '/etc', '/home', home, `${home}/labs`, '/proc', '/root', '/run', '/srv', '/sys', '/tmp', '/usr', '/var', '/var/log'],
    files: {
      '/etc/os-release': distributionInfo[profile.distribution as 'debian' | 'ubuntu']?.osRelease ?? '',
      '/etc/hostname': profile.hostname + '\n',
      '/etc/hosts': `127.0.0.1 localhost\n127.0.1.1 ${profile.hostname}\n`,
      '/proc/cpuinfo': 'processor\t: 0\nvendor_id\t: GenuineIntel\nmodel name\t: v86 teaching simulator\ncpu MHz\t\t: 2400.000\nflags\t\t: fpu tsc cx8 cmov mmx sse sse2\n',
      [`${home}/README.txt`]: '欢迎使用 Linux 教学模拟环境。\n输入 help 查看建议命令。\n',
      '/var/log/syslog': 'Jul 31 08:00:01 kernel-lab systemd[1]: Started Network Service.\nJul 31 08:00:02 kernel-lab systemd[1]: Reached target Multi-User System.\n',
    },
    history: [],
  }
}

function simulatorStorageKey(profile: InstallationProfile) {
  return `kernel-lab-simulator:${profile.distribution}:${profile.username}:${profile.hostname}`
}

export function loadSimulatorState(profile: InstallationProfile): SimulatorState {
  try {
    const raw = localStorage.getItem(simulatorStorageKey(profile))
    if (!raw) return createSimulatorState(profile)
    const value = JSON.parse(raw) as Partial<SimulatorState>
    if (!value.cwd || !Array.isArray(value.directories) || !value.files || !Array.isArray(value.history)) {
      return createSimulatorState(profile)
    }
    return value as SimulatorState
  } catch {
    return createSimulatorState(profile)
  }
}

export function saveSimulatorState(profile: InstallationProfile, state: SimulatorState) {
  try {
    localStorage.setItem(simulatorStorageKey(profile), JSON.stringify(state))
  } catch {
    // The terminal remains usable for the current tab when storage is unavailable.
  }
}

export function resetSimulatorState(profile: InstallationProfile) {
  try {
    localStorage.removeItem(simulatorStorageKey(profile))
  } catch {
    // Ignore unavailable browser storage; the in-memory state is still reset.
  }
}

function normalizePath(cwd: string, value = '.') {
  const parts = (value.startsWith('/') ? value : `${cwd}/${value}`).split('/')
  const normalized: string[] = []
  for (const part of parts) {
    if (!part || part === '.') continue
    if (part === '..') normalized.pop()
    else normalized.push(part)
  }
  return '/' + normalized.join('/')
}

function children(state: SimulatorState, path: string) {
  const prefix = path === '/' ? '/' : path + '/'
  return [...state.directories, ...Object.keys(state.files)]
    .filter((item) => item.startsWith(prefix) && item !== path)
    .map((item) => item.slice(prefix.length).split('/')[0])
    .filter((item, index, all) => item && all.indexOf(item) === index)
    .sort()
}

function distro(profile: InstallationProfile) {
  return distributionInfo[profile.distribution as 'debian' | 'ubuntu'] ?? distributionInfo.debian
}

function network(profile: InstallationProfile) {
  const address = profile.networkMode === 'dhcp' ? '10.0.2.15/24' : profile.ipv4Address
  const gateway = profile.networkMode === 'dhcp' ? '10.0.2.2' : profile.gateway
  return { address, gateway }
}

export function executeSimulatedCommand(
  input: string,
  state: SimulatorState,
  profile: InstallationProfile,
): { output: string; clear?: boolean } {
  const trimmed = input.trim()
  if (!trimmed) return { output: '' }
  state.history.push(trimmed)

  if (trimmed.includes('&&') || trimmed.includes(';')) {
    const commands = trimmed.split(/\s*(?:&&|;)\s*/).filter(Boolean)
    const outputs: string[] = []
    for (const command of commands) {
      const result = executeSimulatedCommand(command, state, profile)
      if (result.output) outputs.push(result.output)
    }
    return { output: outputs.join('\n') }
  }

  const redirect = trimmed.match(/^(printf|echo)\s+(.+?)\s*(>>|>)\s*(\S+)$/)
  if (redirect) {
    const result = executeSimulatedCommand(`${redirect[1]} ${redirect[2]}`, state, profile)
    const target = normalizePath(state.cwd, redirect[4])
    state.files[target] = redirect[3] === '>>' ? (state.files[target] ?? '') + result.output + '\n' : result.output + '\n'
    return { output: '' }
  }

  if (trimmed.includes('|')) {
    if (/printf .*\\n.*\|\s*grep\s+/.test(trimmed)) {
      const needle = trimmed.match(/\|\s*grep\s+([^ ]+)/)?.[1] ?? ''
      const quoted = [...trimmed.matchAll(/'([^']*)'/g)].flatMap((match) => match[1].split('\\n'))
      return { output: quoted.filter((line) => line.includes(needle)).join('\n') }
    }
    if (/cat\s+\S+\s*\|\s*(head|tail)/.test(trimmed)) {
      const path = normalizePath(state.cwd, trimmed.split(/\s+/)[1])
      return { output: state.files[path] ?? `cat: ${path}: No such file or directory` }
    }
    const countMatch = trimmed.match(/^grep\s+(\S+)\s+(\S+)\s*\|\s*wc\s+-l$/)
    if (countMatch) {
      const content = state.files[normalizePath(state.cwd, countMatch[2])] ?? ''
      return { output: String(content.split('\n').filter((line) => line.includes(countMatch[1])).length) }
    }
    const teeMatch = trimmed.match(/^grep\s+(\S+)\s+(\S+)\s*\|\s*tee\s+(\S+)$/)
    if (teeMatch) {
      const content = state.files[normalizePath(state.cwd, teeMatch[2])] ?? ''
      const output = content.split('\n').filter((line) => line.includes(teeMatch[1])).join('\n')
      state.files[normalizePath(state.cwd, teeMatch[3])] = output + (output ? '\n' : '')
      return { output }
    }
  }

  const [name, ...args] = trimmed.split(/\s+/)
  const arg = args.find((value) => !value.startsWith('-'))
  const home = `/home/${profile.username}`
  const info = distro(profile)
  const net = network(profile)

  switch (name) {
    case 'clear': return { output: '', clear: true }
    case 'help': return { output: '常用练习：pwd、ls、cd、cat、mkdir、touch、cp、mv、rm、uname、ip、apt、systemctl\n按 Tab 补全命令或路径；↑/↓ 查看历史。\n注意：当前是教学模拟环境，输出不会用于生产诊断。' }
    case 'pwd': return { output: state.cwd }
    case 'whoami': return { output: profile.username }
    case 'hostname': return { output: profile.hostname }
    case 'id': return { output: `uid=1000(${profile.username}) gid=1000(${profile.username}) groups=1000(${profile.username}),27(sudo)` }
    case 'groups': return { output: `${profile.username} sudo` }
    case 'uname': return { output: args.includes('-a') ? `${info.kernel} ${profile.hostname} #1 SMP PREEMPT_DYNAMIC i686 GNU/Linux` : args.includes('-m') ? (profile.distribution === 'ubuntu' ? 'x86_64' : 'i686') : 'Linux' }
    case 'date': return { output: new Intl.DateTimeFormat('zh-CN', { dateStyle: 'full', timeStyle: 'long', timeZone: profile.timezone }).format(new Date()) }
    case 'uptime': return { output: ' 08:26:14 up 17 min,  1 user,  load average: 0.03, 0.05, 0.01' }
    case 'history': return { output: state.history.map((line, index) => `${String(index + 1).padStart(4)}  ${line}`).join('\n') }
    case 'env': return { output: `SHELL=/bin/bash\nUSER=${profile.username}\nHOME=${home}\nLANG=zh_CN.UTF-8\nTERM=xterm-256color\nPATH=/usr/local/bin:/usr/bin:/bin` }
    case 'which':
    case 'command': {
      const target = name === 'command' && args[0] === '-v' ? args[1] : arg
      return { output: target && simulatedCommands.includes(target as typeof simulatedCommands[number]) ? `/usr/bin/${target}` : '' }
    }
    case 'cd': {
      const target = normalizePath(state.cwd, arg?.replace(/^~/, home) ?? home)
      if (!state.directories.includes(target)) return { output: `bash: cd: ${arg}: No such file or directory` }
      state.cwd = target
      return { output: '' }
    }
    case 'ls': {
      const target = normalizePath(state.cwd, arg ?? '.')
      if (state.files[target] !== undefined) return { output: target.split('/').at(-1) ?? target }
      if (!state.directories.includes(target)) return { output: `ls: cannot access '${arg}': No such file or directory` }
      const items = children(state, target)
      if (args.some((value) => value.includes('l'))) return { output: items.map((item) => `${state.directories.includes(normalizePath(target, item)) ? 'drwxr-xr-x' : '-rw-r--r--'} 1 ${profile.username} ${profile.username} 4096 Jul 31 08:00 ${item}`).join('\n') || 'total 0' }
      return { output: items.join('  ') }
    }
    case 'cat': {
      if (!arg) return { output: '' }
      const target = normalizePath(state.cwd, arg)
      return { output: state.files[target] ?? `cat: ${arg}: No such file or directory` }
    }
    case 'mkdir': {
      const targetArg = args.filter((value) => !value.startsWith('-')).at(-1)
      if (!targetArg) return { output: 'mkdir: missing operand' }
      const target = normalizePath(state.cwd, targetArg)
      if (!state.directories.includes(target)) state.directories.push(target)
      return { output: '' }
    }
    case 'touch': {
      if (!arg) return { output: 'touch: missing file operand' }
      state.files[normalizePath(state.cwd, arg)] ??= ''
      return { output: '' }
    }
    case 'rm': {
      if (!arg) return { output: 'rm: missing operand' }
      const target = normalizePath(state.cwd, arg)
      if (state.files[target] === undefined) return { output: `rm: cannot remove '${arg}': No such file or directory` }
      delete state.files[target]
      return { output: '' }
    }
    case 'cp':
    case 'mv': {
      const operands = args.filter((value) => !value.startsWith('-'))
      if (operands.length < 2) return { output: `${name}: missing destination file operand` }
      const source = normalizePath(state.cwd, operands[0])
      const target = normalizePath(state.cwd, operands[1])
      if (state.files[source] === undefined) return { output: `${name}: cannot stat '${operands[0]}': No such file or directory` }
      state.files[target] = state.files[source]
      if (name === 'mv') delete state.files[source]
      return { output: '' }
    }
    case 'echo': return { output: args.join(' ').replace(/^['"]|['"]$/g, '').replace('$HOME', home).replace('$USER', profile.username) }
    case 'printf': return { output: args.join(' ').replace(/^['"]|['"]$/g, '').replaceAll('\\n', '\n') }
    case 'grep': {
      const operands = args.filter((value) => !value.startsWith('-'))
      if (operands.length < 2) return { output: 'grep: missing search pattern or file' }
      const content = state.files[normalizePath(state.cwd, operands[1])]
      if (content === undefined) return { output: `grep: ${operands[1]}: No such file or directory` }
      return { output: content.split('\n').filter((line) => line.includes(operands[0])).join('\n') }
    }
    case 'head':
    case 'tail': {
      const targetArg = args.filter((value) => !value.startsWith('-') && !/^\d+$/.test(value)).at(-1)
      if (!targetArg) return { output: '' }
      const lines = (state.files[normalizePath(state.cwd, targetArg)] ?? '').trimEnd().split('\n')
      const amount = Number(args[args.indexOf('-n') + 1]) || 10
      return { output: (name === 'head' ? lines.slice(0, amount) : lines.slice(-amount)).join('\n') }
    }
    case 'wc': {
      const targetArg = args.filter((value) => !value.startsWith('-')).at(-1)
      if (!targetArg) return { output: '0' }
      const content = state.files[normalizePath(state.cwd, targetArg)]
      if (content === undefined) return { output: `wc: ${targetArg}: No such file or directory` }
      const lines = content ? content.split('\n').filter((line, index, all) => line || index < all.length - 1).length : 0
      return { output: args.includes('-l') ? `${lines} ${targetArg}` : `${lines} ${content.split(/\s+/).filter(Boolean).length} ${content.length} ${targetArg}` }
    }
    case 'df': return { output: 'Filesystem      Size  Used Avail Use% Mounted on\n/dev/vda2       832M  286M  504M  37% /\n/dev/vda1        64M   12M   52M  19% /boot' }
    case 'lsblk': return { output: `NAME   MAJ:MIN RM  SIZE RO TYPE MOUNTPOINTS\nvda    254:0    0    ${profile.diskSizeMiB}M  0 disk\n├─vda1 254:1    0     64M  0 part /boot\n├─vda2 254:2    0    ${profile.rootSizeMiB}M  0 part /\n└─vda3 254:3    0    ${profile.swapSizeMiB}M  0 part [SWAP]` }
    case 'blkid': return { output: '/dev/vda1: UUID="A12B-34CD" TYPE="vfat" PARTLABEL="EFI System"\n/dev/vda2: UUID="70d5b42f-94e2-4f52-a0e4-a787139e58f1" TYPE="ext4"\n/dev/vda3: UUID="f6169132-bd11-458b-842a-e001efab1597" TYPE="swap"' }
    case 'free': return { output: '               total        used        free      shared  buff/cache   available\nMem:           512Mi       118Mi       247Mi       4.0Mi       147Mi       365Mi\nSwap:          128Mi          0B       128Mi' }
    case 'ip': return { output: args.includes('route') ? `default via ${net.gateway} dev enp0s3 proto dhcp\n10.0.2.0/24 dev enp0s3 proto kernel scope link src ${net.address.split('/')[0]}` : `1: lo: <LOOPBACK,UP,LOWER_UP> mtu 65536\n    inet 127.0.0.1/8 scope host lo\n2: enp0s3: <BROADCAST,MULTICAST,UP,LOWER_UP> mtu 1500\n    inet ${net.address} brd 10.0.2.255 scope global enp0s3` }
    case 'ping': return { output: `PING ${arg ?? 'localhost'} (${arg ?? '127.0.0.1'}) 56(84) bytes of data.\n64 bytes from ${arg ?? '127.0.0.1'}: icmp_seq=1 ttl=64 time=0.081 ms\n\n--- ${arg ?? 'localhost'} ping statistics ---\n1 packets transmitted, 1 received, 0% packet loss` }
    case 'ss': return { output: 'Netid State  Recv-Q Send-Q Local Address:Port Peer Address:Port Process\ntcp   LISTEN 0      128        0.0.0.0:22        0.0.0.0:*' }
    case 'ps': return { output: `    PID TTY          TIME CMD\n   1042 pts/0    00:00:00 bash\n   1118 pts/0    00:00:00 ps` }
    case 'top': return { output: 'top - 08:26:14 up 17 min, 1 user, load average: 0.03, 0.05, 0.01\nTasks:  42 total,   1 running,  41 sleeping\n%Cpu(s):  1.0 us,  0.6 sy, 98.4 id\nMiB Mem :  512.0 total, 247.0 free, 118.0 used, 147.0 buff/cache' }
    case 'apt': return { output: args[0] === 'update' ? `${profile.distribution === 'ubuntu' ? 'Hit:1 http://archive.ubuntu.com/ubuntu noble InRelease' : 'Hit:1 http://deb.debian.org/debian bookworm InRelease'}\nReading package lists... Done\nBuilding dependency tree... Done\nAll packages are up to date.\n[教学模拟：没有访问网络或修改软件包]` : `apt ${profile.distribution === 'ubuntu' ? '2.7.14 (amd64)' : '2.6.1 (i386)'}\n用法：apt [options] command` }
    case 'dpkg': return { output: 'Desired=Unknown/Install/Remove/Purge/Hold\n||/ Name           Version       Architecture Description\nii  bash           5.2.15-2      i386         GNU Bourne Again SHell\nii  coreutils      9.1-1         i386         GNU core utilities' }
    case 'systemctl': {
      const unit = args.at(-1) ?? 'systemd'
      return { output: `● ${unit} - ${unit === 'ssh' ? 'OpenBSD Secure Shell server' : unit}\n     Loaded: loaded (/lib/systemd/system/${unit}.service; enabled)\n     Active: active (running) since Thu 2026-07-31 08:00:02 CST; 26min ago\n[教学模拟状态]` }
    }
    case 'journalctl': return { output: state.files['/var/log/syslog'].trim() + '\n-- No entries -- [教学模拟日志]' }
    case 'dmesg': return { output: '[    0.000000] Linux version 6.1.0-32-686-pae\n[    0.421337] virtio_blk virtio0: [vda] virtual disk\n[    1.882104] systemd[1]: Detected virtualization browser-simulator.\n[教学模拟启动日志]' }
    case 'file': return { output: `${arg ?? ''}: ${arg?.endsWith('.sh') ? 'POSIX shell script, ASCII text executable' : 'ASCII text'}` }
    case 'stat': return { output: `  File: ${arg ?? '.'}\n  Size: 4096       Blocks: 8          IO Block: 4096\nAccess: (0755/drwxr-xr-x)  Uid: (1000/${profile.username}) Gid: (1000/${profile.username})` }
    case 'sudo': return executeSimulatedCommand(args.join(' '), state, profile)
    case 'man': return { output: `${(arg ?? 'linux').toUpperCase()}(1)  Linux User Commands\n\nNAME\n    ${arg ?? 'linux'} - 教学环境中的命令参考\n\n提示：前往网站“命令库”查看完整中文语法、示例和风险说明。` }
    case 'chmod':
    case 'chown':
    case 'mount':
    case 'kill': return { output: '[教学模拟：命令语法有效，已在当前模拟会话中记录操作]' }
    case 'shutdown': return { output: '[教学模拟：不会关闭你的电脑或浏览器]' }
    default: return { output: `bash: ${name}: command not found` }
  }
}

export function completeInput(input: string, state: SimulatorState) {
  const before = input.slice(0, input.lastIndexOf(' ') + 1)
  const token = input.slice(before.length)
  if (before) {
    const slash = token.lastIndexOf('/')
    const typedDirectory = slash >= 0 ? token.slice(0, slash + 1) : ''
    const partial = slash >= 0 ? token.slice(slash + 1) : token
    const directory = normalizePath(state.cwd, typedDirectory || '.')
    const candidates = children(state, directory).filter((item) => item.startsWith(partial))
    if (candidates.length === 1) {
      const target = normalizePath(directory, candidates[0])
      const suffix = state.directories.includes(target) ? '/' : ''
      return { value: before + typedDirectory + candidates[0] + suffix, listing: '' }
    }
    return { value: input, listing: candidates.join('  ') }
  }
  const candidates = simulatedCommands.filter((item) => item.startsWith(token))
  if (candidates.length === 1) return { value: candidates[0], listing: '' }
  return { value: input, listing: candidates.join('  ') }
}

export function distributionLabel(distribution: LinuxDistribution) {
  if (distribution === 'debian') return 'Debian 12 Bookworm'
  if (distribution === 'ubuntu') return 'Ubuntu 24.04 LTS'
  return 'Buildroot Core'
}
