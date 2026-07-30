# Phase 0 技术可行性记录

记录日期：2026-07-30
结论：**本地技术探针已通过多项关键运行检查，但 Phase 0 总门禁仍未通过。** 不能把当前结果描述为“正式 Bash 环境已完成”或“可部署 Production”。

本文区分三类证据：源码/API 与 HTTP 静态证据、本地 Codex 内置 Chromium 运行证据、尚未取得的 Vercel Preview/正式镜像证据。

## 探针版本与资产

| 项目 | 当前值 | 证据状态 |
| --- | --- | --- |
| 前端 | React 19.2.8、Vite 8.1.5、TypeScript 6.0.3 | Production build 已成功 |
| v86 | npm `0.5.424`（包元数据对应提交系列 `2f1346b`） | 已检查本地包/API，并在本地浏览器实际启动来宾 |
| xterm.js | `@xterm/xterm` 6.0.0、`@xterm/addon-fit` 0.11.0 | 串口输入输出已在本地浏览器验证 |
| BIOS | jsDelivr 上固定到 v86 提交 `2f1346b` 的 SeaBIOS/VGA BIOS | 本地浏览器加载通过 |
| 测试内核 | 上游 `https://i.copy.sh/buildroot-bzimage.bin`，应用路径 `/probe-assets/buildroot-bzimage.bin` | 仅远程技术探针；不是生产镜像 |
| 测试内核大小 | 5,166,352 bytes | 清单记录并由前端下载后校验 |
| 测试内核 SHA-256 | `7befbaea31e249d9a518c4b95fa42b2a193d0e3de46250d617cbdeb866ee28b0` | Web Crypto 校验通过；不代表来源/许可已验证 |
| 来宾 | Linux 5.6.15、i686、BusyBox Shell | 本地真实串口输出与动态命令结果 |
| 浏览器 | Codex 内置 Chromium | 实测通过；精确 Chromium 版本尚未记录 |

配置给来宾的内存是 64 MiB，VGA 内存是 8 MiB。它们是配置值，不是浏览器峰值内存；目前没有峰值内存测量。

## 资产加载和完整性链路

当前浏览器请求同源路径 `/probe-assets/buildroot-bzimage.bin`：本地由 Vite proxy 转发，上线配置拟由 Vercel external rewrite 转发。前端读取完整响应后检查字节数，再使用 Web Crypto 计算 SHA-256；任一不匹配都会阻止 v86 启动。

本地链路已验证，Vercel rewrite 尚未实际部署。校验只能证明下载字节与清单一致，不能证明上游 URL 不可变，也不等于取得重新分发 Linux/BusyBox/Buildroot 产物的权利。

## 本地 Chromium 运行证据

- Linux 5.6.15 i686/BusyBox 启动后，来宾健康挑战返回 `__KERNEL_LAB_HEALTH_Linux__`；
- `uname -m` 动态返回 `i686`；
- `false` 的来宾退出码为 `1`；
- 输入 `una` 后按 Tab，由 BusyBox Shell 补全为 `uname`；
- `↑` 可取回历史命令；
- Ctrl+C 能回到 Shell 提示符；
- 创建文件后保存 IndexedDB 快照、关闭虚拟机、恢复快照，文件仍存在；
- 完整六步安装流程可把安装配置联动到真实来宾健康检查后的 `ready`；
- `/`、`/install`、`/lab`、`/commands`、`/courses`、`/about` 静态检查无控制台错误；
- 390×844 视口下页面无横向溢出。

上述命令结果来自真实来宾串口，不是前端硬编码输出。Tab 证据属于 BusyBox Shell，**不是 Bash/Readline/bash-completion 证据**。

## 规格第 18 节逐项结果

