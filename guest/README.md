# 来宾镜像构建与发布要求

> 当前目录**不包含可分发来宾镜像，也没有已完成的镜像构建脚本**。当前应用通过 `/api/probe-kernel` 使用一个远程 Phase 0 技术探针；它的生产合规材料未收齐，禁止复制到仓库、部署到 Production 或作为本项目 GitHub Release 发布。

当前探针为 5,166,352 bytes，记录的 SHA-256 是 `7befbaea31e249d9a518c4b95fa42b2a193d0e3de46250d617cbdeb866ee28b0`。本地浏览器已在下载后用 Web Crypto 验证大小和哈希，并启动 Linux 5.6.15 i686/BusyBox。该证据只说明字节完整且可运行，不说明来源不可变或本项目已经满足再分发义务。

正式版必须由本项目自行构建固定版本的 Buildroot x86 镜像，并能从干净环境重复构建。仅仅“可以启动”不足以发布。

## 正式构建需要纳入版本控制的材料

未来实现时至少应提交：

- 固定的 Buildroot 版本和上游源码校验值；
- `BR2_EXTERNAL` 项目、defconfig、内核配置、rootfs overlay 和补丁；
- 固定工具链/容器环境说明；
- 首次启动的结构化配置解析程序；
- 来宾自测和命令清单生成脚本；
- 构建产物清单格式与版本规则；
- 许可证复核流程。

不得依赖未固定版本的 `latest` URL，也不得在缺包时静默跳过。依赖、内核配置或补丁变化必须使镜像版本和资产清单同步变化。

## 预期构建流程

正式脚本尚未创建；以下只是实现时必须封装和验证的流程，不是当前可直接执行的完成命令：

1. 在固定的 Linux 构建环境中取得指定 Buildroot 版本并校验上游源码；
2. 应用仓库内 defconfig、overlay 和补丁；
3. 预下载并保存所有可再获取的源码输入；
4. 在干净目录完成构建，任何依赖缺失立即失败；
5. 启动产物并执行来宾自测；
6. 生成命令清单、包清单、SHA-256 和 SBOM；
7. 在同一配置上运行 Buildroot 的 `make legal-info`；
8. 人工检查许可证、版权、源码提供和工具链例外；
9. 只有全部门禁通过后，生成不可变版本的 Release 资产和清单。

Buildroot 实现通常会包含类似 `make <项目_defconfig>`、`make source`、`make` 和 `make legal-info` 的阶段，但准确命令必须等仓库实际 defconfig/`BR2_EXTERNAL` 路径落地后写入脚本，不能在这里虚构一个可运行目标。

## `make legal-info` 不是自动许可证批准

`make legal-info` 是必需产物，但不能单独证明合规。发布者还必须检查：

- 未被 Buildroot 自动完整识别的包或自定义源码；
- Linux、BusyBox、工具链及其他 GPL 组件的对应源码提供方式；
- 补丁、构建脚本和配置是否足以重新生成发布二进制；
- 固件、字体、手册和课程素材是否允许再分发；
- 每个资产版本是否能追溯到确切源码和版权声明。

如果任一来源或再分发权不清楚，停止发布，不得把技术探针转成生产资产。

## 正式产物清单

每个版本至少应产生并关联：

- 带版本和架构的启动镜像，例如 `kernel-lab-core-1.0.0-x86.*`；
- `SHA256SUMS`；
- 机器可读资产清单，包含大小、哈希、镜像 ID、架构、v86 兼容范围和下载 URL；
- Buildroot defconfig、内核配置、补丁和构建日志摘要；
- 包清单与 `command-manifest.json`；
- SBOM；
- `legal-info` 输出、许可证文本、版权声明和对应源码获取说明；
- 来宾启动与功能测试结果。

`public/assets-manifest.json` 当前有一个 `technical-probe-only` 条目，它不是正式发布条目。只有上述产物存在且 URL、CORS、Range、哈希、浏览器启动和许可证全部验证后，才能添加 `production` 条目。

## 来宾功能门禁

Core 正式镜像至少需要验证：

- 启动到普通用户的 Bash 提示符，而不是默认 root Shell；
- Readline 和 bash-completion 的命令/文件补全；
- 文件、权限、进程、管道、重定向、信号、作业控制和退出码；
- `man`/help 入口和命令清单生成；
- `lab-help`、`lab-check`、`lab-reset` 的退出码；
- C 程序编译运行，以及 `file`、`readelf`、`objdump`、`gdb`、`strace` 的代表性实验；
- 保存、恢复、刷新和重置后的数据一致性；
- 镜像内部版本与前端资产清单一致。

Embedded 镜像是后续阶段，必须独立构建和验收，不能只在 UI 中解锁一个尚不存在的选项。

## 发布位置

大镜像不得进入 Git 历史或 Vercel 静态输出。当前 Vite proxy / 固定目标 Vercel Function 只为技术探针解决同源加载：代理远程字节不等于取得再分发权，新 Function 路径也尚未在 Preview 实测，因此禁止用于 Production。正式镜像应使用经许可审核的独立 Release/CDN 资产，而不是长期消耗 Function 流量。

正式候选方案是 GitHub Release 的不可变版本资产；发布前必须从浏览器实际验证 CORS、需要时的 Range、内容长度、哈希和 v86 启动，并完成许可证/源码提供审查。如果 Release 资产不满足要求，应先记录失败证据并评估其他零成本静态来源，不能静默改用 Vercel 承载。
