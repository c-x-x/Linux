import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createInstallationDraft } from '../features/installation/model'

describe('createInstallationDraft', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-07-30T08:15:30.000Z'))
    vi.stubGlobal('crypto', {
      randomUUID: () => '11111111-2222-4333-8444-555555555555',
    })
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.unstubAllGlobals()
  })

  it('creates the documented Core learning profile without claiming installation', () => {
    expect(createInstallationDraft()).toEqual({
      schemaVersion: 1,
      installationId: '11111111-2222-4333-8444-555555555555',
      status: 'draft',
      imageProfile: 'core',
      distribution: 'buildroot',
      diskLayout: 'guided',
      diskSizeMiB: 1024,
      rootSizeMiB: 832,
      swapSizeMiB: 128,
      networkMode: 'dhcp',
      ipv4Address: '192.168.1.100/24',
      gateway: '192.168.1.1',
      dnsServers: '1.1.1.1, 8.8.8.8',
      username: 'student',
      hostname: 'kernel-lab',
      timezone: 'Asia/Shanghai',
      createdAt: '2026-07-30T08:15:30.000Z',
      updatedAt: '2026-07-30T08:15:30.000Z',
      runtimeVersion: null,
      imageId: null,
      errorMessage: null,
    })
  })
})
