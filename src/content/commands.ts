export type CommandDangerLevel = 'safe' | 'caution' | 'dangerous';

export type CommandCategory =
  | '系统信息'
  | '文件与目录'
  | '文本查看'
  | '文本处理'
  | '搜索与批处理'
  | '权限管理'
  | '进程与作业'
  | '归档与识别'
  | 'Shell 基础'
  | '用户与身份'
  | '磁盘与文件系统'
  | '网络诊断'
  | '软件与服务'
  | '开发与运维';

export type CommandExample = {
  command: string;
  description: string;
  destructive: boolean;
};

export type CommandDoc = {
  name: string;
  category: CommandCategory;
  summary: string;
  syntax: readonly string[];
  examples: readonly CommandExample[];
  dangerLevel: CommandDangerLevel;
  helpCommand: string;
  verified: false;
  verificationStatus: 'pending-guest-manifest';
  verificationNote: string;
};

const pendingVerification = {
  verified: false,
  verificationStatus: 'pending-guest-manifest',
  verificationNote:
    '当前 Linux 环境尚未提供命令清单；请先用 command -v 检查是否可用。',
} as const;

const coreCommandDocs = [
  {
    name: 'pwd',
    category: '系统信息',
    summary:
      '输出当前工作目录的绝对路径。脚本中确认执行位置时很有用，也能帮助理解相对路径从哪里开始解析。',
    syntax: ['pwd', 'pwd -P'],
    examples: [
      {
        command: 'pwd',
        description: '显示当前 Shell 所在目录。',
        destructive: false,
      },
      {
        command: 'pwd -P',
        description: '解析符号链接后显示物理路径。',
        destructive: false,
      },
    ],
    dangerLevel: 'safe',
    helpCommand: 'help pwd',
    ...pendingVerification,
  },
  {
    name: 'ls',
    category: '文件与目录',
    summary:
      '列出目录内容。常用选项可以显示隐藏项、权限、属主、大小和修改时间，是检查根文件系统布局的基础工具。',
    syntax: ['ls [OPTION]... [FILE]...', 'ls -lah [PATH]'],
    examples: [
      {
        command: 'ls -lah /home/student',
        description: '以易读格式列出目录中的全部项目，包括隐藏项。',
        destructive: false,
      },
      {
        command: 'ls -ld /tmp',
        description: '查看目录自身的权限，而不是展开目录内容。',
        destructive: false,
      },
    ],
    dangerLevel: 'safe',
    helpCommand: 'ls --help',
    ...pendingVerification,
  },
  {
    name: 'cd',
    category: '文件与目录',
    summary:
      '改变当前 Shell 的工作目录。它是 Bash 内建命令，因此必须影响当前 Shell，不能由独立子进程替代。',
    syntax: ['cd [DIRECTORY]', 'cd -'],
    examples: [
      {
        command: 'cd /home/student/labs',
        description: '进入课程实验目录。',
        destructive: false,
      },
      {
        command: 'cd -',
        description: '返回上一个工作目录并打印其路径。',
        destructive: false,
      },
    ],
    dangerLevel: 'safe',
    helpCommand: 'help cd',
    ...pendingVerification,
  },
  {
    name: 'mkdir',
    category: '文件与目录',
    summary:
      '创建目录。使用 -p 可以一次创建缺失的父目录，并允许目标目录已经存在。',
    syntax: ['mkdir [OPTION]... DIRECTORY...', 'mkdir -p PATH...'],
    examples: [
      {
        command: 'mkdir -p /home/student/labs/demo/src',
        description: '递归创建实验目录及其父目录。',
        destructive: false,
      },
      {
        command: 'mkdir -m 700 private-data',
        description: '创建仅当前用户可访问的目录。',
        destructive: false,
      },
    ],
    dangerLevel: 'caution',
    helpCommand: 'mkdir --help',
    ...pendingVerification,
  },
  {
    name: 'touch',
    category: '文件与目录',
    summary:
      '更新文件的访问时间和修改时间；文件不存在时默认创建空文件。它不会清空已有文件。',
    syntax: ['touch [OPTION]... FILE...', 'touch -r REFERENCE FILE'],
    examples: [
      {
        command: 'touch notes.txt',
        description: '创建空文件，或更新已有文件的时间戳。',
        destructive: false,
      },
      {
        command: 'touch -r source.c source.copy.c',
        description: '让目标文件采用参考文件的时间戳。',
        destructive: false,
      },
    ],
    dangerLevel: 'caution',
    helpCommand: 'touch --help',
    ...pendingVerification,
  },
  {
    name: 'cp',
    category: '文件与目录',
    summary:
      '复制文件或目录。默认会覆盖同名目标文件；复制目录通常需要 -R 或 -a，制作 rootfs 时常用 -a 保留元数据。',
    syntax: ['cp [OPTION]... SOURCE DEST', 'cp [OPTION]... SOURCE... DIRECTORY'],
    examples: [
      {
        command: 'cp -i config.ini config.ini.bak',
        description: '复制前在覆盖已有目标时进行确认。',
        destructive: false,
      },
      {
        command: 'cp -a rootfs/. rootfs-backup/',
        description: '递归复制 rootfs 内容并尽量保留链接、权限和时间戳。',
        destructive: false,
      },
    ],
    dangerLevel: 'caution',
    helpCommand: 'cp --help',
    ...pendingVerification,
  },
  {
    name: 'mv',
    category: '文件与目录',
    summary:
      '移动文件或目录，也用于重命名。目标已存在时可能被覆盖；跨文件系统移动不一定是原子操作。',
    syntax: ['mv [OPTION]... SOURCE DEST', 'mv [OPTION]... SOURCE... DIRECTORY'],
    examples: [
      {
        command: 'mv -i draft.txt notes.txt',
        description: '重命名文件，并在覆盖时请求确认。',
        destructive: false,
      },
      {
        command: 'mv build/output.bin artifacts/',
        description: '将编译产物移动到归档目录。',
        destructive: false,
      },
    ],
    dangerLevel: 'caution',
    helpCommand: 'mv --help',
    ...pendingVerification,
  },
  {
    name: 'rm',
    category: '文件与目录',
    summary:
      '删除文件或目录项，通常没有回收站。递归和强制选项可能迅速破坏虚拟系统，执行前应再次核对路径。',
    syntax: ['rm [OPTION]... FILE...', 'rm -r DIRECTORY...'],
    examples: [
      {
        command: 'rm -i /home/student/labs/demo/notes.txt',
        description: '交互确认后删除指定实验文件。',
        destructive: true,
      },
      {
        command: 'rm -rI /home/student/labs/demo/build',
        description: '递归删除构建目录，并在批量删除前确认一次。',
        destructive: true,
      },
    ],
    dangerLevel: 'dangerous',
    helpCommand: 'rm --help',
    ...pendingVerification,
  },
  {
    name: 'ln',
    category: '文件与目录',
    summary:
      '创建硬链接或符号链接。符号链接保存目标路径；硬链接指向同一 inode，通常不能跨文件系统。',
    syntax: ['ln [OPTION]... TARGET LINK_NAME', 'ln -s TARGET LINK_NAME'],
    examples: [
      {
        command: 'ln -s /opt/app/releases/v1 /home/student/labs/current',
        description: '创建指向目标路径的符号链接。',
        destructive: false,
      },
      {
        command: 'ln original.txt second-name.txt',
        description: '为同一个普通文件创建硬链接。',
        destructive: false,
      },
    ],
    dangerLevel: 'caution',
    helpCommand: 'ln --help',
    ...pendingVerification,
  },
  {
    name: 'cat',
    category: '文本查看',
    summary:
      '连接文件并写到标准输出。适合查看较短文本或组成管道；大文件更适合 less，二进制文件不应直接输出到终端。',
    syntax: ['cat [OPTION]... [FILE]...', 'cat FILE1 FILE2 > OUTPUT'],
    examples: [
      {
        command: 'cat /etc/os-release',
        description: '查看来宾发行版的文本标识。',
        destructive: false,
      },
      {
        command: 'cat part1.txt part2.txt > combined.txt',
        description: '依次连接两个文本文件并写入新文件。',
        destructive: false,
      },
    ],
    dangerLevel: 'safe',
    helpCommand: 'cat --help',
    ...pendingVerification,
  },
  {
    name: 'less',
    category: '文本查看',
    summary:
      '分页查看文本，支持搜索和前后滚动。按 / 搜索、n 跳到下一个匹配、q 退出；它适合日志和长输出。',
    syntax: ['less [OPTION]... FILE...', 'COMMAND | less'],
    examples: [
      {
        command: 'less /etc/services',
        description: '在全屏分页器中浏览较长文件。',
        destructive: false,
      },
      {
        command: 'ps aux | less',
        description: '分页查看进程列表，避免内容滚出屏幕。',
        destructive: false,
      },
    ],
    dangerLevel: 'safe',
    helpCommand: 'less --help',
    ...pendingVerification,
  },
  {
    name: 'head',
    category: '文本查看',
    summary:
      '输出文件或标准输入的开头部分，默认十行。常用于快速确认格式、表头或日志起始内容。',
    syntax: ['head [OPTION]... [FILE]...', 'head -n COUNT FILE'],
    examples: [
      {
        command: 'head -n 5 /etc/passwd',
        description: '显示文件前五行。',
        destructive: false,
      },
      {
        command: 'head -c 16 firmware.bin | od -An -tx1',
        description: '截取固件前 16 字节，再交给十六进制查看工具。',
        destructive: false,
      },
    ],
    dangerLevel: 'safe',
    helpCommand: 'head --help',
    ...pendingVerification,
  },
  {
    name: 'tail',
    category: '文本查看',
    summary:
      '输出文件末尾部分，默认十行。-f 会持续等待追加内容，常用于观察正在写入的日志，按 Ctrl+C 结束。',
    syntax: ['tail [OPTION]... [FILE]...', 'tail -f FILE'],
    examples: [
      {
        command: 'tail -n 20 build.log',
        description: '查看构建日志的最后二十行。',
        destructive: false,
      },
      {
        command: 'tail -f /tmp/service.log',
        description: '持续跟踪新追加的日志内容。',
        destructive: false,
      },
    ],
    dangerLevel: 'safe',
    helpCommand: 'tail --help',
    ...pendingVerification,
  },
  {
    name: 'grep',
    category: '文本处理',
    summary:
      '按模式筛选文本行。返回码 0 表示找到匹配，1 表示没有匹配，2 表示发生错误，脚本应区分这三种情况。',
    syntax: ['grep [OPTION]... PATTERN [FILE]...', 'COMMAND | grep [OPTION]... PATTERN'],
    examples: [
      {
        command: "grep -n 'error' build.log",
        description: '查找包含 error 的行并显示行号。',
        destructive: false,
      },
      {
        command: "grep -RIl 'CONFIG_GPIO' src/",
        description: '递归列出包含指定字符串的文本文件名。',
        destructive: false,
      },
    ],
    dangerLevel: 'safe',
    helpCommand: 'grep --help',
    ...pendingVerification,
  },
  {
    name: 'sed',
    category: '文本处理',
    summary:
      '流式编辑文本，可进行替换、选择和删除。默认把结果写到标准输出；使用 -i 才会直接改文件，操作前应保留备份。',
    syntax: ["sed [OPTION]... 'SCRIPT' [FILE]...", "sed 's/OLD/NEW/g' FILE"],
    examples: [
      {
        command: "sed -n '1,10p' config.txt",
        description: '只打印文件的第一到第十行，不修改源文件。',
        destructive: false,
      },
      {
        command: "sed 's/debug=false/debug=true/' app.conf > app.conf.new",
        description: '将替换结果写到新文件，便于比较后再采用。',
        destructive: false,
      },
    ],
    dangerLevel: 'caution',
    helpCommand: 'sed --help',
    ...pendingVerification,
  },
  {
    name: 'awk',
    category: '文本处理',
    summary:
      '按记录和字段处理结构化文本，能够筛选、计算和格式化输出。默认字段分隔符是连续空白，可用 -F 指定。',
    syntax: ["awk [OPTION]... 'PROGRAM' [FILE]...", "awk -F SEPARATOR 'PROGRAM' FILE"],
    examples: [
      {
        command: "awk -F: '{print $1}' /etc/passwd",
        description: '以冒号分列并输出每条账户记录的用户名。',
        destructive: false,
      },
      {
        command: "awk '{sum += $2} END {print sum}' sizes.txt",
        description: '累加第二列并在处理结束后输出总和。',
        destructive: false,
      },
    ],
    dangerLevel: 'caution',
    helpCommand: 'awk --help',
    ...pendingVerification,
  },
  {
    name: 'find',
    category: '搜索与批处理',
    summary:
      '从指定路径递归查找文件，并按名称、类型、大小、时间或权限组合条件。动作与条件的顺序会影响结果。',
    syntax: ['find [STARTING_POINT]... [EXPRESSION]', 'find PATH -type TYPE -name PATTERN'],
    examples: [
      {
        command: "find /home/student/labs -type f -name '*.c' -print",
        description: '查找实验目录内的 C 源文件。',
        destructive: false,
      },
      {
        command: "find rootfs -type f -perm /111 -exec file {} +",
        description: '找到 rootfs 中可执行的普通文件并识别其格式。',
        destructive: false,
      },
    ],
    dangerLevel: 'caution',
    helpCommand: 'find --help',
    ...pendingVerification,
  },
  {
    name: 'xargs',
    category: '搜索与批处理',
    summary:
      '把标准输入转换为另一个命令的参数。处理任意文件名时应使用 NUL 分隔的 -0，并先用 -p 或打印命令检查批处理范围。',
    syntax: ['xargs [OPTION]... [COMMAND [INITIAL-ARGS]...]', 'PRODUCER -print0 | xargs -0 COMMAND'],
    examples: [
      {
        command: "find src -type f -name '*.c' -print0 | xargs -0 wc -l",
        description: '安全处理含空格的文件名并统计各 C 文件行数。',
        destructive: false,
      },
      {
        command: "printf '%s\\n' alpha beta | xargs -n 1 printf 'item=%s\\n'",
        description: '每次取一个输入项调用格式化输出命令。',
        destructive: false,
      },
    ],
    dangerLevel: 'caution',
    helpCommand: 'xargs --help',
    ...pendingVerification,
  },
  {
    name: 'sort',
    category: '文本处理',
    summary:
      '按行排序文本。默认排序受 locale 影响；自动化构建若要求可重复顺序，可为该命令设置 LC_ALL=C。',
    syntax: ['sort [OPTION]... [FILE]...', 'COMMAND | sort [OPTION]...'],
    examples: [
      {
        command: 'sort names.txt',
        description: '按当前语言环境的规则排序文本行。',
        destructive: false,
      },
      {
        command: 'sort -t: -k3,3n /etc/passwd',
        description: '以冒号分列，按第三列 UID 做数值排序。',
        destructive: false,
      },
    ],
    dangerLevel: 'safe',
    helpCommand: 'sort --help',
    ...pendingVerification,
  },
  {
    name: 'uniq',
    category: '文本处理',
    summary:
      '合并或统计相邻的重复行。它不会自动把散布在文件中的相同行聚到一起，因此通常先使用 sort。',
    syntax: ['uniq [OPTION]... [INPUT [OUTPUT]]', 'sort FILE | uniq [OPTION]...'],
    examples: [
      {
        command: 'sort modules.txt | uniq',
        description: '排序后去除所有重复模块名。',
        destructive: false,
      },
      {
        command: 'sort modules.txt | uniq -c | sort -nr',
        description: '统计各行出现次数，并从多到少排列。',
        destructive: false,
      },
    ],
    dangerLevel: 'safe',
    helpCommand: 'uniq --help',
    ...pendingVerification,
  },
  {
    name: 'wc',
    category: '文本处理',
    summary:
      '统计字节、字符、单词或行数。处理源码清单和构建日志时，-l 是常见的快速数量检查手段。',
    syntax: ['wc [OPTION]... [FILE]...', 'COMMAND | wc [OPTION]...'],
    examples: [
      {
        command: 'wc -l src/main.c',
        description: '统计源文件中的换行数量。',
        destructive: false,
      },
      {
        command: "find src -type f -name '*.c' | wc -l",
        description: '统计 find 输出了多少个 C 源文件路径。',
        destructive: false,
      },
    ],
    dangerLevel: 'safe',
    helpCommand: 'wc --help',
    ...pendingVerification,
  },
  {
    name: 'cut',
    category: '文本处理',
    summary:
      '从每一行抽取指定字节、字符或分隔字段。它适合规则简单的单字符分隔文本，复杂格式应使用 awk。',
    syntax: ['cut OPTION... [FILE]...', 'cut -d DELIMITER -f FIELD_LIST FILE'],
    examples: [
      {
        command: 'cut -d: -f1,3 /etc/passwd',
        description: '输出账户文件中的用户名和 UID 字段。',
        destructive: false,
      },
      {
        command: 'cut -c1-8 checksums.txt',
        description: '提取每行最前面的八个字符。',
        destructive: false,
      },
    ],
    dangerLevel: 'safe',
    helpCommand: 'cut --help',
    ...pendingVerification,
  },
  {
    name: 'chmod',
    category: '权限管理',
    summary:
      '修改文件的权限位。可以使用 u/g/o 符号表达式或八进制模式；递归修改前应检查目标范围和符号链接行为。',
    syntax: ['chmod [OPTION]... MODE FILE...', 'chmod [OPTION]... OCTAL_MODE FILE...'],
    examples: [
      {
        command: 'chmod u+x build.sh',
        description: '只为属主增加脚本执行权限。',
        destructive: false,
      },
      {
        command: 'chmod 640 app.conf',
        description: '设置属主可读写、同组只读、其他用户无权限。',
        destructive: false,
      },
    ],
    dangerLevel: 'caution',
    helpCommand: 'chmod --help',
    ...pendingVerification,
  },
  {
    name: 'chown',
    category: '权限管理',
    summary:
      '更改文件属主和属组，通常需要管理员权限。错误的递归属主变更可能使服务或系统文件不可用。',
    syntax: ['chown [OPTION]... OWNER[:GROUP] FILE...', 'chown [OPTION]... --reference=RFILE FILE...'],
    examples: [
      {
        command: 'sudo chown student:student /home/student/labs/output.bin',
        description: '把单个实验产物交还给学习用户。',
        destructive: true,
      },
      {
        command: 'chown --reference=template.conf app.conf',
        description: '让目标文件采用参考文件的属主和属组。',
        destructive: true,
      },
    ],
    dangerLevel: 'dangerous',
    helpCommand: 'chown --help',
    ...pendingVerification,
  },
  {
    name: 'ps',
    category: '进程与作业',
    summary:
      '报告某一时刻的进程快照。不同选项风格可组合但含义不同；查看动态变化应使用 top 等监视工具。',
    syntax: ['ps [OPTION]...', 'ps aux', 'ps -ef'],
    examples: [
      {
        command: 'ps -ef',
        description: '以完整格式列出系统进程及父进程关系字段。',
        destructive: false,
      },
      {
        command: 'ps -o pid,ppid,stat,comm -p $$',
        description: '查看当前 Shell 的 PID、父 PID、状态和命令名。',
        destructive: false,
      },
    ],
    dangerLevel: 'safe',
    helpCommand: 'ps --help all',
    ...pendingVerification,
  },
  {
    name: 'kill',
    category: '进程与作业',
    summary:
      '向进程发送信号，默认发送 SIGTERM 请求正常退出。SIGKILL 无法被捕获或清理，只应在进程不能正常结束时使用。',
    syntax: ['kill [-SIGNAL] PID...', 'kill -l [SIGNAL]'],
    examples: [
      {
        command: 'kill -TERM 1234',
        description: '请求 PID 1234 的进程进行清理并退出。',
        destructive: true,
      },
      {
        command: 'kill -l',
        description: '列出当前系统支持的信号名称。',
        destructive: false,
      },
    ],
    dangerLevel: 'caution',
    helpCommand: 'help kill',
    ...pendingVerification,
  },
  {
    name: 'jobs',
    category: '进程与作业',
    summary:
      '列出当前交互式 Shell 管理的后台或暂停作业。作业号只属于当前 Shell，与系统范围的 PID 不同。',
    syntax: ['jobs [OPTION]... [JOBSPEC]...'],
    examples: [
      {
        command: 'jobs -l',
        description: '列出当前 Shell 的作业并同时显示 PID。',
        destructive: false,
      },
      {
        command: 'sleep 60 & jobs',
        description: '启动一个后台任务，然后查看它的作业状态。',
        destructive: false,
      },
    ],
    dangerLevel: 'safe',
    helpCommand: 'help jobs',
    ...pendingVerification,
  },
  {
    name: 'tar',
    category: '归档与识别',
    summary:
      '把多个文件打包成归档，并可配合压缩。嵌入式 rootfs 归档必须留意所有权、权限、符号链接及解包路径。',
    syntax: ['tar [OPTION]... [FILE]...', 'tar -cf ARCHIVE DIRECTORY', 'tar -xf ARCHIVE'],
    examples: [
      {
        command: 'tar -czf rootfs.tar.gz -C rootfs .',
        description: '从 rootfs 内部打包内容，避免归档多一层顶级目录。',
        destructive: false,
      },
      {
        command: 'tar -tvf rootfs.tar.gz',
        description: '只列出归档成员和元数据，不进行解包。',
        destructive: false,
      },
    ],
    dangerLevel: 'caution',
    helpCommand: 'tar --help',
    ...pendingVerification,
  },
  {
    name: 'file',
    category: '归档与识别',
    summary:
      '根据文件内容特征识别类型，而不是只看扩展名。可用于区分脚本、ELF、数据文件，以及确认可执行文件的架构。',
    syntax: ['file [OPTION]... FILE...'],
    examples: [
      {
        command: 'file /bin/sh',
        description: '识别 /bin/sh 本身或其链接目标的文件类型。',
        destructive: false,
      },
      {
        command: 'file firmware.bin app',
        description: '比较固件数据与可执行程序的识别结果。',
        destructive: false,
      },
    ],
    dangerLevel: 'safe',
    helpCommand: 'file --help',
    ...pendingVerification,
  },
  {
    name: 'uname',
    category: '系统信息',
    summary:
      '输出当前运行内核和机器架构等信息。它描述的是 v86 来宾系统，不代表宿主电脑或目标 ARM 开发板。',
    syntax: ['uname [OPTION]...'],
    examples: [
      {
        command: 'uname -a',
        description: '显示内核名、版本、构建信息和来宾机器架构。',
        destructive: false,
      },
      {
        command: 'uname -m',
        description: '只输出来宾机器硬件名称。',
        destructive: false,
      },
    ],
    dangerLevel: 'safe',
    helpCommand: 'uname --help',
    ...pendingVerification,
  },
] as const satisfies readonly CommandDoc[];

