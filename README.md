# Kernel Lab：浏览器内嵌入式 Linux 学习平台

Kernel Lab 是一个中文 Linux 学习网站，产品分为两条相互衔接的路径：

- **装系统**：用教学式流程解释 Linux 镜像、文件系统、用户、主机名和首次启动配置；
- **使用系统**：通过 v86 在浏览器内运行真实 Linux 技术探针，并用 xterm.js 连接串口终端。

> 当前状态：**Phase 0 本地技术探针已取得关键运行证据，但总门禁仍未通过。** Production build 已成功；Codex 内置 Chromium 已实际启动 Linux 5.6.15 i686/BusyBox，串口交互、BusyBox Tab、命令历史、Ctrl+C、退出码以及 IndexedDB 保存/关闭/恢复均有一次通过记录。正式 Bash/Readline、自建可分发镜像和 Vercel Preview 仍未完成，因此不能宣称正式 Linux 学习环境已经交付。

本轮本地浏览器证据包括：

- 健康挑战由来宾返回 `__KERNEL_LAB_HEALTH_Linux__`；
- `uname -m` 动态返回 `i686`，`false` 的真实退出码为 `1`；
- 在 BusyBox Shell 中输入 `una` 后按 Tab 补全为 `uname`；
- `↑` 可取回历史，Ctrl+C 可中断并回到提示符；
- 来宾中创建的文件在快照保存、关闭虚拟机并恢复后仍存在；
- 六步安装流程能把安装配置联动到 `ready` 状态；
- 所有静态路由检查时无控制台错误，390×844 视口无页面横向溢出。

这些结果来自本地 Codex 内置 Chromium，不是 Vercel Preview 证据；浏览器的精确 Chromium 版本和性能耗时尚未记录。

## 技术边界

- 终端输出必须来自浏览器内运行的 Linux 来宾，不使用 JavaScript 命令映射伪造输出。
- 当前探针使用远程 BusyBox/Buildroot 启动资源。已验证的是 **BusyBox Shell 的 Tab 行为**，不是 Bash、Readline 或 bash-completion。
- v86 提供的是 32 位 x86 虚拟环境，不等同于 ARM 开发板。GPIO、I²C、SPI、MTD/NAND 和特定 SoC 驱动实验不在当前真实执行范围内。
- “装系统”是教学式配置和预置镜像初始化，不是在浏览器里从 ISO 逐文件安装发行版。
- 本地状态保存在当前站点来源的浏览器存储中。清除站点数据、使用无痕窗口、存储被回收或更换设备都可能使环境丢失。

逐项状态和证据见 [技术可行性记录](docs/feasibility-spike.md)，公开限制见 [已知限制](docs/limitations.md)。

## 技术栈

- React 19 + TypeScript + Vite
- 内置同源客户端路由（六个固定页面，无额外路由依赖）
- `@xterm/xterm` + `@xterm/addon-fit`
- v86/WebAssembly
- IndexedDB（通过 `idb`）
- Vitest、Testing Library、Playwright

项目是纯客户端静态网站。V1 不需要 Vercel Functions、数据库、WebSocket 中继或云端虚拟机。

## 从全新克隆开始

前置条件：

- Node.js 22 或更高版本；建议使用受支持的 Node.js LTS；
- npm；
- 支持 WebAssembly 和 IndexedDB 的现代桌面浏览器。

```bash
git clone <你的仓库地址>
cd Linux
npm ci
npm run dev
```

打开 Vite 输出的本地地址。首页不会自动下载 Linux 资源；只有进入实验室并主动启动时，浏览器才会请求 v86、BIOS 和技术探针内核。本地 Vite 将探针路径同源转发到远程来源；前端下载完成后使用 Web Crypto 校验固定大小和 SHA-256，再把字节交给 v86。

当前不需要私密环境变量。`.env.example` 仅作为未来公开构建变量的模板；任何以 `VITE_` 开头的值都会进入浏览器包，不能存放密钥。

