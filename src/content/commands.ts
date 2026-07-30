export type CommandDangerLevel = 'safe' | 'caution' | 'dangerous';

export type CommandCategory =
  | '系统信息'
  | '文件与目录'
  | '文本查看'
  | '文本处理'
  | '搜索与批处理'
  | '权限管理'
  | '进程与作业'
  | '归档与识别';

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
    '等待来宾镜像 command-manifest.json 验证；界面不得据此宣称命令已经安装。',
} as const;

export const commandDocs = [
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
