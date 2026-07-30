# 架构与暂定决策

本文同时描述当前 Phase 0 原型和正式版目标。标为“目标”的能力不代表已经实现或验证。当前本地 Chromium 与受保护的 Vercel Preview 已跑通真实 Linux/BusyBox 技术探针；正式 Bash 和可分发来宾镜像仍是目标。

## 系统边界

Kernel Lab 的核心是静态单页应用。React 负责安装教学、课程、命令说明和状态界面；真正的命令应由浏览器内 v86 来宾执行。Vercel 托管前端文件和小型清单，并用一个固定目标 Function 转发技术探针字节；它不承担虚拟机计算、终端后端或用户磁盘持久化。

```text
浏览器
├── React + 内置同源路由 / 页面与课程内容
├── 安装配置模型
├── xterm.js
│   └── onData <-> v86 serial0
├── v86 + WebAssembly
│   └── 32 位 x86 Linux 来宾
└── IndexedDB
    ├── 安装状态
    ├── 课程进度
    └── v86 状态快照原型

外部静态来源（仅当前探针）
├── 固定 npm 版本的 v86 WASM
├── 固定 v86 提交的 BIOS
└── 未获生产分发批准的 Buildroot bzImage
```

项目没有服务器端 Shell。任何“命令提示”或课程说明都只能辅助用户，不能代替来宾执行并生成看似真实的结果。

## 页面和加载策略

SPA 规划包含：

- `/`：产品入口和状态概览；
- `/install`：教学式安装和配置；
- `/lab`：真实终端技术探针；
- `/commands`：命令文档；
- `/courses`：课程；
- `/about`：边界、隐私和许可证说明。

虚拟机相关代码只应在访问实验室时动态加载。首页不得启动 v86 或下载 Linux 资源。Vercel 的 SPA fallback 负责把深层路由交还给客户端路由器。每个快照还绑定由资源清单、内核 SHA、BIOS/WASM 地址、v86 版本、内存和启动参数生成的 SHA-256 配置指纹；配置不匹配时必须在构造 v86 前拒绝恢复。

## 终端数据流

目标链路如下：

```text
键盘 -> xterm.js onData -> v86 serial0 输入 -> Linux TTY -> 来宾 Shell
来宾 stdout/stderr/ANSI -> v86 serial0 输出字节 -> xterm.js
```

当前 `V86Runtime` 使用 v86 的 `serial_send_bytes(0, ...)` 发送输入，并监听 `serial0-output-byte`。提示符出现后，运行时向来宾发送动态健康挑战，并只在串口返回 `__KERNEL_LAB_HEALTH_Linux__` 后标记 Shell 就绪。这比只匹配提示符更可靠，但仍是当前探针协议；正式镜像应使用版本化、可测试的启动握手。

xterm.js 不在前端实现 Shell 解析器。当前本地浏览器已验证：BusyBox 把 `una` + Tab 补全为 `uname`，`↑` 取回历史，Ctrl+C 回到提示符。最终 Bash/Readline 行为仍必须来自正式来宾；这些 BusyBox 证据不能改写成 Bash 已通过。

## 资源版本与分发

当前原型锁定：

- `v86` npm 版本 `0.5.424`；
- `@xterm/xterm` 版本 `6.0.0`；
- BIOS URL 固定到 v86 提交 `2f1346b`；
- Buildroot 探针上游 URL 为 `https://i.copy.sh/buildroot-bzimage.bin`。

应用通过 `/api/probe-kernel` 请求 5,166,352-byte 探针。本地由 Vite proxy 转发；Vercel 使用只允许 GET/HEAD、上游 URL 写死的流式 Function，并为成功响应设置 CDN 缓存。该线上路径已返回 200，并在前端完成大小/SHA 校验后真实启动来宾。前端先完整下载字节，用 Web Crypto 对大小及 SHA-256 `7befbaea31e249d9a518c4b95fa42b2a193d0e3de46250d617cbdeb866ee28b0` 做 fail-closed 校验，再把 `ArrayBuffer` 传入 v86。

