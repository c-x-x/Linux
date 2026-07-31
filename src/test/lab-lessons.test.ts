import { describe, expect, it } from 'vitest'
import { courseLessons } from '../content/courses'
import { findLabLesson, labLessons } from '../content/labLessons'

describe('terminal coaching lessons', () => {
  it('derives every coaching lesson from the shared course curriculum', () => {
    expect(labLessons).toHaveLength(courseLessons.length)

    for (const lesson of labLessons) {
      const source = courseLessons.find((candidate) => candidate.id === lesson.id)
      expect(source).toBeDefined()
      expect(lesson.title).toBe(source?.title)
      expect(lesson.fullLessonId).toBe(source?.id)
      expect(lesson.summary).toBe(source?.summary)
    }
  })

  it('provides useful, bounded coaching content for every lesson', () => {
    for (const lesson of labLessons) {
      expect(lesson.objective.length).toBeGreaterThan(0)
      expect(lesson.completion.length).toBeGreaterThan(0)
      expect(lesson.boundary.length).toBeGreaterThan(0)
      expect(lesson.commands.length).toBeGreaterThan(0)
      expect(lesson.commands.length).toBeLessThanOrEqual(4)

      const source = courseLessons.find((candidate) => candidate.id === lesson.id)!
      const sourceCommands = source.labSteps.flatMap((step) => step.commands)
      for (const command of lesson.commands) expect(sourceCommands).toContain(command.command)
    }
  })

  it('falls back safely when a lesson id is missing or invalid', () => {
    expect(findLabLesson('shell-foundations').id).toBe('shell-foundations')
    expect(findLabLesson('not-a-lesson').id).toBe(courseLessons[0].id)
    expect(findLabLesson(null).id).toBe(courseLessons[0].id)
  })
})