type AdditionalCommand = {
  name: string;
  category: CommandCategory;
  summary: string;
  syntax: string;
  example: string;
  exampleDescription: string;
  helpCommand?: string;
  dangerLevel?: CommandDangerLevel;
};

const additionalCommands: readonly AdditionalCommand[] = [
  { name: 'echo', category: 'Shell 基础', summary: '输出文本或变量值，常用于脚本提示和快速检查环境变量。', syntax: 'echo [OPTION]... [STRING]...', example: 'echo "$HOME"', exampleDescription: '显示当前用户的主目录。' },
  { name: 'printf', category: 'Shell 基础', summary: '按指定格式输出文本，比 echo 更适合可移植脚本。', syntax: 'printf FORMAT [ARGUMENT]...', example: "printf 'name=%s\\n' \"$USER\"", exampleDescription: '按固定格式输出用户名。' },
  { name: 'clear', category: 'Shell 基础', summary: '清理当前终端显示区域，不会删除命令历史。', syntax: 'clear', example: 'clear', exampleDescription: '清理终端画面。' },
  { name: 'history', category: 'Shell 基础', summary: '查看当前 Shell 保存的历史命令。', syntax: 'history [N]', example: 'history 20', exampleDescription: '查看最近二十条历史记录。', helpCommand: 'help history' },
  { name: 'alias', category: 'Shell 基础', summary: '为较长命令定义当前 Shell 会话内的简短别名。', syntax: 'alias [NAME[=VALUE]...]', example: "alias ll='ls -lah'", exampleDescription: '创建常用的详细列表别名。', helpCommand: 'help alias' },
  { name: 'env', category: 'Shell 基础', summary: '显示环境变量，或在临时环境中运行命令。', syntax: 'env [OPTION]... [NAME=VALUE]... [COMMAND]', example: 'env | sort', exampleDescription: '按名称排序查看环境变量。' },
  { name: 'export', category: 'Shell 基础', summary: '把 Shell 变量导出给随后启动的子进程。', syntax: 'export NAME=VALUE', example: 'export EDITOR=vi', exampleDescription: '为当前会话设置默认编辑器。', helpCommand: 'help export' },
  { name: 'which', category: 'Shell 基础', summary: '查找 PATH 中将被执行的命令文件。', syntax: 'which COMMAND...', example: 'which sh', exampleDescription: '查找 sh 的命令路径。' },
  { name: 'command', category: 'Shell 基础', summary: '判断命令是否存在，或绕过同名函数和别名执行命令。', syntax: 'command [-vV] NAME', example: 'command -v busybox', exampleDescription: '检查 BusyBox 是否存在。', helpCommand: 'help command' },
  { name: 'test', category: 'Shell 基础', summary: '判断文件、字符串或数字条件，退出码表示真假。', syntax: 'test EXPRESSION', example: 'test -f /etc/os-release && echo yes', exampleDescription: '判断发行版信息文件是否存在。', helpCommand: 'help test' },
  { name: 'date', category: '系统信息', summary: '显示或格式化系统日期时间；修改时间通常需要管理员权限。', syntax: 'date [OPTION]... [+FORMAT]', example: "date '+%F %T %Z'", exampleDescription: '显示日期、时间与时区。' },
  { name: 'uptime', category: '系统信息', summary: '显示系统运行时长和负载平均值。', syntax: 'uptime', example: 'uptime', exampleDescription: '查看启动多久及近期负载。' },
  { name: 'free', category: '系统信息', summary: '查看物理内存和 Swap 的使用情况。', syntax: 'free [OPTION]', example: 'free -h', exampleDescription: '以易读单位查看内存。' },
  { name: 'dmesg', category: '系统信息', summary: '读取内核环形缓冲区，常用于启动和驱动故障排查。', syntax: 'dmesg [OPTION]...', example: 'dmesg | tail -n 30', exampleDescription: '查看最近的内核消息。' },
  { name: 'whoami', category: '用户与身份', summary: '显示当前命令的有效用户名。', syntax: 'whoami', example: 'whoami', exampleDescription: '确认当前身份。' },
  { name: 'id', category: '用户与身份', summary: '显示用户 ID、主组和附加组。', syntax: 'id [USER]', example: 'id', exampleDescription: '查看当前用户的 UID、GID 与组。' },
  { name: 'groups', category: '用户与身份', summary: '列出用户所属的组。', syntax: 'groups [USER]...', example: 'groups', exampleDescription: '查看当前用户组。' },
  { name: 'who', category: '用户与身份', summary: '显示当前登录会话及其终端。', syntax: 'who [OPTION]...', example: 'who', exampleDescription: '查看当前登录用户。' },
  { name: 'passwd', category: '用户与身份', summary: '修改用户密码；生产环境应遵守密码和审计策略。', syntax: 'passwd [USER]', example: 'passwd', exampleDescription: '修改当前用户密码。', dangerLevel: 'caution' },
  { name: 'su', category: '用户与身份', summary: '切换用户身份并可启动登录 Shell。', syntax: 'su [-] [USER]', example: 'su - appuser', exampleDescription: '切换为 appuser 的登录环境。', dangerLevel: 'caution' },
  { name: 'sudo', category: '用户与身份', summary: '按策略临时以其他身份执行单条命令，并留下审计记录。', syntax: 'sudo [OPTION] COMMAND', example: 'sudo systemctl status ssh', exampleDescription: '以授权身份查看 SSH 服务。', dangerLevel: 'caution' },
  { name: 'stat', category: '文件与目录', summary: '显示文件类型、权限、inode、大小和时间戳等详细元数据。', syntax: 'stat [OPTION]... FILE...', example: 'stat /etc/passwd', exampleDescription: '查看文件的完整元数据。' },
  { name: 'readlink', category: '文件与目录', summary: '读取符号链接目标，-f 可解析完整规范路径。', syntax: 'readlink [OPTION]... FILE...', example: 'readlink -f /bin/sh', exampleDescription: '解析 /bin/sh 最终指向的位置。' },
  { name: 'basename', category: '文件与目录', summary: '从路径中移除目录部分，留下最后一个名称。', syntax: 'basename NAME [SUFFIX]', example: 'basename /var/log/syslog', exampleDescription: '输出 syslog。' },
  { name: 'dirname', category: '文件与目录', summary: '从路径中移除最后一个名称，留下目录部分。', syntax: 'dirname NAME', example: 'dirname /var/log/syslog', exampleDescription: '输出 /var/log。' },
  { name: 'du', category: '磁盘与文件系统', summary: '统计文件和目录占用的磁盘空间。', syntax: 'du [OPTION]... [FILE]...', example: 'du -sh /var/log', exampleDescription: '汇总日志目录占用。' },
  { name: 'df', category: '磁盘与文件系统', summary: '查看已挂载文件系统的容量、已用空间和可用空间。', syntax: 'df [OPTION]... [FILE]...', example: 'df -hT', exampleDescription: '查看文件系统类型和容量。' },
  { name: 'lsblk', category: '磁盘与文件系统', summary: '以树形结构列出块设备、分区和挂载点。', syntax: 'lsblk [OPTION]...', example: 'lsblk -f', exampleDescription: '查看块设备文件系统与 UUID。' },
  { name: 'blkid', category: '磁盘与文件系统', summary: '识别块设备的文件系统类型、标签和 UUID。', syntax: 'blkid [DEVICE]...', example: 'sudo blkid', exampleDescription: '列出可识别的块设备。', dangerLevel: 'caution' },
  { name: 'mount', category: '磁盘与文件系统', summary: '把文件系统连接到目录树中的挂载点。', syntax: 'mount [OPTION] DEVICE DIRECTORY', example: 'mount | column -t', exampleDescription: '查看当前挂载关系。', dangerLevel: 'caution' },
  { name: 'umount', category: '磁盘与文件系统', summary: '安全卸载文件系统；应先确保没有进程占用。', syntax: 'umount [OPTION] TARGET', example: 'sudo umount /mnt/data', exampleDescription: '卸载指定挂载点。', dangerLevel: 'dangerous' },
  { name: 'fdisk', category: '磁盘与文件系统', summary: '查看或编辑磁盘分区表，写入操作可能破坏全部数据。', syntax: 'fdisk [OPTION] DEVICE', example: 'sudo fdisk -l', exampleDescription: '只读列出磁盘分区表。', dangerLevel: 'dangerous' },
  { name: 'sync', category: '磁盘与文件系统', summary: '要求内核把缓存中的文件系统写入提交到底层存储。', syntax: 'sync', example: 'sync', exampleDescription: '在安全移除介质前刷新写入。', dangerLevel: 'caution' },
  { name: 'top', category: '进程与作业', summary: '交互查看进程、CPU、内存和负载。', syntax: 'top', example: 'top', exampleDescription: '实时观察系统资源与进程。' },
  { name: 'pgrep', category: '进程与作业', summary: '按名称或其他属性查找进程 ID。', syntax: 'pgrep [OPTION] PATTERN', example: 'pgrep -a sshd', exampleDescription: '查找 sshd 进程并显示命令行。' },
  { name: 'pkill', category: '进程与作业', summary: '按名称向进程发送信号，范围比 kill 更容易误选。', syntax: 'pkill [OPTION] PATTERN', example: 'pkill -TERM demo-worker', exampleDescription: '请求结束匹配的实验进程。', dangerLevel: 'dangerous' },
  { name: 'nice', category: '进程与作业', summary: '以指定调度优先级启动程序。', syntax: 'nice [-n N] COMMAND', example: 'nice -n 10 ./build.sh', exampleDescription: '以较低 CPU 优先级执行构建。', dangerLevel: 'caution' },
  { name: 'nohup', category: '进程与作业', summary: '让命令忽略挂断信号，退出终端后仍可继续。', syntax: 'nohup COMMAND [ARG]... &', example: 'nohup ./worker.sh >worker.log 2>&1 &', exampleDescription: '后台运行任务并保存日志。', dangerLevel: 'caution' },
  { name: 'ip', category: '网络诊断', summary: '查看和配置网卡、地址、路由与邻居表。', syntax: 'ip [OPTION] OBJECT COMMAND', example: 'ip address show', exampleDescription: '查看所有接口与地址。', dangerLevel: 'caution' },
  { name: 'ping', category: '网络诊断', summary: '发送 ICMP 回显请求，检查基本连通性和时延。', syntax: 'ping [OPTION] DESTINATION', example: 'ping -c 4 1.1.1.1', exampleDescription: '发送四次连通性探测。' },
  { name: 'ss', category: '网络诊断', summary: '查看监听端口、连接和套接字统计，是 netstat 的现代替代。', syntax: 'ss [OPTION] [FILTER]', example: 'ss -lntup', exampleDescription: '查看监听中的 TCP/UDP 端口。' },
  { name: 'hostname', category: '网络诊断', summary: '显示系统主机名；修改主机名通常交给 hostnamectl。', syntax: 'hostname [OPTION]', example: 'hostname', exampleDescription: '显示当前主机名。' },
  { name: 'nslookup', category: '网络诊断', summary: '查询 DNS 名称和地址记录。', syntax: 'nslookup NAME [SERVER]', example: 'nslookup example.com', exampleDescription: '查询域名解析结果。' },
  { name: 'traceroute', category: '网络诊断', summary: '探测数据包到目标途经的网络跳点。', syntax: 'traceroute [OPTION] HOST', example: 'traceroute example.com', exampleDescription: '观察到目标的路由路径。' },
  { name: 'curl', category: '网络诊断', summary: '通过 HTTP 等协议传输数据，常用于 API、健康检查和下载。', syntax: 'curl [OPTION]... URL', example: 'curl -I https://example.com', exampleDescription: '只获取 HTTP 响应头。' },
  { name: 'wget', category: '网络诊断', summary: '从网络下载文件，适合非交互任务和断点续传。', syntax: 'wget [OPTION]... URL', example: 'wget -O page.html https://example.com', exampleDescription: '把页面保存为指定文件。', dangerLevel: 'caution' },
  { name: 'ssh', category: '网络诊断', summary: '加密登录远程 Linux 主机并执行命令。', syntax: 'ssh [OPTION] [USER@]HOST', example: 'ssh student@server.example', exampleDescription: '登录远程学习服务器。', dangerLevel: 'caution' },
  { name: 'scp', category: '网络诊断', summary: '通过 SSH 安全复制文件。', syntax: 'scp [OPTION] SOURCE DEST', example: 'scp report.txt student@server:/tmp/', exampleDescription: '上传报告到远程临时目录。', dangerLevel: 'caution' },
  { name: 'apt', category: '软件与服务', summary: '在 Debian/Ubuntu 中搜索、安装、升级和删除软件包。', syntax: 'apt [OPTION] COMMAND', example: 'sudo apt update', exampleDescription: '刷新软件包索引。', dangerLevel: 'caution' },
  { name: 'dpkg', category: '软件与服务', summary: '查询或操作 Debian deb 软件包，是 apt 下层工具之一。', syntax: 'dpkg [OPTION] ACTION', example: 'dpkg -l | head', exampleDescription: '查看部分已安装软件包。', dangerLevel: 'caution' },
  { name: 'systemctl', category: '软件与服务', summary: '管理 systemd 服务、目标单元和系统状态。', syntax: 'systemctl [OPTION] COMMAND [UNIT]', example: 'systemctl status ssh', exampleDescription: '查看 SSH 服务状态。', dangerLevel: 'caution' },
  { name: 'journalctl', category: '软件与服务', summary: '查询 systemd 日志，可按服务、时间和优先级筛选。', syntax: 'journalctl [OPTION]...', example: 'journalctl -u ssh --since today', exampleDescription: '查看今天的 SSH 服务日志。' },
  { name: 'crontab', category: '软件与服务', summary: '查看或编辑当前用户的周期任务。', syntax: 'crontab [-l|-e|-r]', example: 'crontab -l', exampleDescription: '只读查看当前用户计划任务。', dangerLevel: 'caution' },
  { name: 'gzip', category: '归档与识别', summary: '使用 gzip 压缩单个数据流或文件。', syntax: 'gzip [OPTION]... FILE...', example: 'gzip -k app.log', exampleDescription: '保留原文件并生成 app.log.gz。', dangerLevel: 'caution' },
  { name: 'gunzip', category: '归档与识别', summary: '解压 gzip 文件。', syntax: 'gunzip [OPTION]... FILE...', example: 'gunzip -k app.log.gz', exampleDescription: '保留压缩包并解压。', dangerLevel: 'caution' },
  { name: 'zip', category: '归档与识别', summary: '创建跨平台常用的 ZIP 归档。', syntax: 'zip [OPTION] ARCHIVE FILE...', example: 'zip -r project.zip project/', exampleDescription: '递归打包项目目录。', dangerLevel: 'caution' },
  { name: 'unzip', category: '归档与识别', summary: '列出或解压 ZIP 归档；解压前应检查路径。', syntax: 'unzip [OPTION] ARCHIVE', example: 'unzip -l project.zip', exampleDescription: '只查看归档清单。', dangerLevel: 'caution' },
  { name: 'diff', category: '文本处理', summary: '逐行比较文本文件或目录，常用于审查配置变化。', syntax: 'diff [OPTION]... FILES', example: 'diff -u config.old config.new', exampleDescription: '以统一格式显示配置差异。' },
  { name: 'tee', category: '文本处理', summary: '把标准输入同时写到屏幕和文件。', syntax: 'tee [OPTION]... FILE...', example: 'printf "ok\\n" | tee result.txt', exampleDescription: '显示并保存同一份输出。', dangerLevel: 'caution' },
  { name: 'tr', category: '文本处理', summary: '替换、压缩或删除字符，适合简单字符级管道处理。', syntax: 'tr [OPTION] SET1 [SET2]', example: "printf 'linux' | tr 'a-z' 'A-Z'", exampleDescription: '把小写字母转换为大写。' },
  { name: 'od', category: '归档与识别', summary: '以八进制、十六进制或字符形式查看原始字节。', syntax: 'od [OPTION]... [FILE]...', example: 'od -An -tx1 -N16 firmware.bin', exampleDescription: '查看固件前 16 字节。' },
  { name: 'sleep', category: 'Shell 基础', summary: '等待指定时间，常用于脚本重试和节流。', syntax: 'sleep NUMBER[SUFFIX]', example: 'sleep 2', exampleDescription: '暂停两秒。' },
  { name: 'reboot', category: '软件与服务', summary: '重新启动系统，会中断全部进程和未保存工作。', syntax: 'reboot', example: 'sudo reboot', exampleDescription: '在维护窗口内重启系统。', dangerLevel: 'dangerous' },
  { name: 'shutdown', category: '软件与服务', summary: '按计划关机或重启，并通知登录用户。', syntax: 'shutdown [OPTION] TIME [MESSAGE]', example: "sudo shutdown -h +10 'maintenance'", exampleDescription: '十分钟后关机并广播原因。', dangerLevel: 'dangerous' },
];

function createAdditionalCommand(command: AdditionalCommand): CommandDoc {
  return {
    name: command.name,
    category: command.category,
    summary: command.summary,
    syntax: [command.syntax],
    examples: [
      {
        command: command.example,
        description: command.exampleDescription,
        destructive: command.dangerLevel === 'dangerous',
      },
    ],
    dangerLevel: command.dangerLevel ?? 'safe',
    helpCommand: command.helpCommand ?? `${command.name} --help`,
    ...pendingVerification,
  };
}

export const commandDocs: readonly CommandDoc[] = [
  ...coreCommandDocs,
  ...additionalCommands.map(createAdditionalCommand),
];
