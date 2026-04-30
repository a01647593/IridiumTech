import { supabase } from './supabaseClient';
import type { Course } from '../types';

export type CourseDraft = {
  title: string;
  description: string;
  area: string;
  level: Course['level'];
  thumbnail?: string;
};

function mapDatabaseCourse(raw: any): Course {
  return {
    id: raw.id,
    title: raw.title ?? 'Curso sin titulo',
    description: raw.description ?? '',
    thumbnail: raw.thumbnail_url ?? `https://picsum.photos/seed/${raw.id}/600/400`,
    category: raw.departments?.name ?? 'General',
    area: raw.departments?.name ?? 'General',
    progress: 0,
    isNew: false,
    duration: `${raw.lessons?.length || 0} módulos`,
    level: raw.level ?? 'Intermedio',
    externalLinks: [],
    modules: (raw.lessons || [])
      .sort((a: any, b: any) => (a.order_index ?? 0) - (b.order_index ?? 0))
      .map((lesson: any) => {
        const quizRecord = lesson.quizzes?.[0];

        return {
          id: lesson.id,
          title: lesson.title ?? 'Módulo',
          completed: false,
          duration: lesson.duration ?? '30m',
          resources: (lesson.content || []).map((item: any) => ({
            id: item.id,
            type: item.type === 'video' ? 'video' : 'pdf',
            label: item.title || item.file_name || 'Recurso',
            url: item.external_url || item.file_url || '',
          })),
          quiz: quizRecord
            ? {
                id: quizRecord.id,
                title: quizRecord.title ?? 'Quiz',
                questions: (quizRecord.questions || []).map((q: any) => {
                  const correctIndex = (q.answers || []).findIndex((a: any) => a.is_correct);
                  return {
                    id: q.id,
                    question: q.question_text,
                    options: (q.answers || []).map((a: any) => a.answer_text),
                    correctAnswer: correctIndex >= 0 ? correctIndex : 0,
                  };
                }),
              }
            : undefined,
        };
      }),
  };
}

export async function fetchCoursesDeep(): Promise<Course[]> {
  const { data, error } = await supabase
    .from('courses')
    .select(`
      *,
      departments(name),
      lessons(
        *,
        content(*),
        quizzes(
          *,
          questions(
            *,
            answers(*)
          )
        )
      )
    `)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data || []).map(mapDatabaseCourse);
}

export async function listCourses({ usuarioId = null, soloActivos = true } = {}) {
  const courses = await fetchCoursesDeep();

  if (!usuarioId) {
    return courses.map((c) => ({
      ...c,
      totalLessons: c.modules.length,
      completedLessons: 0,
      progreso: { porcentaje: 0 },
    }));
  }

  const { data: progressRows } = await supabase
    .from('lesson_progress')
    .select('lesson_id')
    .eq('user_id', usuarioId);

  const completedSet = new Set((progressRows || []).map((r: any) => String(r.lesson_id)));

  return courses
    .filter((c: any) => (soloActivos ? true : true))
    .map((c: any) => {
      const completedLessons = c.modules.filter((m: any) => completedSet.has(String(m.id))).length;
      const porcentaje = c.modules.length > 0 ? Math.round((completedLessons / c.modules.length) * 100) : 0;

      return {
        ...c,
        totalLessons: c.modules.length,
        completedLessons,
        progreso: { porcentaje },
      };
    });
}

export async function getCourseDetail(courseId: string, usuarioId: string | null = null) {
  const allCourses = await listCourses({ usuarioId, soloActivos: false });
  const found = allCourses.find((c: any) => String(c.id) === String(courseId));
  if (!found) return null;

  return {
    ...found,
    lessons: found.modules.map((m: any) => ({
      ...m,
      content: m.resources || [],
    })),
  };
}

export async function getLessonDetail(lessonId: string) {
  const { data, error } = await supabase
    .from('lessons')
    .select(`
      *,
      courses(*),
      content(*),
      quizzes(
        *,
        questions(
          *,
          answers(*)
        )
      )
    `)
    .eq('id', lessonId)
    .single();

  if (error) throw error;
  return data;
}

