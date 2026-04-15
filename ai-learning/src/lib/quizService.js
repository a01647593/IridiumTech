import { query } from './db.js';

export async function getLeccion(leccionId, usuarioId) {
  const rows = await query(
    `SELECT l.id, l.titulo, l.orden, l.fechaLimite,
            c.id AS cursoId, c.titulo AS cursoTitulo
     FROM Leccion l
     JOIN Curso c ON c.id = l.cursoId
     JOIN AsignacionCurso ac ON ac.cursoId = c.id AND ac.usuarioId = ?
     WHERE l.id = ? AND c.activo = 1 LIMIT 1`,
    [usuarioId, leccionId]
  );
  return rows[0] || null;
}

export async function getPreguntasByLeccion(leccionId) {
  return query(
    `SELECT id, texto, orden FROM Pregunta
     WHERE leccionId = ? ORDER BY orden`,
    [leccionId]
  );
}

export async function getOpciones(preguntaIds) {
  if (!preguntaIds.length) return [];
  const ph = preguntaIds.map(() => '?').join(',');
  return query(
    `SELECT id, preguntaId, texto, esCorrecta, explicacion
     FROM OpcionPregunta WHERE preguntaId IN (${ph})`,
    preguntaIds
  );
}

export async function crearSesionExamen(usuarioId, leccionId) {
  const result = await query(
    `INSERT INTO SesionExamen (usuarioId, leccionId, iniciada)
     VALUES (?, ?, NOW())`,
    [usuarioId, leccionId]
  );
  return result.insertId;
}

export async function getSesionExamen(sesionId, usuarioId) {
  const rows = await query(
    `SELECT * FROM SesionExamen WHERE id = ? AND usuarioId = ? LIMIT 1`,
    [sesionId, usuarioId]
  );
  return rows[0] || null;
}

export async function guardarRespuestas(sesionId, respuestas) {
  if (!respuestas.length) return [];
  const opcionIds = respuestas.map(r => r.opcionId);
  const ph = opcionIds.map(() => '?').join(',');
  const opciones = await query(
    `SELECT id, preguntaId, esCorrecta, explicacion
     FROM OpcionPregunta WHERE id IN (${ph})`,
    opcionIds
  );
  const opcionMap = new Map(opciones.map(o => [o.id, o]));
  const resultado = [];
  for (const r of respuestas) {
    const op = opcionMap.get(r.opcionId);
    if (!op) continue;
    await query(
      `INSERT INTO RespuestaUsuario (sesionId, preguntaId, opcionId, esCorrecta)
       VALUES (?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE opcionId=VALUES(opcionId), esCorrecta=VALUES(esCorrecta)`,
      [sesionId, r.preguntaId, r.opcionId, op.esCorrecta ? 1 : 0]
    );
    resultado.push({
      preguntaId: r.preguntaId,
      opcionId: r.opcionId,
      esCorrecta: !!op.esCorrecta,
      explicacion: op.explicacion,
    });
  }
  return resultado;
}

export async function finalizarSesionExamen(sesionId, puntaje, total) {
  await query(
    `UPDATE SesionExamen SET finalizada=NOW(), puntaje=?, total=? WHERE id=?`,
    [puntaje, total, sesionId]
  );
}

export async function getRankingCurso(cursoId, limit = 10) {
  return query(
    `SELECT u.id AS usuarioId, u.nombre,
            COALESCE(SUM(se.puntaje),0) AS puntajeTotal,
            RANK() OVER (ORDER BY COALESCE(SUM(se.puntaje),0) DESC) AS posicion
     FROM Usuario u
     JOIN AsignacionCurso ac ON ac.usuarioId=u.id AND ac.cursoId=?
     LEFT JOIN SesionExamen se ON se.usuarioId=u.id AND se.finalizada IS NOT NULL
     GROUP BY u.id, u.nombre
     ORDER BY puntajeTotal DESC LIMIT ?`,
    [cursoId, limit]
  );
}