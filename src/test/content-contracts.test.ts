import { describe, expect, it } from 'vitest'
import { commandDocs } from '../content/commands'
import { courseLessons } from '../content/courses'

const expectedCommands = [
  'pwd',
  'ls',
  'cd',
  'mkdir',
  'touch',
  'cp',
  'mv',
  'rm',
  'ln',
  'cat',
  'less',
  'head',
  'tail',
  'grep',
  'sed',
  'awk',
  'find',
  'xargs',
  'sort',
  'uniq',
  'wc',
  'cut',
  'chmod',
  'chown',
  'ps',
  'kill',
  'jobs',
  'tar',
  'file',
  'uname',
] as const

describe('starter command library', () => {
  it('keeps the exact 30-command MVP scope and order', () => {
    expect(commandDocs).toHaveLength(30)
    expect(commandDocs.map(({ name }) => name)).toEqual(expectedCommands)
  })

  it('marks every command as pending guest-manifest verification', () => {
    for (const command of commandDocs) {
      expect(command.verified).toBe(false)
      expect(command.verificationStatus).toBe('pending-guest-manifest')
      expect(command.verificationNote).toMatch(/不得据此宣称命令已经安装/)
    }
  })
})

describe('starter curriculum', () => {
  it('contains exactly five lessons in the intended sequence', () => {
    expect(courseLessons).toHaveLength(5)
    expect(courseLessons.map(({ id }) => id)).toEqual([
      'linux-basics-01',
      'filesystem-01',
      'text-pipelines-01',
      'permissions-processes-01',
      'embedded-rootfs-01',
    ])
  })

  it('gives every lesson four or five executable lab steps', () => {
    expect(courseLessons.map(({ labSteps }) => labSteps.length)).toEqual([
      4, 4, 5, 4, 5,
    ])

    for (const lesson of courseLessons) {
      expect(lesson.labSteps.length).toBeGreaterThanOrEqual(4)
      expect(lesson.labSteps.length).toBeLessThanOrEqual(5)
      for (const step of lesson.labSteps) {
        expect(step.commands.length).toBeGreaterThan(0)
        expect(step.expectedObservation).not.toHaveLength(0)
      }
    }
  })
})
