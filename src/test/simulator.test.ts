import { describe, expect, it } from 'vitest'
import { createInstallationDraft } from '../features/installation/model'
import { completeInput, createSimulatorState, executeSimulatedCommand } from '../features/terminal/simulator'

function profile(distribution: 'debian' | 'ubuntu') {
  return { ...createInstallationDraft(), distribution, username: 'student', hostname: 'linux-lab' }
}

describe('distribution teaching simulator', () => {
  it('returns distribution-specific system identity', () => {
    const debian = profile('debian')
    const ubuntu = profile('ubuntu')
    expect(executeSimulatedCommand('cat /etc/os-release', createSimulatorState(debian), debian).output).toContain('Debian GNU/Linux 12')
    expect(executeSimulatedCommand('cat /etc/os-release', createSimulatorState(ubuntu), ubuntu).output).toContain('Ubuntu 24.04.2 LTS')
  })

  it('supports stateful file exercises and realistic errors', () => {
    const installation = profile('debian')
    const state = createSimulatorState(installation)
    expect(executeSimulatedCommand('mkdir demo', state, installation).output).toBe('')
    expect(executeSimulatedCommand('cd demo', state, installation).output).toBe('')
    executeSimulatedCommand('touch notes.txt', state, installation)
    expect(executeSimulatedCommand('ls', state, installation).output).toContain('notes.txt')
    expect(executeSimulatedCommand('cat missing.txt', state, installation).output).toContain('No such file or directory')
    executeSimulatedCommand("printf 'INFO boot\\nWARN network\\nINFO ready' > app.log", state, installation)
    expect(executeSimulatedCommand('grep INFO app.log | wc -l', state, installation).output).toBe('2')
  })

  it('completes commands with Tab candidates', () => {
    const installation = profile('ubuntu')
    const completion = completeInput('syste', createSimulatorState(installation))
    expect(completion.value).toBe('systemctl')
    expect(completeInput('cat /etc/os-r', createSimulatorState(installation)).value).toBe('cat /etc/os-release')
  })
})
