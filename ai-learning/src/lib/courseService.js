import { supabase } from '../lib/supabaseClient';

export async function listCourses({ usuarioId = null, soloActivos = true } = {}) {
  let q = supabase
    .from('courses')
    .select(`
      id,
      title,
      description,
      active,
      created_by,
      created_at,
      lessons(id)
    `);

  if (soloActivos) {
    q = q.eq('active', true);
  }

  const { data: cursos, error } = await q.order('created_at', { ascending: false });

  if (error) throw new Error(error.message);
  if (!cursos) return [];

  if (!usuarioId) {
    return cursos.map((c) => ({
      ...c,
      totalLessons: c.lessons?.length || 0,
      completedLessons: 0,
      progreso: { porcentaje: 0 },
    }));
  }

  const { data: completedRows, error: progressError } = await supabase
    .from('lesson_progress')
    .select(`
      lesson_id,
      lessons!inner(course_id)
    `)
    .eq('user_id', usuarioId);

  if (progressError) throw new Error(progressError.message);

  const completadasPorCurso = {};

  (completedRows || []).forEach((row) => {
    const courseId = row.lessons.course_id;
    completadasPorCurso[courseId] = (completadasPorCurso[courseId] || 0) + 1;
  });

  return cursos.map((c) => {
    const totalLessons = c.lessons?.length || 0;
    const completedLessons = completadasPorCurso[c.id] || 0;
    const porcentaje =
      totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

    return {
      ...c,
      totalLessons,
      completedLessons,
      progreso: { porcentaje },
    };
  });
}