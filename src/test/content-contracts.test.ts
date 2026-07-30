import { describe, expect, it } from 'vitest'
import { commandDocs } from '../content/commands'
import { courseLessons } from '../content/courses'

describe('Linux command library', () => {
  it('covers common command families without duplicate names', () => {
    expect(commandDocs.length).toBeGreaterThanOrEqual(85)
    expect(new Set(commandDocs.map(({ name }) => name)).size).toBe(commandDocs.length)
    for (const name of ['pwd', 'chmod', 'systemctl', 'journalctl', 'ip', 'ssh', 'apt', 'lsblk', 'dmesg']) {
      expect(commandDocs.some((command) => command.name === name)).toBe(true)
    }
  })

  it('documents syntax, examples, help and runtime availability honestly', () => {
    for (const command of commandDocs) {
      expect(command.summary.length).toBeGreaterThan(5)
      expect(command.syntax.length).toBeGreaterThan(0)
      expect(command.examples.length).toBeGreaterThan(0)
      expect(command.helpCommand.length).toBeGreaterThan(0)
      expect(command.verified).toBe(false)
    }
  })
})

describe('Linux learning path', () => {
  it('starts with Linux and distributions, then reaches enterprise embedded delivery', () => {
    expect(courseLessons).toHaveLength(10)
    expect(courseLessons[0].id).toBe('linux-overview')
    expect(courseLessons[1].id).toBe('distributions')
    expect(courseLessons.at(-1)?.id).toBe('embedded-enterprise')
  })

  it('gives every lesson concepts, outcomes and completable learning tasks', () => {
    for (const lesson of courseLessons) {
      expect(lesson.objectives.length).toBeGreaterThanOrEqual(3)
      expect(lesson.concepts.length).toBeGreaterThanOrEqual(3)
      expect(lesson.labSteps.length).toBeGreaterThanOrEqual(3)
      for (const step of lesson.labSteps) expect(step.expectedObservation.length).toBeGreaterThan(8)
    }
  })
})
