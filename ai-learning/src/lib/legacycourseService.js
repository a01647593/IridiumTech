//Pendiente a eliminar

import { supabase } from './supabaseClient';

// ─────────────────────────────────────────────
// LECTURA
// ─────────────────────────────────────────────

export async function listCourses({ usuarioId = null, soloActivos = true } = {}) {
  let q = supabase
    .from('courses')
    .select(`id, title, description, active, created_by, created_at, department_id, thumbnail_url, lessons(id)`);

  if (soloActivos) q = q.eq('active', true);

  const { data: cursos, error } = await q.order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  if (!cursos) return [];

  if (!usuarioId) {
    return cursos.map((c) => ({
      ...c,
      totalLessons: c.lessons?.length ?? 0,
      completedLessons: 0,
      progreso: { porcentaje: 0 },
    }));
  }

  const { data: completedRows, error: progressError } = await supabase
    .from('lesson_progress')
    .select('lesson_id, lessons!inner(course_id)')
    .eq('user_id', usuarioId);

  if (progressError) throw new Error(progressError.message);

  const completadasPorCurso = {};
  (completedRows ?? []).forEach((row) => {
    const courseId = row.lessons.course_id;
    completadasPorCurso[courseId] = (completadasPorCurso[courseId] ?? 0) + 1;
  });

  return cursos.map((c) => {
    const totalLessons = c.lessons?.length ?? 0;
    const completedLessons = completadasPorCurso[c.id] ?? 0;
    const porcentaje = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;
    return { ...c, totalLessons, completedLessons, progreso: { porcentaje } };
  });
}

export async function getCourseDetail(courseId, usuarioId = null) {
  const { data, error } = await supabase
    .from('courses')
    .select(`
      id, title, description, active, department_id, thumbnail_url,
      lessons(id, title, order_index,
        content(id, type, title, file_url, external_url, text_content),
        quizzes(id, title)
      )
    `)
    .eq('id', courseId)
    .single();

  if (error) throw new Error(error.message);
  if (!data) return null;

  const lessons = [...(data.lessons ?? [])].sort(
    (a, b) => (a.order_index ?? 0) - (b.order_index ?? 0)
  );

  let completedLessonIds = new Set();
  if (usuarioId) {
    const { data: progressData } = await supabase
      .from('lesson_progress')
      .select('lesson_id')
      .eq('user_id', usuarioId);
    completedLessonIds = new Set((progressData ?? []).map((r) => String(r.lesson_id)));
  }

  return {
    ...data,
    lessons: lessons.map((l) => ({
      ...l,
      completed: completedLessonIds.has(String(l.id)),
    })),
  };
}