export async function markLessonCompleted(userId: string, lessonId: string) {
  const { data: lesson } = await supabase
    .from('lessons')
    .select('course_id')
    .eq('id', lessonId)
    .single();

  if (!lesson) return;
  const courseId = lesson.course_id;

  const { error: assignmentError } = await supabase
    .from('course_assignments')
    .upsert({ 
      user_id: userId, 
      course_id: courseId,
      assigned_at: new Date().toISOString()
    }, { onConflict: 'user_id,course_id' });

  if (assignmentError) {
    console.error("🚨 Error escribiendo en course_assignments:", assignmentError);
  }

  const { error: progressError } = await supabase
    .from('lesson_progress')
    .upsert({
      user_id: userId,
      lesson_id: lessonId,
      completed_at: new Date().toISOString()
    }, { onConflict: 'user_id,lesson_id' });

  if (progressError) {
    console.error("🚨 Error en lesson_progress:", progressError);
  }

  const [{ count: total }, { count: done }] = await Promise.all([
    supabase.from('lessons').select('*', { count: 'exact', head: true }).eq('course_id', courseId),
    supabase.from('lesson_progress')
      .select('*, lessons!inner(course_id)', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('lessons.course_id', courseId)
  ]);

  if (total !== null && total > 0 && total === done) {
    const { error: completeError } = await supabase
      .from('course_assignments')
      .update({ 
        completed_at: new Date().toISOString() 
      })
      .eq('user_id', userId)
      .eq('course_id', courseId);
      
    if (completeError) {
      console.error("🚨 Error cerrando el curso al 100%:", completeError);
    }
  }
}

export async function createCourseDB(draft: CourseDraft, userId: string) {
  const { data: dept } = await supabase.from('departments').select('id').eq('name', draft.area).maybeSingle();

  const { data, error } = await supabase
    .from('courses')
    .insert({
      title: draft.title.trim(),
      description: draft.description.trim(),
      thumbnail_url: draft.thumbnail?.trim() || null,
      level: draft.level,
      department_id: dept?.id ?? null,
      created_by: userId,
      active: true,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteCourseDB(courseId: string) {
  const { error } = await supabase.from('courses').delete().eq('id', courseId);
  if (error) throw error;
}

export async function addLessonDB(courseId: string, moduleDraft: any) {
  console.log('MODULE DRAFT:', moduleDraft);

  const { count } = await supabase
    .from('lessons')
    .select('*', { count: 'exact', head: true })
    .eq('course_id', courseId);

  const nextOrder = count ?? 0;

  const { data: lesson, error } = await supabase
    .from('lessons')
    .insert({
      course_id: courseId,
      title: moduleDraft.title?.trim() || 'Nuevo módulo',
      duration: moduleDraft.duration?.trim() || '45m',
      order_index: nextOrder,
    })
    .select()
    .single();

  if (error) throw error;

  let finalPdfUrl = moduleDraft.pdfUrl?.trim();

  if (moduleDraft.pdfFile) {
    const file = moduleDraft.pdfFile;
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
    const filePath = `modulos/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('course-content')
      .upload(filePath, file);

    if (uploadError) throw uploadError;

    const { data: publicUrlData } = supabase.storage
      .from('course-content')
      .getPublicUrl(filePath);

    finalPdfUrl = publicUrlData.publicUrl;
  }

  if (finalPdfUrl) {
    const { error: pdfError } = await supabase.from('content').insert({
      lesson_id: lesson.id,
      type: 'pdf',
      title: moduleDraft.pdfFile ? moduleDraft.pdfFile.name : 'Material PDF',
      external_url: finalPdfUrl,
    });

    if (pdfError) throw pdfError;
  }

  if (moduleDraft.videoUrl?.trim()) {
    const { error: videoError } = await supabase.from('content').insert({
      lesson_id: lesson.id,
      type: 'video',
      title: 'Video del módulo',
      external_url: moduleDraft.videoUrl.trim(),
    });

    if (videoError) throw videoError;
  }

  if (moduleDraft.addQuiz) {
    const { data: quiz, error: quizError } = await supabase
      .from('quizzes')
      .insert({
        lesson_id: lesson.id,
        title: `Quiz - ${moduleDraft.title?.trim() || 'Módulo'}`,
      })
      .select()
      .single();

    if (quizError) throw quizError;

    for (let i = 1; i <= 5; i++) {
      const { data: question, error: questionError } = await supabase
        .from('questions')
        .insert({
          lesson_id: lesson.id,
          quiz_id: quiz.id,
          type: 'multiple_choice',
          question_text: `Pregunta ${i}`,
        })
        .select()
        .single();

      if (questionError) throw questionError;

      for (let j = 1; j <= 4; j++) {
        const { error: answerError } = await supabase.from('answers').insert({
          question_id: question.id,
          answer_text: `Opción ${j}`,
          is_correct: j === 1,
        });

        if (answerError) throw answerError;
      }
    }
  }
}

export async function deleteLessonDB(lessonId: string) {
  const { error } = await supabase.from('lessons').delete().eq('id', lessonId);
  if (error) throw error;
}

export async function syncQuizDB(lessonId: string, quizState: any) {
  if (!quizState) {
    const { error } = await supabase.from('quizzes').delete().eq('lesson_id', lessonId);
    if (error) throw error;
    return;
  }

  const isNewQuiz = typeof quizState.id === 'string' && quizState.id.startsWith('q-') || !quizState.id;

  const { data: quizRecord, error: quizErr } = await supabase
    .from('quizzes')
    .upsert({
      ...(isNewQuiz ? {} : { id: quizState.id }),
      lesson_id: lessonId,
      title: quizState.title || 'Quiz del módulo'
    })
    .select()
    .single();

  if (quizErr) throw quizErr;
  const realQuizId = quizRecord.id;

  const { data: existingQs } = await supabase.from('questions').select('id').eq('quiz_id', realQuizId);
  const stateQIds = quizState.questions.map((q: any) => q.id).filter((id: string) => !String(id).startsWith('q-'));
  const qsToDelete = existingQs?.filter(q => !stateQIds.includes(q.id)).map(q => q.id) || [];
  
  if (qsToDelete.length > 0) {
    await supabase.from('questions').delete().in('id', qsToDelete);
  }

  for (const q of quizState.questions) {
    const isNewQ = typeof q.id === 'string' && q.id.startsWith('q-');
    
    const { data: qRecord, error: qErr } = await supabase
      .from('questions')
      .upsert({
        ...(isNewQ ? {} : { id: q.id }),
        quiz_id: realQuizId,
        lesson_id: lessonId,
        question_text: q.question,
        type: 'multiple_choice'
      })
      .select()
      .single();

    if (qErr) throw qErr;

    await supabase.from('answers').delete().eq('question_id', qRecord.id);

    const answersToInsert = q.options.map((optText: string, index: number) => ({
      question_id: qRecord.id,
      answer_text: optText,
      is_correct: index === q.correctAnswer
    }));

    const { error: ansErr } = await supabase.from('answers').insert(answersToInsert);
    if (ansErr) throw ansErr;
  }
}

export async function updateCourseCompletionStatus(userId: string, courseId: string) {
  const allCourses = await listCourses({ usuarioId: userId, soloActivos: false });
  const course = allCourses.find((c: any) => String(c.id) === String(courseId));

  if (course && course.progreso.porcentaje === 100) {
    const { error } = await supabase
      .from('course_assignments')
      .update({ completed_at: new Date().toISOString() })
      .eq('user_id', userId)
      .eq('course_id', courseId);

    if (error) {
      console.error('Error al actualizar el estado del curso:', error.message);
    }
  }
}

export async function checkAndMarkCourseAsCompleted(userId: string, courseId: string) {
  const { count: totalLessons } = await supabase
    .from('lessons')
    .select('*', { count: 'exact', head: true })
    .eq('course_id', courseId);

  const { count: completedCount } = await supabase
    .from('lesson_progress')
    .select('*, lessons!inner(course_id)', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('lessons.course_id', courseId);

  if (totalLessons !== null && totalLessons > 0 && totalLessons === completedCount) {
    await supabase
      .from('course_assignments')
      .update({ 
        status: 'completed', 
        completed_at: new Date().toISOString() 
      })
      .eq('user_id', userId)
      .eq('course_id', courseId);
  }
}