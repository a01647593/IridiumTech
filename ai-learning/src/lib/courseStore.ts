//Este archivo posiblemente se eliminara, pero lo mantengo antes de estar seguro
import { MOCK_COURSES } from '../constants';
import type { Course } from '../types';

const COURSE_STORAGE_KEY = 'whirlpool_courses';

export type CourseDraft = {
  title: string;
  description: string;
  area: string;
  level: Course['level'];
  thumbnail?: string;
};

const normalizeModule = (module: {
  id?: string | number;
  title?: string;
  completed?: boolean;
  duration?: string;
  resources?: Array<{ id?: string | number; type?: 'pdf' | 'video'; label?: string; url?: string }>;
  quiz?: {
    id?: string | number;
    title?: string;
    questions?: Array<{ id?: string | number; question?: string; options?: string[]; correctAnswer?: number }>;
  };
}) => ({
  id: String(module.id ?? `module-${Date.now()}`),
  title: module.title ?? 'Módulo',
  completed: Boolean(module.completed),
  duration: module.duration ?? '30m',
  resources: Array.isArray(module.resources)
    ? module.resources
        .filter((resource) => !!resource?.url)
        .map((resource, index) => ({
          id: String(resource.id ?? `${Date.now()}-${index}`),
          type: resource.type === 'video' ? 'video' : 'pdf',
          label: resource.label ?? (resource.type === 'video' ? 'Video' : 'PDF'),
          url: resource.url ?? '',
        }))
    : [],
  quiz: module.quiz
    ? {
        id: String(module.quiz.id ?? `quiz-${Date.now()}`),
        title: module.quiz.title ?? 'Quiz del módulo',
        questions: Array.isArray(module.quiz.questions)
          ? module.quiz.questions.map((question, index) => ({
              id: String(question.id ?? `${Date.now()}-q-${index + 1}`),
              question: question.question ?? `Pregunta ${index + 1}`,
              options: Array.isArray(question.options) && question.options.length === 4
                ? question.options
                : ['Opción 1', 'Opción 2', 'Opción 3', 'Opción 4'],
              correctAnswer: typeof question.correctAnswer === 'number' ? question.correctAnswer : 0,
            }))
          : [],
      }
    : undefined,
});

export function createDefaultQuizTemplate(moduleTitle: string) {
  return {
    id: `quiz-${Date.now()}`,
    title: `Quiz - ${moduleTitle || 'Módulo'}`,
    questions: Array.from({ length: 5 }, (_, index) => ({
      id: `q-${Date.now()}-${index + 1}`,
      question: `Pregunta ${index + 1}`,
      options: ['Opción 1', 'Opción 2', 'Opción 3', 'Opción 4'],
      correctAnswer: 0,
    })),
  };
}

const normalizeCourse = (course: Partial<Course> & { id: string | number }): Course => ({
  id: String(course.id),
  title: course.title ?? 'Curso sin titulo',
  description: course.description ?? 'Descripcion no disponible',
  thumbnail: course.thumbnail ?? 'https://picsum.photos/seed/course-default/600/400',
  category: course.category ?? course.area ?? 'General',
  area: course.area ?? course.category ?? 'General',
  progress: typeof course.progress === 'number' ? course.progress : 0,
  isNew: course.isNew,
  duration: course.duration ?? '2h 00m',
  level: course.level ?? 'Intermedio',
  externalLinks: Array.isArray(course.externalLinks) ? course.externalLinks : [],
  modules: Array.isArray(course.modules) ? course.modules.map((module) => normalizeModule(module)) : [],
});

const cloneDefaultCourses = () => MOCK_COURSES.map((course) => normalizeCourse(course));

export function getStoredCourses(): Course[] {
  if (typeof window === 'undefined') {
    return cloneDefaultCourses();
  }

  try {
    const raw = localStorage.getItem(COURSE_STORAGE_KEY);
    if (!raw) {
      const defaults = cloneDefaultCourses();
      localStorage.setItem(COURSE_STORAGE_KEY, JSON.stringify(defaults));
      return defaults;
    }

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      throw new Error('Formato de cursos invalido');
    }

    return parsed.map((course) => normalizeCourse(course));
  } catch {
    const defaults = cloneDefaultCourses();
    localStorage.setItem(COURSE_STORAGE_KEY, JSON.stringify(defaults));
    return defaults;
  }
}

export function saveStoredCourses(courses: Course[]) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(COURSE_STORAGE_KEY, JSON.stringify(courses));
}

export function getStoredCourseById(courseId: string | number) {
  return getStoredCourses().find((course) => String(course.id) === String(courseId)) ?? null;
}

export function addStoredCourse(draft: CourseDraft) {
  const courses = getStoredCourses();
  const newCourse: Course = {
    id: String(Date.now()),
    title: draft.title.trim(),
    description: draft.description.trim(),
    thumbnail: draft.thumbnail?.trim() || `https://picsum.photos/seed/${encodeURIComponent(draft.title)}/600/400`,
    category: draft.area,
    area: draft.area,
    progress: 0,
    isNew: true,
    duration: '2h 00m',
    level: draft.level,
    externalLinks: [],
    modules: [],
  };

  const nextCourses = [newCourse, ...courses];
  saveStoredCourses(nextCourses);
  return newCourse;
}

export function deleteStoredCourse(courseId: string | number) {
  const nextCourses = getStoredCourses().filter((course) => String(course.id) !== String(courseId));
  saveStoredCourses(nextCourses);
  return nextCourses;
}

export function updateStoredCourse(courseId: string | number, updates: Partial<Course>) {
  let updatedCourse: Course | null = null;
  const nextCourses = getStoredCourses().map((course) => {
    if (String(course.id) !== String(courseId)) {
      return course;
    }

    updatedCourse = normalizeCourse({ ...course, ...updates, id: course.id });
    return updatedCourse;
  });

  saveStoredCourses(nextCourses);
  return updatedCourse;
}
