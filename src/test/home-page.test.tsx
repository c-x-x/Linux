import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import HomePage from '../pages/HomePage'

vi.mock('../features/installation/useInstallation', () => ({
  useInstallation: () => ({
    installation: null,
    loading: false,
    refresh: vi.fn(),
  }),
}))

describe('HomePage', () => {
  it('presents the two learning paths and an honest not-installed state', () => {
    render(<HomePage />)

    expect(
      screen.getByRole('heading', { level: 1, name: /把 Linux 拆开/ }),
    ).toBeInTheDocument()
    expect(
      screen.getByText(/每条输出都来自来宾系统，不靠前端伪造/),
    ).toBeInTheDocument()
    expect(screen.getByText('尚未安装')).toBeInTheDocument()

    expect(screen.getByRole('link', { name: /开始装系统/ })).toHaveAttribute(
      'href',
      '/install',
    )
    expect(
      screen.getByRole('link', { name: '打开命令行实验室' }),
    ).toHaveAttribute('href', '/lab')
    expect(screen.getByRole('heading', { name: '装系统' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: '使用系统' })).toBeInTheDocument()
  })
})