| # | 验证项 | 状态 | 当前证据 / 下一步 |
| --- | --- | --- | --- |
| 1 | React + Vite production build 能加载 v86 | 部分通过 | Production build 成功，本地 Vite 浏览器运行 v86 成功；仍需用构建产物 Preview/静态预览确认运行链路 |
| 2 | 最小 Linux 镜像在桌面 Chromium 启动 | 通过（本地探针） | Codex 内置 Chromium 启动 Linux 5.6.15 i686/BusyBox；精确浏览器版本待登记 |
| 3 | xterm.js 与来宾串口双向通信 | 通过（本地探针） | 健康挑战和交互命令均从串口返回 |
| 4 | Bash 提示符正常出现 | 未满足 | 当前是 BusyBox Shell；正式自建镜像必须加入 Bash/Readline |
| 5 | Tab 命令和文件补全 | 部分通过 | BusyBox 中 `una` + Tab -> `uname`；Bash 命令补全和文件补全尚未验证 |
| 6 | Ctrl+C、方向键和 resize | 部分通过 | Ctrl+C、`↑` 历史通过；终端 resize 行为尚未单独记录，390×844 页面布局无横向溢出 |
| 7 | `printf`、管道、重定向和退出码真实 | 部分通过 | 健康 `printf`、动态 `uname` 和 `false` 退出码 1 已验证；管道和重定向仍需单独记录 |
| 8 | 文件刷新后仍存在 | 通过（探针流程） | 文件在保存、关闭并从 IndexedDB 恢复后存在；完整页面刷新场景仍应加入自动化回归 |
| 9 | 保存与恢复不损坏来宾 | 通过一次（非可靠性结论） | 单次快照关闭/恢复成功；仍需循环、崩溃、配额和版本迁移测试 |
| 10 | 镜像来源 CORS/Range | 部分通过 | 当前小型探针已通过本地同源 proxy 完整下载及大小/SHA 校验；该具体上游文件的独立 Range 记录和 Vercel rewrite 仍待补充 |
| 11 | Vercel Preview 能启动 | 未验证 | 尚无 Preview URL 或在线启动证据；这是总门禁阻塞项 |
| 12 | 无痕、存储拒绝、配额不足、下载中断 | 未验证 | 需实现/验证明确失败和恢复行为 |

## 其他 UI 验证

| 项目 | 状态 | 证据 |
| --- | --- | --- |
| 六步教学安装 | 通过（本地） | 配置完成后进入 configured，真实健康挑战后进入 ready |
| 静态路由 | 通过（本地） | 六个路由无控制台错误 |
| 窄屏基本布局 | 通过（本地单一视口） | 390×844 无页面横向溢出；不代表完整移动浏览器兼容矩阵 |

## 性能和可靠性数据

| 指标 | 结果 |
| --- | --- |
| 技术探针下载大小 | 5,166,352 bytes |
| 首次下载耗时 | 未测量 |
| 冷启动到 Shell | 未测量 |
| 保存耗时 | 未测量 |
| 恢复耗时 | 未测量 |
| 快照大小 | 未测量 |
| 浏览器峰值内存 | 未测量 |
| 重复保存/恢复成功率 | 仅 1 次通过，不足以统计 |

不得用配置的 64 MiB 来宾内存替代浏览器总内存测量。后者还包括 v86、WASM、页面、xterm 缓冲、探针字节和保存时的状态副本。

## 持久化决策

**尚未定案。** 当前候选“v86 状态快照 + IndexedDB”已经证明一次核心保存/关闭/恢复流程可行。它目前只有一个 `current` 快照，尚未实现两代数据、写后校验、原子指针切换、单标签写锁和导入导出，因此不能称为崩溃安全持久化。

在作出最终决定前，需要把它和“远程只读基础镜像 + 本地稀疏写时复制增量”按启动时间、保存/恢复时间、快照大小、写放大、浏览器兼容性、损坏恢复和版本迁移进行实测比较。

## 镜像合规阻塞项

当前清单登记的 SHA-256 只用于完整性校验。探针仍缺少与本项目发布相匹配的：

- 固定 Buildroot 配置和完整构建脚本；
- 对应源码归档或可持续的源码提供方案；
- SBOM、版权声明和许可证集合；
- `make legal-info` 输出及人工复核记录；
- 本项目获得或满足再分发权的证据。

本地 Vite proxy 或 Vercel external rewrite 不会自动补齐这些权利。探针只能用于开发验证，禁止 Production、镜像到本仓库或作为本项目 Release 资产发布。正式版必须自建固定 Buildroot，执行 `make legal-info` 并完成 [来宾镜像发布清单](../guest/README.md)。

## Phase 0 退出条件

仍需附上 Vercel Preview URL 和在线启动证据、精确浏览器版本、耗时/内存，以及所有未通过项的可复查日志。至少以下核心项未通过时，不得宣布 Phase 0 完成：

1. 正式自建镜像中的 Bash/Readline 命令与文件 Tab 补全；
2. 多轮、可恢复且具备故障处理的持久化；
3. Vercel Preview 中真实 Linux 正常启动；
4. 镜像构建和再分发合规材料完整。

当前可以宣传“本地浏览器已运行真实 Linux/BusyBox 技术探针”，不能宣传“完整真实 Bash 学习环境已经完成”。