## 质量检查

```bash
npm run typecheck
npm run lint
npm run test
npm run build
npm run test:e2e
```

不要因为命令存在就认为验收已通过；实际运行结果应记录在开发汇报或 CI 中。本轮 `npm run build` 已成功。当前 GitHub CI 只执行 `npm ci`、typecheck、lint、单元/集成测试和生产构建，不负责部署，也尚未把依赖真实来宾镜像的核心 e2e 纳入门禁。

本地检查生产构建：

```bash
npm run build
npm run preview
```

## GitHub + Vercel 部署

大镜像、状态快照和工具链不能提交到 Git；`.gitignore` 已排除常见镜像与构建输出。正式镜像应作为带版本的独立 Release 资产发布，并在上线前验证许可证、哈希、CORS、Range 和浏览器启动。

把源码推送到 GitHub 后，在 Vercel 导入仓库并填写：

| 设置 | 值 |
| --- | --- |
| Framework Preset | Vite |
| Root Directory | `./`（如果仓库根就是本目录） |
| Install Command | `npm ci` |
| Build Command | `npm run build` |
| Output Directory | `dist` |
| Production Branch | `master`（当前 GitHub 默认分支） |
| Node.js Version | 与 `package.json` 的 Node 约束兼容的受支持 LTS |

推荐让 Vercel Git Integration 负责部署：功能分支和 Pull Request 生成 Preview。当前 `vercel.json` 明确关闭 `master` 的自动部署，避免技术探针意外进入 Production；只有完成自建镜像与许可证门禁后，才能由维护者显式解除。仓库中的 GitHub Actions 只做质量检查，不重复调用 Vercel 部署。

当前 `vercel.json` 为探针路径配置了 external rewrite，使浏览器仍从同源路径请求远程文件；这项规则尚未在 Vercel Preview 验证。代理、同源转发和 SHA-256 校验都不等于取得镜像再分发权。在把 Preview 提升为生产前，必须在 Preview 地址重新验证真实启动、串口输入输出、Tab、保存/恢复和失败提示，并完成镜像许可审查。当前技术探针**禁止部署到 Production**。

“零付费”只是个人、非商业学习场景在各服务免费计划和用量限制内的目标，不代表无限流量或永久免费。部署前应重新核对 [Vercel 用量与限制](https://vercel.com/docs/limits) 和 GitHub 账户用量。

## 来宾镜像

仓库当前没有可分发的生产来宾镜像。`public/assets-manifest.json` 只有一个明确标记为 `technical-probe-only` 的远程探针条目：5,166,352 bytes，SHA-256 `7befbaea31e249d9a518c4b95fa42b2a193d0e3de46250d617cbdeb866ee28b0`。哈希已在浏览器下载后验证，但来源仍不是不可变引用，也没有匹配的 Buildroot 配置、源码归档、SBOM 和 `legal-info`。

正式版必须使用固定版本、自行构建的 Buildroot 配置，并保存构建脚本、哈希、SBOM、版权材料及 `make legal-info` 输出。详情见 [guest/README.md](guest/README.md)。

在这些材料完成前，不得复制当前远程探针资源到仓库、GitHub Release 或 Vercel，也不得把它标记为 Core/Embedded 正式镜像。

## 项目文档

- [架构与暂定决策](docs/architecture.md)
- [Phase 0 技术可行性记录](docs/feasibility-spike.md)
- [已知限制与未完成项](docs/limitations.md)
- [正式来宾镜像要求](guest/README.md)

## 许可证与第三方材料

应用源码许可证尚未在本仓库中声明。v86、xterm.js、Linux、BusyBox、Buildroot 及来宾中的软件各有自己的许可证义务；安装 npm 依赖并不自动取得重新分发来宾镜像的许可证明。任何镜像发布都必须先完成逐项许可证审核和对应源码提供安排。
