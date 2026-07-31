# Linux 学习站交互与可读性修复实施计划

> **执行要求：** 按任务顺序实施，每个行为变更先写失败测试，再写最小实现；每项完成后运行对应测试并提交独立 commit。

**目标：** 修复命令行课程不可点击问题，使课程、伴学提示和终端练习联动；提高全站提示文字可读性；通过系统 QA 修复同类流程和交互缺陷。

**架构：** 继续使用 React + 浏览器内模拟器的纯前端架构。课程页和实验室共用 `courseLessons`，实验室只保存当前课程及待填入终端的命令，不复制课程文案。URL 使用 `?lesson=<id>` 建立实验室与完整课程页的稳定深链接。终端通过显式 props 接收待填命令，避免 DOM 注入。

**技术栈：** React 19、TypeScript、Vite、Vitest、Testing Library、xterm.js、Playwright、Vercel。

---

## 任务 1：建立实验室课程伴学的数据契约

**文件：**

- 新建：`src/content/labLessons.ts`
- 新建：`src/test/lab-lessons.test.ts`
- 读取：`src/content/courses.ts`

### 1.1 先写失败测试

覆盖：

- 每个实验室课程条目都能映射到 `courseLessons` 中稳定的课程 ID。
- 每课至少包含一个目标、用途说明、完成条件。
- 终端练习课提供 1–4 条可执行建议命令；纯导学课可以从其学习步骤中提取安全的观察命令。
- 所有命令都来自课程数据，不在页面中维护第二份静态数组。

运行：

```bash
npm test -- src/test/lab-lessons.test.ts
```

预期：模块不存在或契约未实现，测试失败。

### 1.2 编写最小实现

在 `labLessons.ts` 中导出：

- `labLessons`：从 `courseLessons` 派生的伴学课程数组。
- `findLabLesson(id)`：有效 ID 返回课程，无效 ID 回退第一课。
- 每项包含 `id`、`title`、`summary`、`objective`、`commands`、`completion`、`fullLessonId` 和必要的边界说明。

### 1.3 验证并提交

```bash
npm test -- src/test/lab-lessons.test.ts
git add src/content/labLessons.ts src/test/lab-lessons.test.ts
git commit -m "feat: derive terminal coaching from courses"
```

## 任务 2：让命令行页课程可选择并同步伴学内容

**文件：**

- 修改：`src/pages/LabPage.tsx`
- 新建：`src/test/lab-page.test.tsx`
- 修改：`src/styles.css`

### 2.1 先写失败测试

在测试中模拟已完成的 Ubuntu 安装配置，并 mock xterm 终端组件。覆盖：

- 课程列表项具有 button 语义，不再是静态 `li`。
- 默认课程具有当前状态。
- 点击“Shell、路径、帮助与 Tab 补全”后，右侧目标、用途、完成条件和推荐命令同步变化。
- 课程切换不会卸载终端组件。
- “打开完整课程”链接包含正确的 `?lesson=` 参数。
- 键盘激活按钮与鼠标点击结果一致。

运行：

```bash
npm test -- src/test/lab-page.test.tsx
```

预期：找不到课程按钮，测试失败。

### 2.2 实现页面状态和语义

- 用 `labLessons` 替换 `LabPage` 内静态课程数组和 `starterCommands`。
- 使用 `activeLessonId` 保存选择；从有效 `?lesson=` 参数初始化。
- 把课程项渲染为原生按钮，添加选中样式、`aria-current` 和清晰的可访问名称。
- 右侧渲染当前课程的目标、用途、命令、完成条件和边界说明。
- 保持 `TerminalPane` / `SimulatedTerminalPane` 位于稳定的组件位置，切换课程不重置终端。
- 完整课程链接指向 `/courses?lesson=<id>`。

### 2.3 补充交互样式

- 为课程按钮增加完整点击区域、hover、focus-visible 和选中状态。
- 保持现有三栏布局；窄屏下课程和伴学区按现有响应式顺序堆叠。

### 2.4 验证并提交

