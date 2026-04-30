import { completeLesson, getUserCourseProgress } from '../../../lib/courseService.js';
import { handleLessonComplete, handleCourseComplete } from '../../../lib/gamificationService.js';
 
export async function POST({ request, locals }) {
  try {
    const { leccionId, cursoId } = await request.json();
    const usuarioId = locals?.usuario?.id;

    if (!usuarioId) {
      return new Response(JSON.stringify({ error: 'No autenticado' }), { status: 401 });
    }

    const leccionIdNum = Number(leccionId);
    const cursoIdNum = Number(cursoId);

    if (!Number.isFinite(leccionIdNum) || !Number.isFinite(cursoIdNum)) {
      return new Response(JSON.stringify({ error: 'leccionId y cursoId deben ser numericos' }), { status: 422 });
    }
 
    const result = await completeLesson(usuarioId, leccionIdNum);
 
    // XP por lección
    const xpLeccion = await handleLessonComplete(usuarioId, cursoIdNum, leccionIdNum);
 
    let xpCurso = { xpGanado: 0 };
    if (result.cursoCompletado) {
      const progreso = await getUserCourseProgress(usuarioId, cursoIdNum);
      xpCurso = await handleCourseComplete(usuarioId, cursoIdNum, progreso.iniciadoEn);
    }

    const progreso = await getUserCourseProgress(usuarioId, cursoIdNum);
 
    return new Response(JSON.stringify({
      ...result,
      xpGanado: xpLeccion.xpGanado + xpCurso.xpGanado,
      progreso,
    }), { status: 200 });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500 });
  }
}