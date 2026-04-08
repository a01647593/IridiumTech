import { getLeccion, getPreguntasByLeccion, getOpciones, crearSesionExamen } from '../../../lib/quizService.js';

export const POST = async ({ request, locals }) => {
  const { leccionId } = await request.json();

  const leccion = await getLeccion(leccionId, locals.usuario.sub).catch(() => null);
  if (!leccion) {
    return Response.json({ ok: false, error: 'Lección no encontrada.' }, { status: 404 });
  }

  const sesionId  = await crearSesionExamen(locals.usuario.sub, leccionId);
  const preguntas = await getPreguntasByLeccion(leccionId);
  const opciones  = await getOpciones(preguntas.map(p => p.id));

  const data = preguntas.map(p => ({
    id:    p.id,
    texto: p.texto,
    opciones: opciones
      .filter(o => o.preguntaId === p.id)
      .map(o => ({ id: o.id, texto: o.texto })), // sin esCorrecta
  }));

  return Response.json({ ok: true, sesionId, preguntas: data, total: preguntas.length });
};