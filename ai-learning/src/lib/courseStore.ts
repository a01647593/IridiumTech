import { MOCK_COURSES } from '../constants';
import type { Course } from '../types';

const COURSE_STORAGE_KEY = 'whirlpool_courses';

export type CourseDraft = {
  title: string;
  description: string;
  area: string;
  level: Course['level'];
  duration: string;
  thumbnail?: string;
};

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
  modules: Array.isArray(course.modules) ? course.modules : [],
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
    duration: draft.duration,
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