```bash
npm test -- src/test/lab-page.test.tsx
npm run typecheck
git add src/pages/LabPage.tsx src/test/lab-page.test.tsx src/styles.css
git commit -m "fix: make terminal lessons interactive"
```

## 任务 3：实现“填入终端”，但不自动执行

**文件：**

- 修改：`src/pages/LabPage.tsx`
- 修改：`src/features/terminal/SimulatedTerminalPane.tsx`
- 修改：`src/features/terminal/TerminalPane.tsx`
- 修改：`src/test/lab-page.test.tsx`
- 新建：`src/test/simulated-terminal-pane.test.tsx`

### 3.1 先写失败测试

覆盖：

- 点击建议命令后，模拟终端输入行出现完整命令，但没有产生执行结果。
- 填入第二条命令会替换当前建议草稿，不会追加到旧草稿后。
- 命令被终端接收后，页面清除一次性请求，避免重渲染重复填入。
- 真实终端未启动时按钮显示“先启动终端”或禁用说明；Shell ready 后才允许发送草稿。

运行：

```bash
npm test -- src/test/lab-page.test.tsx src/test/simulated-terminal-pane.test.tsx
```

预期：终端组件没有草稿接口，测试失败。

### 3.2 添加显式草稿接口

为两个终端组件增加：

```ts
type CommandDraftProps = {
  commandDraft?: string | null
  onCommandDraftConsumed?: () => void
}
```

- 模拟终端复用内部 `replaceLine`，更新 xterm 显示和 `lineRef`，不调用执行器。
- 真实终端只在运行时 ready 时向串口发送命令字符，不发送回车。
- 消费成功后调用回调；不可用时不吞掉请求并给页面明确反馈。
- 课程切换不自动填入命令。

### 3.3 更新伴学按钮

- 主操作改为“填入终端”。
- 提供独立复制按钮或复制反馈，避免一个按钮同时承担两个含义。
- 加入 `aria-live` 状态提示，例如“命令已填入，按 Enter 执行”。

### 3.4 验证并提交

```bash
npm test -- src/test/lab-page.test.tsx src/test/simulated-terminal-pane.test.tsx
npm run typecheck
git add src/pages/LabPage.tsx src/features/terminal/SimulatedTerminalPane.tsx src/features/terminal/TerminalPane.tsx src/test/lab-page.test.tsx src/test/simulated-terminal-pane.test.tsx
git commit -m "feat: fill coached commands into terminal"
```

## 任务 4：让完整课程页支持深链接和可恢复导航

**文件：**

- 修改：`src/pages/CoursesPage.tsx`
- 修改：`src/test/courses-page.test.tsx`

### 4.1 先写失败测试

覆盖：

- `/courses?lesson=shell-foundations` 首次打开即显示对应课程。
- 无效课程 ID 安全回退第一课。
- 点击课程目录、上一课、下一课后 URL 参数同步更新。
- `popstate` 导航后课程内容恢复。
- 既有课程进度保存测试继续通过。

运行：

```bash
npm test -- src/test/courses-page.test.tsx
```

预期：页面始终打开第一课，测试失败。

### 4.2 实现 URL 同步

- 用纯函数解析 `window.location.search`，仅接受 `courseLessons` 中存在的 ID。
- 所有课程切换统一经过 `selectLesson(id)`，通过 History API 更新 URL。
- 监听 `popstate`，支持浏览器前进/后退。
- 保持查询参数变化不触发整页刷新，不丢失本地进度。

### 4.3 验证并提交

```bash
npm test -- src/test/courses-page.test.tsx
npm run typecheck
git add src/pages/CoursesPage.tsx src/test/courses-page.test.tsx
git commit -m "feat: deep link Linux lessons"
```

## 任务 5：统一提高六个主要页面的提示文字可读性

**文件：**

- 修改：`src/styles.css`
- 新建：`tests/e2e/readability.spec.ts`

### 5.1 先写失败的浏览器测试

为 `/`、`/install`、`/lab`、`/commands`、`/courses`、`/about` 建立可见辅助文字抽样清单，读取 computed style 并断言：

