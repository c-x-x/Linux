import { render } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { SimulatedTerminalPane } from '../features/terminal/SimulatedTerminalPane'
import type { InstallationProfile } from '../features/installation/model'

const writes: string[] = []

vi.mock('@xterm/xterm', () => ({
  Terminal: class {
    loadAddon() {}
    open() {}
    write(value: string) { writes.push(value) }
    writeln(value: string) { writes.push(`${value}\n`) }
    onData() { return { dispose() {} } }
    focus() {}
    clear() {}
    dispose() {}
  },
}))

vi.mock('@xterm/addon-fit', () => ({
  FitAddon: class {
    fit() {}
  },
}))

const profile: InstallationProfile = {
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
}

describe('SimulatedTerminalPane command drafts', () => {
  beforeEach(() => {
    writes.length = 0
    vi.stubGlobal('ResizeObserver', class {
      observe() {}
      disconnect() {}
    })
  })

  it('replaces the current input with a draft without executing it', () => {
    const consumed = vi.fn()
    const { rerender } = render(
      <SimulatedTerminalPane profile={profile} commandDraft={null} onCommandDraftConsumed={consumed} />,
    )

    const before = writes.length
    rerender(
      <SimulatedTerminalPane profile={profile} commandDraft="pwd" onCommandDraftConsumed={consumed} />,
    )

    expect(writes.slice(before).join('')).toContain('$ pwd')
    expect(writes.slice(before).join('')).not.toContain('/home/student')
    expect(consumed).toHaveBeenCalledOnce()
  })
})