这个哈希证明“收到的字节符合当前记录”，不证明上游 URL 不可变，也不提供再分发许可。代理流量仍可能构成分发行为；在对应 Buildroot 配置、源码、SBOM、许可证和 `legal-info` 收齐前，探针不能用于 Production。

正式镜像架构应为：

```text
固定 Buildroot 版本 + 仓库内 defconfig/补丁/构建脚本
  -> 可重复构建的 x86 来宾产物
  -> 启动与命令清单测试
  -> SHA-256 + SBOM + make legal-info + 人工许可证复核
  -> 不可变版本的 Release 资产
  -> assets-manifest.json 固定 URL 与哈希
```

大镜像不进入 Git 历史。当前固定目标 Function 只是技术探针的同源传输方案，并非正式资产架构，也不能扩展为用户可控的通用代理。正式选定的 Release/CDN 来源必须同时通过浏览器 CORS、需要时的 Range、完整性、实际启动和许可验证。

## 安装模型

V1 的“装系统”是教学式安装：用户选择一个已经构建并验证的镜像配置，前端生成版本化安装配置，首次启动时安全地传入来宾。它不声称完成 ISO 安装。

当前安装模型把 `InstallationProfile` 写入 IndexedDB，包含 schema 版本、安装 ID、镜像类型、用户名、hostname、时区和运行时元数据。本地浏览器已走完六步安装，并验证配置状态从安装流程联动到真实来宾健康检查后的 `ready`。这证明了前端状态链路，不证明这些字段已经安全注入正式来宾。正式配置注入仍需满足：

- 浏览器端和来宾端双重校验；
- 结构化解析，不拼接用户输入到 Shell，也不使用 `eval`；
- 一次性初始化信息使用后删除；
- 只有检测到真实来宾就绪后才能标记系统可用。

## ADR-0001：持久化方案尚未定案

状态：**暂定探针，未接受为生产设计**。

当前代码采用 `v86.save_state()` 生成 `ArrayBuffer`，在发送 `sync`、暂停模拟器后写入 IndexedDB；恢复时调用 `restore_state()`。本地浏览器已验证一次“创建文件 -> 保存 -> 关闭虚拟机 -> 从 IndexedDB 恢复 -> 文件仍存在”。这证明候选方案能完成核心探针流程，但不是最终持久化结论。

尚未满足的生产要求包括：

- 两代快照、写后校验和原子切换；
- 最近一个已知可恢复版本；
- 配置指纹升级时的迁移提示和旧快照清理流程；
- Web Locks 或 BroadcastChannel 单写实例锁；
- 自动保存、检查点、导入、导出和配额错误恢复；
- IndexedDB 与 OPFS、稀疏磁盘增量方案的实测比较；
- 浏览器崩溃和下载中断测试。

因此最终 ADR 要等启动、保存、恢复耗时、数据可靠性、存储占用和浏览器兼容性都有证据后再定。详见 [feasibility-spike.md](feasibility-spike.md)。

## 隐私与安全边界

- 用户终端输入和命令历史不应发送到 Vercel、GitHub 或分析服务；
- 当前产品不提供任意公网 TCP 访问；未来联网功能需要独立代理、安全评审和成本评估；
- 所有 `VITE_` 环境变量均视为公开信息；
- 来宾执行不等于浏览器安全边界已经自动成立，仍需限制资源来源、可点击链接和资产完整性；
- 清理站点数据会删除本地安装和快照，UI 必须提前提示。

## CI 与部署职责

- GitHub Actions：安装锁定依赖、typecheck、lint、测试和 production build；
- Vercel Git Integration：分支/PR Preview 和 `main` Production；
- 来宾镜像发布：独立、受控的发布流程，不能由普通前端 PR 静默替换。

当前 CI 不部署，也尚未包含依赖固定小镜像的浏览器 e2e。只有在小型测试镜像的来源、哈希和许可材料确定后，才能把核心来宾 e2e 加为稳定门禁。
