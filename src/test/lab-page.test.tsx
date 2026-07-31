import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import LabPage from '../pages/LabPage'

vi.mock('../features/installation/useInstallation', () => ({
  useInstallation: () => ({
    loading: false,
    installation: {
      schemaVersion: 1,
      installationId: 'test-installation',
      status: 'ready',
      imageProfile: 'core',
      distribution: 'ubuntu',
      diskLayout: 'guided',
      diskSizeMiB: 1024,
      rootSizeMiB: 832,
      swapSizeMiB: 128,
      networkMode: 'dhcp',
      ipv4Address: '192.168.1.100/24',
      gateway: '192.168.1.1',
      dnsServers: '1.1.1.1',
      username: 'student',
      hostname: 'kernel-lab',
      timezone: 'Asia/Shanghai',
      createdAt: '2026-07-31T00:00:00.000Z',
      updatedAt: '2026-07-31T00:00:00.000Z',
      runtimeVersion: null,
      imageId: null,
      errorMessage: null,
    },
  }),
}))

vi.mock('../features/terminal/SimulatedTerminalPane', () => ({
  SimulatedTerminalPane: () => <div data-testid="simulated-terminal">terminal</div>,
}))

vi.mock('../features/terminal/TerminalPane', () => ({
  TerminalPane: () => <div data-testid="real-terminal">terminal</div>,
}))

describe('LabPage learning companion', () => {
  beforeEach(() => window.history.replaceState(null, '', '/lab'))

  it('uses real course buttons and updates the coach without remounting the terminal', async () => {
    const user = userEvent.setup()
    render(<LabPage />)

    const terminal = screen.getByTestId('simulated-terminal')
    const initial = screen.getByRole('button', { name: /Linux 是什么，企业为什么使用它/ })
    expect(initial).toHaveAttribute('aria-current', 'step')
    expect(screen.getByRole('heading', { name: '说清 Linux 内核与 Linux 发行版的区别。' })).toBeInTheDocument()

    const shellLesson = screen.getByRole('button', { name: /Shell、路径、帮助与 Tab 补全/ })
    await user.click(shellLesson)

    expect(shellLesson).toHaveAttribute('aria-current', 'step')
    expect(initial).not.toHaveAttribute('aria-current')
    expect(screen.getByRole('heading', { name: '读懂命令、选项、参数和提示符。' })).toBeInTheDocument()
    expect(screen.getByText(/成功通常为 0/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /pwd.*定位与移动/ })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /打开完整课程/ })).toHaveAttribute(
      'href',
      '/courses?lesson=shell-foundations',
    )
    expect(screen.getByTestId('simulated-terminal')).toBe(terminal)
  })

  it('opens a valid lesson from the query string and falls back for invalid ids', () => {
    window.history.replaceState(null, '', '/lab?lesson=files-permissions')
    const { unmount } = render(<LabPage />)
    expect(screen.getByRole('button', { name: /文件、目录、链接与权限/ })).toHaveAttribute('aria-current', 'step')
    unmount()

    window.history.replaceState(null, '', '/lab?lesson=missing')
    render(<LabPage />)
    expect(screen.getByRole('button', { name: /Linux 是什么，企业为什么使用它/ })).toHaveAttribute('aria-current', 'step')
  })
})
