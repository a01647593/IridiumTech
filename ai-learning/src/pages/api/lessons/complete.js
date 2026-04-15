import { completeLesson, getUserCourseProgress } from '../../../lib/courseService.js';
import { handleLessonComplete, handleCourseComplete } from '../../../lib/gamificationService.js';
import { recordActivity } from '../../../lib/userService.js';
 
export async function POST({ request, locals }) {
  try {
    const { leccionId, cursoId } = await request.json();
    const usuarioId = locals.usuario.id;
 
    const result = await completeLesson(usuarioId, leccionId);
 
    // XP por lección
    const xpLeccion = await handleLessonComplete(usuarioId, cursoId, leccionId);
 
    let xpCurso = { xpGanado: 0 };
    if (result.cursoCompletado) {
      const progreso = await getUserCourseProgress(usuarioId, cursoId);
      xpCurso = await handleCourseComplete(usuarioId, cursoId, progreso.iniciadoEn);
    }
 
    // Registrar actividad para racha
    const actividadResult = await recordActivity(usuarioId, 'leccion');
 
    return new Response(JSON.stringify({
      ...result,
      xpGanado: xpLeccion.xpGanado + xpCurso.xpGanado,
      racha:    actividadResult.racha,
    }), { status: 200 });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500 });
  }
}