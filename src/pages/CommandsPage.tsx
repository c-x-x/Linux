import { useMemo, useState } from 'react'
import {
  AlertTriangle,
  Check,
  ChevronDown,
  Clipboard,
  Command,
  Filter,
  Search,
  ShieldCheck,
} from 'lucide-react'
import { commandDocs, type CommandCategory } from '../content/commands'

const categories = Array.from(
  new Set(commandDocs.map((command) => command.category)),
) as CommandCategory[]

const dangerCopy = {
  safe: '只读 / 低风险',
  caution: '会修改状态',
  dangerous: '高风险',
} as const

export default function CommandsPage() {
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState<'全部' | CommandCategory>('全部')
  const [expanded, setExpanded] = useState<string | null>('ls')
  const [copied, setCopied] = useState<string | null>(null)

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase()
    return commandDocs.filter((command) => {
      const categoryMatches =
        category === '全部' || command.category === category
      const queryMatches =
        !normalized ||
        command.name.includes(normalized) ||
        command.category.toLowerCase().includes(normalized) ||
        command.summary.toLowerCase().includes(normalized) ||
        command.syntax.some((syntax) => syntax.toLowerCase().includes(normalized)) ||
        command.examples.some((example) =>
          `${example.command} ${example.description}`.toLowerCase().includes(normalized),
        )
      return categoryMatches && queryMatches
    })
  }, [category, query])

  async function copy(value: string) {
    await navigator.clipboard.writeText(value)
    setCopied(value)
    window.setTimeout(() => setCopied(null), 1_400)
  }

  return (
    <div className="page commands-page">
      <header className="page-heading page-heading--commands">
        <div>
          <span className="section-kicker">COMMAND REFERENCE</span>
          <h1>Linux 命令库</h1>
          <p>
            {commandDocs.length} 条常用命令，覆盖 Shell、文件、文本、用户权限、进程、磁盘、网络、软件包与服务。
            示例会注明风险，具体选项以所用发行版为准。
          </p>
        </div>
        <div className="page-heading__count">
          <strong>{commandDocs.length}</strong>
          <span>已收录命令</span>
        </div>
      </header>

      <div className="notice notice--warning command-verification-note">
        <AlertTriangle size={18} />
        <span>
          Linux 发行版和工具实现不同，同一命令的选项可能有差异。命令库说明通用用途；
          运行前可先使用 <code>command -v 名称</code> 检查当前环境。
        </span>
      </div>

      <section className="command-toolbar" aria-label="筛选命令">
        <label className="search-field">
          <Search size={18} />
          <span className="sr-only">搜索命令</span>
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="搜索名称、用途或语法…"
          />
          {query && (
            <button type="button" onClick={() => setQuery('')}>
              清除
            </button>
          )}
        </label>
        <label className="category-select">
          <Filter size={16} />
          <span className="sr-only">命令分类</span>
          <select
            value={category}
            onChange={(event) =>
              setCategory(event.target.value as '全部' | CommandCategory)
            }
          >
            <option value="全部">全部分类</option>
            {categories.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </label>
        <span className="command-toolbar__result">显示 {filtered.length} 条</span>
      </section>

      {filtered.length ? (
        <div className="command-list">
          {filtered.map((command) => {
            const open = expanded === command.name
            return (
              <article
                className={open ? 'command-card command-card--open' : 'command-card'}
                key={command.name}
              >
                <button
                  className="command-card__summary"
                  type="button"
                  aria-expanded={open}
                  onClick={() => setExpanded(open ? null : command.name)}
                >
                  <span className="command-card__prompt" aria-hidden="true">
                    $
                  </span>
                  <span className="command-card__name">
                    <code>{command.name}</code>
                    <small>{command.category}</small>
                  </span>
                  <span className="command-card__description">{command.summary}</span>
                  <span className={'risk-badge risk-badge--' + command.dangerLevel}>
                    {dangerCopy[command.dangerLevel]}
                  </span>
                  <span className="verification-badge">
                    <AlertTriangle size={13} /> 环境相关
                  </span>
                  <ChevronDown className="command-card__chevron" size={18} />
                </button>

                {open && (
                  <div className="command-card__details">
                    <div>
                      <h3>语法</h3>
                      <div className="syntax-stack">
                        {command.syntax.map((syntax) => (
                          <code key={syntax}>{syntax}</code>
                        ))}
                      </div>
                    </div>
                    <div>
                      <h3>真实练习示例</h3>
                      <div className="example-stack">
                        {command.examples.map((example) => (
                          <div key={example.command}>
                            <button
                              type="button"
                              onClick={() => void copy(example.command)}
                              aria-label={'复制命令：' + example.command}
                            >
                              <code>{example.command}</code>
                              {copied === example.command ? (
                                <Check size={15} />
                              ) : (
                                <Clipboard size={15} />
                              )}
                            </button>
                            <p>{example.description}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="command-card__meta">
                      <span>
                        <Command size={15} /> 帮助入口 <code>{command.helpCommand}</code>
                      </span>
                      <span>
                        <ShieldCheck size={15} /> {command.verificationNote}
                      </span>
                    </div>
                  </div>
                )}
              </article>
            )
          })}
        </div>
      ) : (
        <div className="empty-state">
          <Search size={28} />
          <h2>没有匹配的命令</h2>
          <p>换一个关键词，或把分类切回“全部分类”。</p>
        </div>
      )}
    </div>
  )
}
