import { getSesionExamen, guardarRespuestas, finalizarSesionExamen } from '../../../lib/quizService.js';

export const POST = async ({ request, locals }) => {
  const { sesionId, respuestas } = await request.json();

  const sesion = await getSesionExamen(sesionId, locals.usuario.sub).catch(() => null);
  if (!sesion)           return Response.json({ ok: false, error: 'Sesión no encontrada.' }, { status: 404 });
  if (sesion.finalizada) return Response.json({ ok: false, error: 'Examen ya enviado.' }, { status: 409 });

  const resultados = await guardarRespuestas(sesionId, respuestas);
  const correctas  = resultados.filter(r => r.esCorrecta).length;
  const total      = resultados.length;
  const porcentaje = Math.round((correctas / total) * 100);

  await finalizarSesionExamen(sesionId, correctas, total);

  return Response.json({
    ok: true,
    resultado: {
      puntaje: correctas,
      total,
      porcentaje,
      aprobado: porcentaje >= 70,
      respuestas: resultados,
    },
  });
};