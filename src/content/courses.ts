export type LessonLevel = '入门' | '基础' | '进阶';

export type LessonMode =
  | 'real-guest-lab'
  | 'concept-demonstration'
  | 'hardware-extension';

export type CourseLabStep = {
  id: string;
  title: string;
  instruction: string;
  commands: readonly string[];
  expectedObservation: string;
  safetyNote: string | null;
};

export type CourseLabSteps = readonly [
  CourseLabStep,
  CourseLabStep,
  CourseLabStep,
  CourseLabStep?,
  CourseLabStep?,
];

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
  labSteps: CourseLabSteps;
  expectedObservations: readonly string[];
  checkCommand: string;
  resetCommand: string;
  hardwareLimitations: readonly string[];
};

export const courseLessons = [
  {
    id: 'linux-basics-01',
    title: '认识来宾 Linux、Shell 与路径',
    summary:
      '从当前目录、文件系统入口和内核信息开始，建立“浏览器宿主—v86 虚拟机—Linux 来宾—Shell”四层认知。',
    level: '入门',
    durationMinutes: 30,
    mode: 'real-guest-lab',
    objectives: [
      '分清网站界面、终端模拟器、Bash 和 Linux 内核各自负责什么。',
      '使用绝对路径和相对路径在文件系统中定位。',
      '读取来宾内核、架构和发行版信息，并避免把它误认为宿主或目标板信息。',
      '识别 /bin/sh 是符号链接、脚本还是 ELF 可执行文件。',
    ],
    concepts: [
      '终端负责字符输入输出，Shell 解析命令，内核提供进程、文件和设备等系统能力。',
      '当前工作目录是相对路径的解析起点；以 / 开头的是绝对路径。',
      'uname 报告当前正在运行的来宾内核与机器架构，不报告浏览器所在电脑。',
      '符号链接保存目标路径；file -L 会跟随链接识别最终目标。',
    ],
    commands: ['pwd', 'ls', 'cd', 'uname', 'file'],
    labSteps: [
      {
        id: 'prepare-workspace',
        title: '进入课程目录',
        instruction:
          '创建本课独立目录并进入其中。之后始终先用 pwd 核对位置，避免在错误目录操作。',
        commands: [
          'mkdir -p /home/student/labs/linux-basics-01',
          'cd /home/student/labs/linux-basics-01',
          'pwd',
        ],
        expectedObservation:
          'pwd 应输出 /home/student/labs/linux-basics-01；这是来宾文件系统内的路径。',
        safetyNote: null,
      },
      {
        id: 'inspect-hierarchy',
        title: '观察文件系统层次',
        instruction:
          '分别查看根目录、学习用户主目录和实验目录自身的元数据，留意 d 开头的文件类型位。',
        commands: ['ls -ld / /home /home/student /home/student/labs', 'ls -la /'],
        expectedObservation:
          'ls -ld 不会展开目录内容；根目录下能看到 bin、etc、home、proc、tmp 等 Linux 常见入口，具体布局以来宾镜像为准。',
        safetyNote: null,
      },
      {
        id: 'identify-guest',
        title: '确认内核与架构',
        instruction:
          '读取完整内核信息，再只读取机器架构。记录结果中的 x86 标识，并思考它与 ARM 目标板的区别。',
        commands: ['uname -a', 'uname -m', 'cat /etc/os-release'],
        expectedObservation:
          '输出应来自 v86 来宾，通常显示 32 位 x86 架构；发行版信息来自 /etc/os-release。最终值必须以来宾真实输出为准。',
        safetyNote: null,
      },
      {
        id: 'inspect-shell',
        title: '识别 Shell 文件',
        instruction:
          '先查看 /bin/sh 目录项，再分别识别链接自身与链接目标的文件类型。',
        commands: ['ls -l /bin/sh', 'file /bin/sh', 'file -L /bin/sh'],
        expectedObservation:
          '/bin/sh 可能是符号链接；file -L 应继续检查它最终指向的脚本或 ELF 程序。具体目标由镜像决定。',
        safetyNote: null,
      },
    ],
    expectedObservations: [
      '所有命令都在来宾 Linux 内执行，路径和内核信息不是 JavaScript 预置文本。',
      '相对路径随 cd 改变，绝对路径始终从 / 开始解析。',
      'uname -m 显示的是 v86 来宾架构，而不是未来要部署程序的 ARM 架构。',
    ],
    checkCommand: 'lab-check linux-basics-01',
    resetCommand: 'lab-reset linux-basics-01',
    hardwareLimitations: [
      '本课不需要外部硬件，可在浏览器内真实完成。',
      'v86 V1 是 32 位 x86 来宾；uname 的结果不能代表 ARM、RISC-V 或具体 SoC。',
    ],
  },
  {
    id: 'filesystem-01',
    title: '文件、目录与链接的真实行为',
    summary:
      '在隔离实验目录中创建、复制、重命名、链接和删除文件，观察 inode、符号链接与覆盖风险。',
    level: '入门',
    durationMinutes: 40,
    mode: 'real-guest-lab',
    objectives: [
      '安全地创建目录和空文件，并理解 -p 的作用。',
      '区分复制与移动，以及操作同名目标时的覆盖风险。',
      '通过 inode 号区分普通副本、硬链接和符号链接。',
      '使用交互确认删除实验文件，理解 Linux 通常没有命令行回收站。',
    ],
    concepts: [
      '目录保存“名字到 inode”的映射，文件名本身不是文件内容。',
      '硬链接共享同一 inode；符号链接是保存目标路径的独立文件。',
      'cp 产生独立副本，mv 在同一文件系统中通常只是改变目录项。',
      'rm 删除目录项；当最后一个硬链接被删除且文件未被进程打开时，空间才可回收。',
    ],
    commands: ['mkdir', 'touch', 'cp', 'mv', 'ln', 'ls', 'file', 'rm'],
    labSteps: [
      {
        id: 'create-layout',
        title: '创建安全沙箱',
        instruction:
          '所有写操作限定在本课目录。创建两级目录和一个空文件，然后查看详细列表。',
        commands: [
          'mkdir -p /home/student/labs/filesystem-01/demo/archive',
          'cd /home/student/labs/filesystem-01',
          'touch demo/original.txt',
          'ls -la demo',
        ],
        expectedObservation:
          'original.txt 的初始大小为 0；archive 是目录。再次执行 mkdir -p 不应因目录已存在而失败。',
        safetyNote: '不要把实验路径替换成 /、/etc 或其他系统目录。',
      },
      {
        id: 'copy-and-move',
        title: '比较复制与移动',
        instruction:
          '复制原文件，再把副本移动到 archive 中并改名；用 inode 号确认原文件与副本彼此独立。',
        commands: [
          'cp demo/original.txt demo/copy.txt',
          'mv demo/copy.txt demo/archive/moved.txt',
          'ls -li demo/original.txt demo/archive/moved.txt',
        ],
        expectedObservation:
          '两个普通文件应显示不同 inode；demo/copy.txt 已不存在，内容位于 archive/moved.txt。',
        safetyNote: '生产环境移动前应使用 mv -i 或先检查目标是否存在。',
      },
      {
        id: 'compare-links',
        title: '创建两类链接',
        instruction:
          '为 original.txt 分别创建硬链接和相对符号链接，再查看 inode 与文件类型。',
        commands: [
          'ln demo/original.txt demo/hard-link.txt',
          'ln -s original.txt demo/symbolic-link.txt',
          'ls -li demo/original.txt demo/hard-link.txt demo/symbolic-link.txt',
          'file demo/symbolic-link.txt',
        ],
        expectedObservation:
          '硬链接与原文件 inode 相同且链接计数增加；符号链接有自己的 inode，并显示目标路径 original.txt。',
        safetyNote: null,
      },
      {
        id: 'remove-copy',
        title: '受控删除',
        instruction:
          '只删除本课 archive 中的 moved.txt。rm -i 会显示确认提示，输入 y 后再检查目录。',
        commands: ['rm -i demo/archive/moved.txt', 'ls -la demo/archive'],
        expectedObservation:
          '确认后 moved.txt 从目录中消失；original.txt 以及它的两个链接不受影响。',
        safetyNote:
          'rm 通常无法撤销；不要使用 rm -rf，也不要离开 /home/student/labs/filesystem-01。',
      },
    ],
    expectedObservations: [
      '副本拥有不同 inode，硬链接共享 inode，符号链接保存目标路径。',
      '移动后旧路径消失，新路径出现；同文件系统移动通常不复制文件内容。',
      '删除副本不会删除原文件；删除某一个硬链接也不会立即删除其他名字所指向的数据。',
    ],
    checkCommand: 'lab-check filesystem-01',
    resetCommand: 'lab-reset filesystem-01',
    hardwareLimitations: [
      '本课使用来宾虚拟磁盘，文件系统语义是真实 Linux 行为。',
      '闪存擦写、UBI/UBIFS、掉电一致性和 NAND 坏块行为需要专用镜像或真实硬件，本课不模拟这些结果。',
    ],
  },
  {
    id: 'text-pipelines-01',
    title: '标准流、管道与文本处理',
    summary:
      '用一份可重复生成的传感器样例数据练习查看、筛选、分列、排序、聚合和参数传递。',
    level: '基础',
    durationMinutes: 50,
    mode: 'real-guest-lab',
    objectives: [
      '理解标准输入、标准输出、标准错误以及管道的数据流向。',
      '组合 grep、cut、sort、uniq 和 wc 得到可核验的结果。',
      '用 sed 做非破坏性变换，用 awk 做字段计算。',
      '用 NUL 分隔方式安全地把文件名交给 xargs。',
    ],
    concepts: [
      '管道把左侧进程的标准输出连接到右侧进程的标准输入，各程序仍是真实独立进程。',
      '> 会在命令执行前截断目标文件，>> 才是追加；错误流默认不会进入普通管道。',
      'grep 无匹配时返回 1，并不等同于程序故障；返回 2 才表示错误。',
      '文本排序受 locale 影响；需要可重复构建时常使用 LC_ALL=C。',
      'xargs 默认按空白拆分，任意文件名应采用 find -print0 与 xargs -0。',
    ],
    commands: [
      'cat',
      'head',
      'tail',
      'grep',
      'cut',
      'sort',
      'uniq',
      'wc',
      'sed',
      'awk',
      'find',
      'xargs',
    ],
    labSteps: [
      {
        id: 'create-dataset',
        title: '生成固定样例',
        instruction:
          '在本课目录生成五行 CSV 数据。printf 是 Bash 可用工具，这里的重定向会新建或覆盖 readings.csv。',
        commands: [
          'mkdir -p /home/student/labs/text-pipelines-01',
          'cd /home/student/labs/text-pipelines-01',
          "printf '%s\\n' 'sensor,temp,status' 'cpu,42,ok' 'wifi,55,warn' 'cpu,44,ok' 'display,39,ok' > readings.csv",
          'wc -l readings.csv',
        ],
        expectedObservation:
          'wc -l 应报告 5 行；第一行是表头，其余四行是样例记录。',
        safetyNote: '> 会覆盖同名文件，因此本步骤只在课程专属目录执行。',
      },
      {
        id: 'inspect-and-filter',
        title: '查看并筛选记录',
        instruction:
          '比较完整输出、头尾输出和正则筛选；记录 grep 输出前的行号。',
        commands: [
          'cat readings.csv',
          'head -n 2 readings.csv',
          'tail -n 2 readings.csv',
          "grep -n ',ok$' readings.csv",
        ],
        expectedObservation:
          'grep 应匹配第 2、4、5 行；warn 记录和表头不以 ,ok 结尾，因此不会出现。',
        safetyNote: null,
      },
      {
        id: 'aggregate-status',
        title: '组成统计管道',
        instruction:
          '抽取状态列、跳过表头、排序相同值、统计相邻重复行，再按数量倒序显示。',
        commands: [
          'cut -d, -f3 readings.csv | tail -n +2 | sort | uniq -c | sort -nr',
        ],
        expectedObservation:
          '结果应显示 ok 为 3 次、warn 为 1 次；每一级命令只完成一个明确转换。',
        safetyNote: null,
      },
      {
        id: 'transform-and-calculate',
        title: '变换并计算字段',
        instruction:
          '先用 sed 只打印数据行，再由 awk 对温度列求平均值；两条命令都不修改源文件。',
        commands: [
          "sed -n '2,5p' readings.csv",
          "awk -F, 'NR > 1 {sum += $2; count++} END {printf \"%.1f\\n\", sum / count}' readings.csv",
        ],
        expectedObservation:
          'sed 输出四条数据；awk 应输出平均温度 45.0。',
        safetyNote: '本课不使用 sed -i，避免直接修改唯一的数据副本。',
      },
      {
        id: 'safe-xargs',
        title: '安全传递文件名',
        instruction:
          '创建带空格的文件名，并使用 NUL 分隔查找结果，确保 xargs 不会错误拆词。',
        commands: [
          "touch 'board one.log' 'board two.log'",
          "find . -maxdepth 1 -type f -name 'board *.log' -print0 | sort -z | xargs -0 -n1 file",
        ],
        expectedObservation:
          'file 应收到两个完整路径；文件名中的空格不会导致额外参数。',
        safetyNote: '把 xargs 与 rm、chmod 等修改型命令组合前，应先替换成 printf 检查参数边界。',
      },
    ],
    expectedObservations: [
      '管道中的结果来自真实工具计算，而不是网站预置返回文本。',
      '样例数据的状态统计为 ok=3、warn=1，平均温度为 45.0。',
      'NUL 分隔能完整保留含空格的文件名。',
    ],
    checkCommand: 'lab-check text-pipelines-01',
    resetCommand: 'lab-reset text-pipelines-01',
    hardwareLimitations: [
      '本课不需要外部硬件，样例数据是明确标注的教学数据。',
      '样例不是从真实温度传感器采集；连接 I²C、SPI 或 ADC 设备需要支持对应控制器的开发板。',
    ],
  },
  {
    id: 'permissions-processes-01',
    title: '权限、进程、作业与信号',
    summary:
      '以普通学习用户创建脚本和后台任务，观察权限位、PID、作业号、真实信号与权限拒绝。',
    level: '基础',
    durationMinutes: 45,
    mode: 'real-guest-lab',
    objectives: [
      '读懂 rwx 权限位并用符号模式做最小权限变更。',
      '区分 Shell 作业号与内核 PID，使用 ps 查看进程快照。',
      '先用 SIGTERM 请求正常退出，并理解 SIGKILL 的代价。',
      '观察普通用户执行 chown 时的真实权限错误，不把失败伪装成成功。',
    ],
    concepts: [
      '权限分为属主、属组和其他用户三组；目录的执行位控制路径穿越。',
      '进程由内核用 PID 标识；jobs 只显示当前交互式 Shell 创建的作业。',
      '信号是异步通知机制；SIGTERM 可被处理，SIGKILL 不能被捕获或忽略。',
      '最小权限原则要求默认使用普通用户，只在理由明确时临时提升权限。',
    ],
    commands: ['touch', 'chmod', 'ls', 'ps', 'jobs', 'kill', 'chown'],
    labSteps: [
      {
        id: 'prepare-script',
        title: '创建并授权脚本',
        instruction:
          '创建一个简单脚本，先查看默认权限，再只为属主增加执行位。',
        commands: [
          'mkdir -p /home/student/labs/permissions-processes-01',
          'cd /home/student/labs/permissions-processes-01',
          "printf '#!/bin/sh\\nprintf \\\"worker ready\\\\n\\\"\\n' > worker.sh",
          'ls -l worker.sh',
          'chmod u+x worker.sh',
          'ls -l worker.sh',
        ],
        expectedObservation:
          '第二次 ls 应比第一次多出属主执行位 x，组和其他用户权限不应被无意扩大。',
        safetyNote: '不要用 chmod 777 代替理解具体权限需求。',
      },
      {
        id: 'start-background-job',
        title: '启动后台作业',
        instruction:
          '在当前 Shell 启动 sleep，把特殊参数 $! 保存的最近后台 PID 记录到变量，再比较 jobs 与 ps。',
        commands: [
          'sleep 120 & worker_pid=$!',
          'jobs -l',
          'ps -o pid,ppid,stat,comm -p "$worker_pid"',
        ],
        expectedObservation:
          'jobs 显示作业号和 PID；ps 中 PID 应与 worker_pid 相同，PPID 通常是当前 Shell。',
        safetyNote: null,
      },
      {
        id: 'send-term',
        title: '发送可处理的终止信号',
        instruction:
          '向刚才的后台进程发送 SIGTERM，等待 Shell 更新作业状态，再检查该 PID。',
        commands: [
          'kill -TERM "$worker_pid"',
          'wait "$worker_pid"; printf \'exit=%s\\n\' "$?"',
          'jobs -l',
          'ps -p "$worker_pid"',
        ],
        expectedObservation:
          'wait 应报告任务由信号结束的非零状态；jobs 不再列出运行中的任务，ps 通常找不到该 PID。',
        safetyNote: '只向本课创建并记录的 PID 发信号，不要猜测系统进程 PID。',
      },
      {
        id: 'observe-chown-denial',
        title: '观察权限拒绝',
        instruction:
          '普通用户尝试把自己的实验文件交给 root。此步骤预期失败，用退出码确认错误是真实发生的。',
        commands: [
          'touch owned.txt',
          'chown 0:0 owned.txt',
          "printf 'chown exit=%s\\n' \"$?\"",
          'ls -ln owned.txt',
        ],
        expectedObservation:
          'chown 应在标准错误输出 Operation not permitted 或等价信息并返回非零；文件属主仍是学习用户。',
        safetyNote:
          '不要用 sudo 绕过这一教学结果；对系统目录递归 chown 可能破坏整个虚拟系统。',
      },
    ],
    expectedObservations: [
      'chmod 可以精确改变某一组权限位，无需把文件设为 777。',
      '作业号属于当前 Shell，PID 属于内核进程，两者用途不同。',
      '普通用户 chown 失败是预期的真实安全边界，网站不会替换或隐藏错误输出。',
    ],
    checkCommand: 'lab-check permissions-processes-01',
    resetCommand: 'lab-reset permissions-processes-01',
    hardwareLimitations: [
      '进程、权限与信号实验在来宾内是真实 Linux 行为，不需要开发板。',
      'v86 的调度时序和性能不等同于实时嵌入式目标，不能据此评估实时延迟或优先级反转。',
    ],
  },
  {
    id: 'embedded-rootfs-01',
    title: '构造最小 rootfs 骨架',
    summary:
      '创建符合 Linux 常见层次的根文件系统骨架，加入 BusyBox、链接和配置文件，并检查元数据与归档内容。',
    level: '进阶',
    durationMinutes: 60,
    mode: 'real-guest-lab',
    objectives: [
      '解释嵌入式启动链中内核与 rootfs 的不同职责。',
      '创建 bin、etc、proc、sys、dev、tmp 等最小目录骨架。',
      '识别 BusyBox 可执行文件的真实架构，并用符号链接提供 applet 入口。',
      '以保留权限和链接的方式打包 rootfs，并在解包前检查归档清单。',
      '明确一个目录骨架距离可启动目标系统还缺少什么。',
    ],
    concepts: [
      '内核挂载根文件系统后启动 init；只有目录结构而没有有效 init 的 rootfs 不能完成用户空间启动。',
      'BusyBox 用一个二进制提供许多 applet，常通过符号链接或 busybox 命令分派。',
      '/proc 与 /sys 是运行时由内核提供的虚拟文件系统，不能靠预填普通文件替代。',
      '/dev 通常由 devtmpfs 或设备管理器填充；设备节点关联内核驱动，不是同名文本文件。',
      '归档中的权限、属主、链接和路径都属于 rootfs 接口的一部分。',
    ],
    commands: ['mkdir', 'cp', 'ln', 'chmod', 'find', 'file', 'ls', 'tar', 'uname'],
    labSteps: [
      {
        id: 'create-rootfs-layout',
        title: '创建目录骨架',
        instruction:
          '在课程目录创建 rootfs 的常见顶层目录；这里只创建挂载点，不伪造 proc、sys 或设备内容。',
        commands: [
          'mkdir -p /home/student/labs/embedded-rootfs-01/rootfs/{bin,etc,proc,sys,dev,tmp,var,usr/bin}',
          'cd /home/student/labs/embedded-rootfs-01',
          'chmod 1777 rootfs/tmp',
          'find rootfs -maxdepth 2 -type d -print | sort',
        ],
        expectedObservation:
          '能看到所有顶层目录；tmp 权限包含 sticky bit。proc、sys、dev 目前应是空挂载点。',
        safetyNote: '所有操作限定在课程目录；不要尝试修改来宾真实的 /dev、/proc 或 /sys。',
      },
      {
        id: 'install-busybox',
        title: '加入 BusyBox 与 Shell 入口',
        instruction:
          '从来宾 PATH 查找 BusyBox，复制到骨架并创建 /bin/sh 相对符号链接。若找不到 BusyBox，应保留真实失败并报告镜像缺包。',
        commands: [
          'busybox_path="$(command -v busybox)"',
          'test -n "$busybox_path"',
          'cp "$busybox_path" rootfs/bin/busybox',
          'ln -s busybox rootfs/bin/sh',
          'ls -l rootfs/bin',
        ],
        expectedObservation:
          'rootfs/bin/busybox 是独立文件，rootfs/bin/sh 是指向 busybox 的相对符号链接；缺少 BusyBox 时 test 或 cp 应真实失败。',
        safetyNote:
          '课程内容不应捕获错误后伪造成功；BusyBox 是否安装最终由来宾 command-manifest.json 验证。',
      },
      {
        id: 'inspect-architecture',
        title: '核对可执行文件架构',
        instruction:
          '识别复制后的 BusyBox，并把它的架构与当前来宾架构对照。',
        commands: ['file rootfs/bin/busybox', 'uname -m', 'file -L rootfs/bin/sh'],
        expectedObservation:
          'BusyBox 应被识别为当前来宾可执行的 ELF，通常是 32 位 x86；它不是 ARM 目标板二进制。',
        safetyNote: null,
      },
      {
        id: 'write-config',
        title: '写入最小配置样例',
        instruction:
          '创建 passwd 和 hostname 教学样例，然后检查普通文件、目录和符号链接的清单。',
        commands: [
          "printf '%s\\n' 'root:x:0:0:root:/root:/bin/sh' > rootfs/etc/passwd",
          "printf '%s\\n' 'linux-lab' > rootfs/etc/hostname",
          'find rootfs -maxdepth 3 -printf \'%y %m %p -> %l\\n\' | sort',
        ],
        expectedObservation:
          '清单用 d、f、l 区分目录、普通文件和链接，并显示 tmp 的 1777 权限以及 sh 的链接目标。',
        safetyNote:
          '这是教学配置，不包含密码策略、组文件、设备节点、init 脚本或生产安全加固。',
      },
      {
        id: 'archive-rootfs',
        title: '打包并审计内容',
        instruction:
          '从 rootfs 内部创建 gzip 压缩 tar 包，再只查看归档清单，不覆盖任何现有系统路径。',
        commands: [
          'tar -czf rootfs.tar.gz -C rootfs .',
          'file rootfs.tar.gz',
          'tar -tvf rootfs.tar.gz',
        ],
        expectedObservation:
          '归档成员以 ./ 开头，包含目录、配置文件、BusyBox 和 sh 符号链接；tar -tvf 不会解包。',
        safetyNote:
          '永远不要在 / 中直接解开来源不明的 rootfs；先检查绝对路径、.. 路径、属主和链接。',
      },
    ],
    expectedObservations: [
      '目录骨架与 tar 归档在来宾中真实创建，可由 find、file、ls 和 tar 交叉检查。',
      'BusyBox 的实际架构匹配 v86 来宾，而不代表 ARM 目标板。',
      'proc、sys 和 dev 只是空挂载点；rootfs 尚不能因为“看起来完整”就被宣称可启动。',
    ],
    checkCommand: 'lab-check embedded-rootfs-01',
    resetCommand: 'lab-reset embedded-rootfs-01',
    hardwareLimitations: [
      'V1 可真实教授目录布局、权限、BusyBox、ELF 识别和归档，但构建物是 32 位 x86 来宾版本。',
      'ARM/RISC-V 交叉编译、动态链接器和目标 ABI 需要匹配的工具链及 sysroot；未验证前不得宣称可用。',
      'GPIO、I²C、SPI、MTD/NAND、UBI、设备树与具体驱动的板级效果需要真实硬件或专用系统模拟器。',
      '本课不会伪造设备节点、内核挂载、init 启动或开发板启动成功。',
    ],
  },
] as const satisfies readonly CourseLesson[];
