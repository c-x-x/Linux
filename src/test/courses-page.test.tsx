import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import CoursesPage from '../pages/CoursesPage'
import { writeCourseProgress } from '../features/installation/model'

vi.mock('../features/installation/model', () => ({
  readCourseProgress: vi.fn().mockResolvedValue([]),
  writeCourseProgress: vi.fn().mockResolvedValue(undefined),
}))

describe('CoursesPage progression', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    window.history.replaceState(null, '', '/courses')
  })

  it('completes the active lesson, persists it and advances to the next lesson', async () => {
    const user = userEvent.setup()
    render(<CoursesPage />)

    expect(screen.getByRole('heading', { name: 'Linux 是什么，企业为什么使用它' })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /完成本课并进入下一课/ }))

    expect(screen.getByRole('heading', { name: '发行版地图：Ubuntu、Debian 与嵌入式方案' })).toBeInTheDocument()
    expect(writeCourseProgress).toHaveBeenCalledWith(expect.objectContaining({
      lessonId: 'linux-overview',
      completed: true,
      completedSteps: ['map-stack', 'inspect-system', 'enterprise-map'],
    }))
    expect(window.location.search).toBe('?lesson=distributions')
  })

  it('opens a valid lesson from the URL and safely ignores an invalid lesson', () => {
    window.history.replaceState(null, '', '/courses?lesson=shell-foundations')
    const { unmount } = render(<CoursesPage />)
    expect(screen.getByRole('heading', { name: 'Shell、路径、帮助与 Tab 补全' })).toBeInTheDocument()
    unmount()

    window.history.replaceState(null, '', '/courses?lesson=missing')
    render(<CoursesPage />)
    expect(screen.getByRole('heading', { name: 'Linux 是什么，企业为什么使用它' })).toBeInTheDocument()
  })

  it('keeps course selection in sync with browser navigation', async () => {
    const user = userEvent.setup()
    render(<CoursesPage />)

    await user.click(screen.getByRole('button', { name: /文件、目录、链接与权限/ }))
    expect(window.location.search).toBe('?lesson=files-permissions')
    expect(screen.getByRole('heading', { name: '文件、目录、链接与权限' })).toBeInTheDocument()

    window.history.pushState(null, '', '/courses?lesson=network-ssh')
    act(() => window.dispatchEvent(new PopStateEvent('popstate')))
    expect(screen.getByRole('heading', { name: '网络、DNS、端口、HTTP 与 SSH' })).toBeInTheDocument()
  })
})
