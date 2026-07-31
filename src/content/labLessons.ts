import { courseLessons } from './courses'

export type LabLessonCommand = {
  command: string
  detail: string
}

export type LabLesson = {
  id: string
  fullLessonId: string
  title: string
  summary: string
  objective: string
  commands: readonly LabLessonCommand[]
  completion: string
  boundary: string
}

export const labLessons: readonly LabLesson[] = courseLessons.map((lesson) => {
  const commands = lesson.labSteps
    .flatMap((step) => step.commands.map((command) => ({ command, detail: step.title })))
    .filter((entry, index, entries) => entries.findIndex((candidate) => candidate.command === entry.command) === index)
    .slice(0, 4)

  return {
    id: lesson.id,
    fullLessonId: lesson.id,
    title: lesson.title,
    summary: lesson.summary,
    objective: lesson.objectives[0],
    commands,
    completion: lesson.labSteps[lesson.labSteps.length - 1].expectedObservation,
    boundary: lesson.hardwareLimitations[0],
  }
})

export function findLabLesson(id: string | null | undefined): LabLesson {
  return labLessons.find((lesson) => lesson.id === id) ?? labLessons[0]
}