export async function getLessonDetail(lessonId) {
  const { data, error } = await supabase
    .from('lessons')
    .select(`
      id, title, order_index, course_id,
      content(id, type, title, file_url, external_url, text_content),
      quizzes(id, title)
    `)
    .eq('id', lessonId)
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function markLessonCompleted(userId, lessonId) {
  const { error } = await supabase
    .from('lesson_progress')
    .upsert({ user_id: userId, lesson_id: lessonId }, { onConflict: 'user_id,lesson_id' });
  if (error) throw new Error(error.message);
}

// ─────────────────────────────────────────────
// ESCRITURA — Crear curso completo
// ─────────────────────────────────────────────

/**
 * Crea un curso con sus lecciones, contenido y quizzes en Supabase.
 *
 * @param {object} draft - Datos del curso
 * @param {string} draft.title
 * @param {string} draft.description
 * @param {number} draft.department_id
 * @param {string} [draft.thumbnail_url]
 * @param {string} createdBy - UUID del usuario que crea el curso
 * @param {LessonDraft[]} lessons - Lecciones a crear
 * @returns {Promise<{ id: string }>} El curso creado
 */
export async function createCourse(draft, createdBy, lessons = []) {
  // 1. Crear el curso
  const { data: course, error: courseError } = await supabase
    .from('courses')
    .insert({
      title: draft.title.trim(),
      description: draft.description.trim(),
      department_id: draft.department_id,
      thumbnail_url: draft.thumbnail_url?.trim() || null,
      created_by: createdBy,
      active: true,
    })
    .select('id')
    .single();

  if (courseError) throw new Error(courseError.message);

  // 2. Crear cada lección en orden
  for (let i = 0; i < lessons.length; i++) {
    await createLesson(course.id, lessons[i], i);
  }

  return course;
}

/**
 * Agrega una lección a un curso existente.
 * @param {string} courseId
 * @param {LessonDraft} lessonDraft
 * @param {number} orderIndex
 */
export async function createLesson(courseId, lessonDraft, orderIndex = 0) {
  // 1. Insertar la lección
  const { data: lesson, error: lessonError } = await supabase
    .from('lessons')
    .insert({
      course_id: courseId,
      title: lessonDraft.title.trim(),
      order_index: orderIndex,
    })
    .select('id')
    .single();

  if (lessonError) throw new Error(lessonError.message);

  // 2. Insertar contenido de la lección (PDF, video, texto)
  const contentItems = lessonDraft.content ?? [];
  for (const item of contentItems) {
    await createContent(lesson.id, item);
  }

  // 3. Crear quiz si viene en el draft
  if (lessonDraft.quiz) {
    await createQuiz(lesson.id, lessonDraft.quiz);
  }

  return lesson;
}

/**
 * Agrega un recurso de contenido a una lección.
 * type: 'pdf' | 'video' | 'text' | 'link'
 */
export async function createContent(lessonId, item) {
  const { error } = await supabase.from('content').insert({
    lesson_id: lessonId,
    type: item.type,                          // 'pdf' | 'video' | 'text' | 'link'
    title: item.title?.trim() ?? null,
    external_url: item.external_url?.trim() || null,
    text_content: item.text_content?.trim() || null,
    file_url: item.file_url?.trim() || null,
    file_name: item.file_name ?? null,
    mime_type: item.mime_type ?? null,
  });

  if (error) throw new Error(error.message);
}

/**
 * Crea un quiz con sus preguntas y opciones de respuesta.
 * @param {string} lessonId
 * @param {{ title: string, questions: QuestionDraft[] }} quizDraft
 */
export async function createQuiz(lessonId, quizDraft) {
  // 1. Insertar el quiz
  const { data: quiz, error: quizError } = await supabase
    .from('quizzes')
    .insert({ lesson_id: lessonId, title: quizDraft.title?.trim() ?? 'Quiz' })
    .select('id')
    .single();

  if (quizError) throw new Error(quizError.message);

  // 2. Insertar preguntas y sus respuestas
  for (const q of quizDraft.questions ?? []) {
    const { data: question, error: questionError } = await supabase
      .from('questions')
      .insert({
        quiz_id: quiz.id,
        lesson_id: lessonId,
        type: 'multiple_choice',
        question_text: q.question_text.trim(),
      })
      .select('id')
      .single();

    if (questionError) throw new Error(questionError.message);

    // 3. Insertar opciones de respuesta
    const answers = (q.answers ?? []).map((a) => ({
      question_id: question.id,
      answer_text: a.answer_text.trim(),
      is_correct: a.is_correct ?? false,
    }));

    if (answers.length > 0) {
      const { error: answersError } = await supabase.from('answers').insert(answers);
      if (answersError) throw new Error(answersError.message);
    }
  }

  return quiz;
}

// ─────────────────────────────────────────────
// ESCRITURA — Eliminar
// ─────────────────────────────────────────────

/**
 * Elimina un curso y todo su contenido en cascada.
 * Requiere que las FK en Supabase tengan ON DELETE CASCADE,
 * o se eliminan manualmente en orden inverso.
 */
export async function deleteCourse(courseId) {
  // Supabase elimina en cascada si está configurado,
  // si no, borrar lessons primero activará el cascade hacia abajo.
  const { error } = await supabase.from('courses').delete().eq('id', courseId);
  if (error) throw new Error(error.message);
}

export async function deleteLesson(lessonId) {
  const { error } = await supabase.from('lessons').delete().eq('id', lessonId);
  if (error) throw new Error(error.message);
}

// ─────────────────────────────────────────────
// ESCRITURA — Actualizar
// ─────────────────────────────────────────────

export async function updateCourse(courseId, fields) {
  const allowed = ['title', 'description', 'department_id', 'thumbnail_url', 'active'];
  const payload = Object.fromEntries(
    Object.entries(fields).filter(([k]) => allowed.includes(k))
  );
  const { error } = await supabase.from('courses').update(payload).eq('id', courseId);
  if (error) throw new Error(error.message);
}