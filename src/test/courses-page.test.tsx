import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import CoursesPage from '../pages/CoursesPage'
import { writeCourseProgress } from '../features/installation/model'

vi.mock('../features/installation/model', () => ({
  readCourseProgress: vi.fn().mockResolvedValue([]),
  writeCourseProgress: vi.fn().mockResolvedValue(undefined),
}))

describe('CoursesPage progression', () => {
  beforeEach(() => vi.clearAllMocks())

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
  })
})