- 正文、课程说明和学习提示不低于 13px。
- 命令说明、结果、表单帮助和安装解释不低于 12px。
- 标签、状态、元数据和快捷键说明不低于 11px。

另外断言课程按钮和命令按钮具有可见焦点，移动视口无横向页面溢出。

运行：

```bash
npm run build
npm run test:e2e -- tests/e2e/readability.spec.ts
```

预期：当前多处 7–10px 样式触发失败。

### 5.2 调整设计令牌和组件字号

- 在 `:root` 中增加辅助文字字号变量，逐类替换零散的 7–10px 值。
- 优先修复实验室课程、coach、命令建议、快捷键和边界说明。
- 同步修复首页卡片、安装步骤/表单帮助、命令卡片、课程标签和关于页说明。
- 不无差别放大标题；通过间距、换行和网格最小宽度消化字号变化。
- 为交互控件补齐最小高度和 `:focus-visible`。

### 5.3 桌面和移动验证

```bash
npm run build
npm run test:e2e -- tests/e2e/readability.spec.ts
```

预期：所有字号、焦点和溢出断言通过。

### 5.4 提交

```bash
git add src/styles.css tests/e2e/readability.spec.ts
git commit -m "fix: improve learning text readability"
```

## 任务 6：系统 QA 安装、命令库、课程和路由状态

**文件：**

- 新建：`tests/e2e/learning-flows.spec.ts`
- 可能修改：`src/pages/InstallPage.tsx`
- 可能修改：`src/pages/CommandsPage.tsx`
- 可能修改：`src/App.tsx`
- 可能修改：与复现缺陷直接相关的组件或测试文件

### 6.1 先建立关键流程测试

覆盖：

- Ubuntu 与 Debian 安装流程能够前进、返回、保存并进入实验室。
- 必填网络/身份字段的错误提示可见，不能静默卡住。
- 命令库搜索、分类、展开、复制和空结果恢复。
- 课程选择、任务完成、进度保存和刷新恢复。
- 路由懒加载期间显示 `RouteLoader`，而不是空白页面。
- 页面中标示为可操作的元素均有 button/link 语义。

### 6.2 对每个新缺陷执行最小修复

每发现一个问题：

1. 记录精确复现路径。
2. 增加单元测试或 Playwright 断言使其稳定失败。
3. 修复根因，不只隐藏症状。
4. 运行相关测试及回归测试。

如果懒加载本身正常，则只保留加载状态回归测试；只有确认 chunk 加载失败无法恢复时，才增加错误边界和重试入口。

### 6.3 提交已确认的 QA 修复

```bash
npm test
npm run test:e2e -- tests/e2e/learning-flows.spec.ts
git add src tests/e2e
git commit -m "fix: repair Linux learning flows"
```

## 任务 7：完整验证、线上发布与生产验收

**文件：**

- 仅在验证发现问题时修改相关文件。

### 7.1 运行完整质量门

```bash
npm run lint
npm run typecheck
npm test
npm run build
npm run test:e2e
git diff --check
git status --short
```

所有命令必须以最新代码重新运行，不能使用旧输出作为完成证据。

### 7.2 本地浏览器验收

逐页检查：

- 首页导航与提示。
- Ubuntu、Debian 两条教学安装路径。
- 实验室课程选择、提示联动、命令填入、Tab 和历史。
- 命令库搜索、展开和复制。
- 完整课程深链接、前进/后退和进度。
- 关于页、移动布局、控制台错误。

### 7.3 发布

- 确认工作树仅包含本计划改动。
- 推送 `master` 到 GitHub，让已连接的 Vercel 项目触发 Production 部署。
- 查看部署状态和构建日志，确认 Production Deployment 已绑定 `linux.cxx.pub` 与 `kernel-lab-linux.vercel.app`。

### 7.4 生产验收

在 `https://linux.cxx.pub` 重新执行关键浏览器路径，确认：

- 新 commit 已上线。
- 自定义域名可访问且无旧的 No Deployment 状态。
- 课程可点击、提示字号达标、流程可推进。
- 控制台没有新增错误。

如生产与本地结果不同，先记录部署 ID 和线上证据，再诊断缓存、构建或路由问题。
