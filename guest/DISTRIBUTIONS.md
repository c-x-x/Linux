# 发行版镜像路线

浏览器运行时当前使用 v86 0.5.424，只模拟 32 位 x86。每个发行版在 UI 中的状态都由
`public/distributions.json` 记录，只有完成构建、校验、许可证复核和浏览器启动测试后才能标记为
`bootable`。

## Buildroot Core

当前技术探针约 9.6 MiB，已经验证可在生产站点启动、进入串口 Shell、执行命令和保存检查点。
它适合启动链、文件系统、Shell 和嵌入式基础练习，但不具备 Debian/Ubuntu 的 apt 或 systemd，
界面不得把它称为 Debian 或 Ubuntu。

项目自有正式镜像应固定 Buildroot LTS 版本，在 GitHub Actions 的 Linux 环境构建，并发布到带版本的
GitHub Release；配置、源码哈希、包清单、命令清单、SBOM、legal-info 和 SHA256SUMS 必须一同发布。

## Debian 12 Bookworm 教学模拟

网站采用明确标识的浏览器教学模拟器提供 Debian 安装、Shell、apt、systemd、文件、磁盘与网络课程。
它不会下载数百 MiB 的安装 ISO，也不会声称模拟结果来自真实生产服务器。

若未来恢复真实 Debian 镜像路线，仍需完成：

1. 在固定的 Debian/Buildroot 构建容器中以官方 Bookworm 仓库生成最小 i386 rootfs；
2. 加入 Bash、coreutils、findutils、grep、sed、gawk、procps、iproute2、iputils、curl、openssh-client、
   apt、dpkg、systemd 工具文档和课程辅助脚本；
3. 配置 32 位内核、串口控制台和只用于学习环境的普通用户；
4. 生成 v86 可用的只读基础磁盘与可写增量磁盘，压缩后控制首屏下载体积；
5. 在 CI 中启动 v86，验证 Shell、Tab 补全、课程命令、退出码、快照恢复和磁盘持久化；
6. 发布不可变 Release 资产，再把清单状态改为 `bootable`。

在这六项完成前，Debian 入口只标记为“教学模拟”，不能标记为真实 Linux。

## Ubuntu 24.04 LTS 教学模拟

当前 v86 不支持 x86-64，而现代受支持 Ubuntu 不适合作为该运行时的 32 位镜像。网站使用 Ubuntu
24.04 LTS 教学模拟器教授 apt、systemd、SSH、服务器和企业生态知识，不会为了显示 Ubuntu Logo
而发布已经结束标准支持的旧版本。真实 Ubuntu 环境仍需要支持 x86-64 的浏览器虚拟机或受控远程容器。

## 零成本发布

网页继续由 GitHub + Vercel 免费部署；大镜像不进入 Git 仓库和 Vercel Function，而放在 GitHub
Release。浏览器按清单下载并校验 SHA-256。这样不会每次打开网页都重新安装：镜像和检查点可以由
浏览器缓存/IndexedDB 保存，只有版本变化或用户主动重置时才重新获取。
