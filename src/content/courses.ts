export type LessonLevel = '入门' | '基础' | '进阶';

export type LessonMode =
  | 'guided-learning'
  | 'terminal-practice'
  | 'embedded-extension';

export type CourseLabStep = {
  id: string;
  title: string;
  instruction: string;
  commands: readonly string[];
  expectedObservation: string;
  safetyNote: string | null;
};

export type CourseLesson = {
  id: string;
  title: string;
  summary: string;
  level: LessonLevel;
  durationMinutes: number;
  mode: LessonMode;
  objectives: readonly string[];
  concepts: readonly string[];
  commands: readonly string[];
  labSteps: readonly CourseLabStep[];
  hardwareLimitations: readonly string[];
};

export const courseLessons = [
  {
    id: 'linux-overview',
    title: 'Linux 是什么，企业为什么使用它',
    summary: '先建立全局认识：Linux 内核、GNU/用户空间、发行版以及服务器、云平台和嵌入式设备之间是什么关系。',
    level: '入门', durationMinutes: 25, mode: 'guided-learning',
    objectives: ['说清 Linux 内核与 Linux 发行版的区别。', '了解 Linux 在服务器、云、容器、网络设备与嵌入式产品中的角色。', '理解开源许可证、社区生态和商业支持各自解决什么问题。'],
    concepts: ['Linux 严格来说是内核；日常所说的 Linux 系统还包含 Shell、工具链、库、服务与软件包。', '企业选择 Linux，通常看重可自动化、可裁剪、生态成熟、长期支持和可观察性。', '服务器发行版强调稳定与生命周期；嵌入式系统更强调体积、启动速度、硬件适配和可维护升级。'],
    commands: ['uname', 'cat', 'uptime'],
    labSteps: [
      { id: 'map-stack', title: '认识系统组成', instruction: '阅读概念卡片，按“硬件—内核—系统工具—应用”顺序理解 Linux 软件栈。', commands: [], expectedObservation: '应用通过系统调用使用内核能力，Shell 只是操作系统的一种入口。', safetyNote: null },
      { id: 'inspect-system', title: '查看当前练习环境', instruction: '启动终端后读取内核、架构和发行版标识。', commands: ['uname -a', 'cat /etc/os-release'], expectedObservation: '输出由浏览器内运行的 Linux 返回；它用于练习命令，不代表你的电脑或目标开发板。', safetyNote: null },
      { id: 'enterprise-map', title: '建立企业应用地图', instruction: '把服务器、容器、CI/CD、边缘网关和嵌入式设备分别对应到你熟悉的业务场景。', commands: ['uptime'], expectedObservation: '同一个 Linux 基础能力会以不同发行版和交付方式进入不同业务场景。', safetyNote: null },
    ],
    hardwareLimitations: ['本课侧重概念；浏览器练习环境不是生产服务器或真实开发板。'],
  },
  {
    id: 'distributions',
    title: '发行版地图：Ubuntu、Debian 与嵌入式方案',
    summary: '理解发行版不是“不同的 Linux 命令”，而是围绕内核组织的软件仓库、安装器、默认配置、发布节奏和支持策略。',
    level: '入门', durationMinutes: 30, mode: 'guided-learning',
    objectives: ['区分 Debian、Ubuntu、RHEL 系、Alpine、Buildroot 和 Yocto 的定位。', '根据生命周期、架构、软件仓库和团队能力选择方案。', '知道开发环境与最终嵌入式 rootfs 可以使用不同方案。'],
    concepts: ['Debian 重视稳定与多架构；Ubuntu 在其基础上提供固定发布节奏和商业生态。', 'Buildroot 与 Yocto 更像生成嵌入式系统的构建体系，不等同于通用桌面发行版。', '企业选型要记录版本生命周期、安全更新、芯片 BSP、包格式、许可证和回滚策略。'],
    commands: ['cat', 'uname', 'dpkg', 'apt'],
    labSteps: [
      { id: 'identify-release', title: '识别发行版', instruction: '读取标准发行版信息文件和内核架构。', commands: ['cat /etc/os-release', 'uname -m'], expectedObservation: '不同环境的 ID、VERSION_ID 和架构可能不同，脚本不应只依赖欢迎语。', safetyNote: null },
      { id: 'compare-families', title: '比较发行版家族', instruction: '对比 Debian/Ubuntu 的 deb+apt、RHEL 系的 rpm+dnf，以及 Alpine 的 apk。', commands: ['command -v apt || true', 'command -v apk || true'], expectedObservation: '某个包管理器不存在是正常的发行版差异，不代表 Linux 损坏。', safetyNote: null },
      { id: 'choose-target', title: '完成选型清单', instruction: '为“云服务器”和“ARM 网关”分别记录架构、支持周期、更新方式和镜像体积要求。', commands: [], expectedObservation: '选型从约束出发，而不是只按熟悉程度或界面选择。', safetyNote: null },
    ],
    hardwareLimitations: ['当前可运行环境是轻量 Buildroot；Debian 12 i386 镜像接入中，现代 Ubuntu 需要后续 64 位虚拟化路线。'],
  },
  {
    id: 'installation-planning',
    title: '安装规划：启动、分区、文件系统与网络',
    summary: '在安装页面完成一套可解释的方案，理解固件、引导器、内核、根文件系统、Swap、DHCP 和静态地址的作用。',
    level: '入门', durationMinutes: 40, mode: 'guided-learning',
    objectives: ['描述从上电到用户空间启动的主要阶段。', '理解磁盘、分区、文件系统与挂载点的区别。', '为 DHCP 或静态网络填写完整参数并识别风险。'],
    concepts: ['磁盘是设备，分区是范围，文件系统组织数据，挂载点把它接入目录树。', 'UEFI/BIOS、引导器、内核和 init 系统依次承担不同职责。', '静态网络至少需要地址与前缀、网关、DNS；地址冲突会导致间歇性故障。'],
    commands: ['lsblk', 'blkid', 'df', 'mount', 'ip'],
    labSteps: [
      { id: 'open-installer', title: '建立安装方案', instruction: '打开“安装系统”，选择发行版并查看镜像状态、目标磁盘和保留空间。', commands: [], expectedObservation: '网页只操作浏览器虚拟磁盘，不会扫描或改写电脑真实磁盘。', safetyNote: null },
      { id: 'plan-storage', title: '规划存储', instruction: '比较引导、根分区、数据分区和 Swap 的用途，再核对容量总和。', commands: ['df -h', 'mount'], expectedObservation: '运行环境中的挂载结果和安装规划是两类信息；规划不会伪装成已经写盘。', safetyNote: '真实设备分区前必须确认设备名并备份数据。' },
      { id: 'plan-network', title: '配置网络', instruction: '先选 DHCP；再练习填写一个不提交的静态地址方案，确保地址、前缀、网关和 DNS 完整。', commands: ['ip address show', 'ip route show'], expectedObservation: 'DHCP 自动协商参数；静态方案依赖所在网络，示例值不能直接照搬到生产环境。', safetyNote: null },
    ],
    hardwareLimitations: ['安装页面是教学流程；只有标记为“可启动”的镜像才会真正进入 Linux。'],
  },
  {
    id: 'shell-foundations',
    title: 'Shell、路径、帮助与 Tab 补全',
    summary: '从提示符、参数、路径和退出码开始，掌握不会迷路的命令行基本功。',
    level: '入门', durationMinutes: 45, mode: 'terminal-practice',
    objectives: ['读懂命令、选项、参数和提示符。', '使用绝对与相对路径移动并通过 Tab 补全。', '通过 --help、命令库和退出码自行排查问题。'],
    concepts: ['Shell 负责解析命令行并启动程序；终端负责输入输出显示。', '以 / 开头的是绝对路径，. 与 .. 分别表示当前目录和上级目录。', 'Tab 补全由 Shell 根据当前环境生成；命令成功通常返回 0，失败返回非 0。'],
    commands: ['pwd', 'ls', 'cd', 'echo', 'which', 'history'],
    labSteps: [
      { id: 'navigate', title: '定位与移动', instruction: '每次移动前后都用 pwd 核对位置，并输入 /e 后按 Tab 尝试补全。', commands: ['pwd', 'ls /', 'cd /tmp', 'pwd'], expectedObservation: 'cd 改变 Shell 工作目录，pwd 显示新位置；Tab 补全来自实际文件系统。', safetyNote: null },
      { id: 'arguments-help', title: '理解参数与帮助', instruction: '比较不带参数和带参数的输出，并打开内置帮助。', commands: ['uname', 'uname -a', 'ls --help'], expectedObservation: '选项会改变程序行为；不同实现的帮助文本可能不同。', safetyNote: null },
      { id: 'exit-status', title: '观察退出状态', instruction: '执行成功和失败的路径查询，并立即读取 $?。', commands: ['ls /tmp; echo $?', 'ls /definitely-missing; echo $?'], expectedObservation: '成功通常为 0，不存在的路径会输出真实错误并返回非 0。', safetyNote: null },
    ], hardwareLimitations: ['练习环境提供真实 Shell 行为，但可用命令取决于所选发行版。'],
  },
  {
    id: 'files-permissions',
    title: '文件、目录、链接与权限',
    summary: '在 /tmp 安全目录中练习创建、复制、移动、链接和权限判断。',
    level: '基础', durationMinutes: 50, mode: 'terminal-practice',
    objectives: ['区分普通文件、目录、硬链接和符号链接。', '读懂 rwx 权限和用户/组身份。', '安全使用复制、移动和删除命令。'],
    concepts: ['目录保存名字到 inode 的映射；符号链接保存目标路径。', '权限分为所有者、所属组和其他用户三组。', 'rm 通常没有回收站，递归和通配符会放大风险。'],
    commands: ['mkdir', 'touch', 'cp', 'mv', 'ln', 'ls', 'chmod', 'id', 'rm'],
    labSteps: [
      { id: 'sandbox', title: '创建安全沙箱', instruction: '全部写操作限制在 /tmp/linux-learning。', commands: ['mkdir -p /tmp/linux-learning', 'cd /tmp/linux-learning', 'touch original.txt', 'ls -la'], expectedObservation: '目录与空文件被真实创建，刷新虚拟机前可继续使用。', safetyNote: '不要把练习路径替换为 / 或 /etc。' },
      { id: 'links', title: '比较复制与链接', instruction: '创建副本和符号链接并查看详细信息。', commands: ['cp original.txt copy.txt', 'ln -s original.txt link.txt', 'ls -li'], expectedObservation: '副本是独立文件；符号链接显示目标路径。', safetyNote: null },
      { id: 'permissions', title: '读取和修改权限', instruction: '查看身份，把文件设为仅所有者可读写，再验证列表。', commands: ['id', 'chmod 600 original.txt', 'ls -l original.txt'], expectedObservation: '权限位应显示为 -rw-------；身份决定内核如何进行访问检查。', safetyNote: null },
    ], hardwareLimitations: ['虚拟磁盘体现 Linux 文件语义，但不模拟 NAND 坏块、UBI 或掉电一致性。'],
  },
  {
    id: 'text-pipelines',
    title: '标准流、重定向、管道与文本处理',
    summary: '把小工具组合成可重复的数据处理流程，这是 Linux 运维与嵌入式诊断的核心能力。',
    level: '基础', durationMinutes: 50, mode: 'terminal-practice',
    objectives: ['理解标准输入、输出和错误。', '组合 grep、cut、sort、uniq、wc。', '识别覆盖重定向的风险。'],
    concepts: ['管道连接两个进程的数据流，不是简单的字符串替换。', '> 覆盖文件，>> 追加；2> 处理标准错误。', '脚本应检查退出码并保留失败信息。'],
    commands: ['printf', 'cat', 'grep', 'cut', 'sort', 'uniq', 'wc', 'sed', 'awk', 'tee'],
    labSteps: [
      { id: 'dataset', title: '生成样例数据', instruction: '创建一份确定的日志样例。', commands: ["printf '%s\\n' 'INFO boot' 'WARN network' 'INFO ready' > /tmp/linux-learning.log", 'cat /tmp/linux-learning.log'], expectedObservation: '文件包含三行，输出来自实际文件内容。', safetyNote: null },
      { id: 'filter', title: '筛选与计数', instruction: '只保留 INFO 行并统计数量。', commands: ['grep INFO /tmp/linux-learning.log', 'grep INFO /tmp/linux-learning.log | wc -l'], expectedObservation: '筛选得到两行，计数结果为 2。', safetyNote: null },
      { id: 'redirect', title: '安全保存结果', instruction: '用 tee 同时查看并保存筛选结果。', commands: ['grep WARN /tmp/linux-learning.log | tee /tmp/warnings.log', 'wc -l /tmp/warnings.log'], expectedObservation: '屏幕与文件获得同一行数据。', safetyNote: '> 会覆盖同名文件，生产操作前先确认路径。' },
    ], hardwareLimitations: ['不同 BusyBox/GNU 工具的选项可能不同，命令库会标注通用语法。'],
  },
  {
    id: 'process-services',
    title: '进程、资源、服务与日志',
    summary: '从 PID、信号和资源观察进入 systemd 服务与日志，建立企业故障排查顺序。',
    level: '基础', durationMinutes: 55, mode: 'terminal-practice',
    objectives: ['查看进程与资源状态。', '理解 TERM 与 KILL 的差别。', '掌握服务状态—日志—配置—依赖的排查链。'],
    concepts: ['进程是正在运行的程序实例，PID 是当前启动周期内的标识。', 'SIGTERM 请求程序清理退出，SIGKILL 由内核强制结束且无法捕获。', 'systemd 发行版通常用 systemctl 管理服务、journalctl 查询日志。'],
    commands: ['ps', 'top', 'free', 'uptime', 'kill', 'systemctl', 'journalctl', 'dmesg'],
    labSteps: [
      { id: 'observe', title: '观察系统状态', instruction: '按负载、内存、进程三个层次采集证据。', commands: ['uptime', 'free -h', 'ps'], expectedObservation: '不同镜像工具格式可能不同，但数据都来自当前 Linux。', safetyNote: null },
      { id: 'signal', title: '安全练习信号', instruction: '只结束自己创建的 sleep 进程。', commands: ['sleep 300 &', 'jobs', 'kill %1'], expectedObservation: '后台作业被 SIGTERM 结束，Shell 会报告状态。', safetyNote: '不要对不认识的系统 PID 使用 kill -9。' },
      { id: 'service-chain', title: '学习服务排查链', instruction: '在支持 systemd 的 Debian/Ubuntu 中依次查看状态和日志；轻量环境可能明确提示命令不存在。', commands: ['command -v systemctl || true', 'dmesg | tail'], expectedObservation: '工具缺失体现发行版差异；不能把 systemd 命令硬套到所有嵌入式系统。', safetyNote: null },
    ], hardwareLimitations: ['Buildroot 练习环境未必使用 systemd；相关内容会在 Debian 环境中完整练习。'],
  },
  {
    id: 'network-ssh',
    title: '网络、DNS、端口、HTTP 与 SSH',
    summary: '按“接口—地址—路由—DNS—端口—应用协议”逐层定位问题。',
    level: '基础', durationMinutes: 55, mode: 'terminal-practice',
    objectives: ['读懂 IP 地址和默认路由。', '区分 DNS、ICMP、TCP 端口与 HTTP。', '理解 SSH 密钥和最小暴露原则。'],
    concepts: ['能 ping IP 不代表 DNS 或 HTTP 正常；每一层都需要独立证据。', '监听地址 127.0.0.1 与 0.0.0.0 的暴露范围不同。', 'SSH 私钥必须保密，服务端保存公钥；生产环境应限制口令登录。'],
    commands: ['ip', 'ping', 'ss', 'nslookup', 'curl', 'wget', 'ssh', 'scp'],
    labSteps: [
      { id: 'layers', title: '检查接口与路由', instruction: '先确认接口状态、地址和默认路由。', commands: ['ip address show', 'ip route show'], expectedObservation: '若当前练习镜像未开放网络，会如实显示有限接口或缺失命令。', safetyNote: null },
      { id: 'ports', title: '检查监听端口', instruction: '查看 TCP/UDP 监听状态并关注绑定地址。', commands: ['ss -lntup'], expectedObservation: '列表为空也有意义，说明当前没有相应监听服务。', safetyNote: null },
      { id: 'diagnostic-order', title: '形成排查顺序', instruction: '记录从本机配置、网关、DNS 到应用请求的逐层检查清单。', commands: ['ping -c 1 127.0.0.1'], expectedObservation: '排查应从近到远，每一步都基于上一层已成立。', safetyNote: '不要对未授权目标进行扫描或压力测试。' },
    ], hardwareLimitations: ['浏览器网络需要安全代理；当前镜像不承诺公网或局域网访问。'],
  },
  {
    id: 'packages-automation',
    title: '软件包、服务部署与 Shell 自动化',
    summary: '理解 Debian/Ubuntu 软件包管理，并把重复操作写成可检查、可失败、可复现的脚本。',
    level: '进阶', durationMinutes: 60, mode: 'terminal-practice',
    objectives: ['理解仓库索引、软件包、依赖与签名。', '区分安装软件与启动服务。', '编写包含变量、条件和退出码的基础脚本。'],
    concepts: ['apt 负责解析仓库和依赖，dpkg 负责底层 deb 包操作。', '安装完成不等于服务已启动，更不等于网络可访问。', '可靠脚本应固定输入、检查失败、避免交互并输出必要日志。'],
    commands: ['apt', 'dpkg', 'systemctl', 'journalctl', 'export', 'test', 'printf'],
    labSteps: [
      { id: 'detect-manager', title: '识别包管理器', instruction: '先检测工具，不直接修改系统。', commands: ['command -v apt || command -v apk || true'], expectedObservation: '结果取决于发行版；Buildroot 通常不提供通用在线包管理器。', safetyNote: null },
      { id: 'query-packages', title: '只读查询', instruction: '在 Debian/Ubuntu 中查询已安装包；当前环境缺失时保留真实失败。', commands: ['command -v dpkg && dpkg -l | head'], expectedObservation: '查询不会安装软件，输出反映当前镜像实际状态。', safetyNote: null },
      { id: 'write-script', title: '编写可检查脚本', instruction: '创建一个检查发行版信息的短脚本并执行。', commands: ["printf '%s\\n' '#!/bin/sh' 'test -r /etc/os-release || exit 1' 'grep PRETTY_NAME /etc/os-release' > /tmp/check-os.sh", 'chmod +x /tmp/check-os.sh', '/tmp/check-os.sh'], expectedObservation: '文件存在时输出发行版名称；缺失时通过非零退出码失败。', safetyNote: '不要直接执行来源不明的下载脚本。' },
    ], hardwareLimitations: ['在线安装依赖联网与可信仓库；当前练习环境主要支持只读理解和脚本基础。'],
  },
  {
    id: 'embedded-enterprise',
    title: '企业 Linux 与嵌入式交付全流程',
    summary: '把开发机、交叉编译、Bootloader、内核、设备树、rootfs、OTA、监控和供应链安全串成一条工程链。',
    level: '进阶', durationMinutes: 65, mode: 'embedded-extension',
    objectives: ['描述嵌入式 Linux 从源码到设备启动的产物链。', '理解交叉编译与目标架构。', '建立可回滚升级、日志、看门狗和 SBOM 的生产意识。'],
    concepts: ['主机工具链生成目标架构程序，能编译不代表能在主机直接运行。', '设备树描述不可自动枚举的硬件，驱动把设备能力接入内核子系统。', '企业交付需要可重现构建、签名验证、A/B 更新、回滚、漏洞管理和远程可观察性。'],
    commands: ['uname', 'file', 'ldd', 'dmesg', 'mount', 'sync', 'reboot'],
    labSteps: [
      { id: 'architecture', title: '核对目标架构', instruction: '比较运行架构与 ELF 文件类型，理解为什么程序会出现 Exec format error。', commands: ['uname -m', 'file /bin/sh'], expectedObservation: '内核架构与可执行文件架构必须兼容；浏览器当前是 i686 练习环境。', safetyNote: null },
      { id: 'boot-chain', title: '绘制启动链', instruction: '按 Boot ROM—Bootloader—内核/设备树—init—应用记录每阶段输入、输出和日志位置。', commands: ['dmesg | head'], expectedObservation: '内核日志只覆盖启动链的一部分，早期引导日志通常来自串口或 Bootloader。', safetyNote: null },
      { id: 'release-checklist', title: '建立发布清单', instruction: '为一个网关产品列出镜像版本、签名、分区槽、回滚条件、健康检查、日志和许可证清单。', commands: ['sync'], expectedObservation: '可升级、可回滚、可诊断与可审计是生产嵌入式 Linux 的组成部分。', safetyNote: '真实设备升级前必须验证供电、镜像签名和回滚路径。' },
    ], hardwareLimitations: ['GPIO、I²C、SPI、设备树加载、驱动和 OTA 掉电测试必须在专用模拟器或真实硬件完成。'],
  },
] as const satisfies readonly CourseLesson[];
