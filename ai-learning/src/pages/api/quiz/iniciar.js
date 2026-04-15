import { getLeccion, getPreguntasByLeccion, getOpciones, crearSesionExamen } from '../../../lib/quizService.js';

export const GET = async ({ request }) => {
  try {
    const url = new URL(request.url);
    const leccionId = url.searchParams.get('leccionId');
    const userId = url.searchParams.get('userId');

    if (!leccionId || !userId) {
      return Response.json(
        { ok: false, error: 'leccionId y userId requeridos' },
        { status: 422 }
      );
    }

    // Get lesson details
    const leccion = await getLeccion(parseInt(leccionId), parseInt(userId)).catch(() => null);
    if (!leccion) {
      return Response.json(
        { ok: false, error: 'Leccion no encontrada' },
        { status: 404 }
      );
    }

    // Get questions for this lesson
    const preguntas = await getPreguntasByLeccion(parseInt(leccionId));
    
    if (!preguntas.length) {
      return Response.json({
        ok: true,
        leccion,
        preguntas: [],
        sesionId: null
      });
    }

    // Get options for all questions
    const preguntaIds = preguntas.map(p => p.id);
    const opciones = await getOpciones(preguntaIds);

    // Map opciones to preguntas
    const preguntasConOpciones = preguntas.map(p => ({
      ...p,
      opciones: opciones.filter(o => o.preguntaId === p.id)
    }));

    // Create exam session
    const sesionId = await crearSesionExamen(parseInt(userId), parseInt(leccionId));

    return Response.json({
      ok: true,
      leccion,
      preguntas: preguntasConOpciones,
      sesionId
    });
  } catch (error) {
    console.error('Error initializing quiz:', error);
    return Response.json(
      { ok: false, error: 'Error al inicializar el quiz' },
      { status: 500 }
    );
  }
};