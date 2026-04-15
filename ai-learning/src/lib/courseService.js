import { getSupabase, insert, update, remove } from './db.js';

// ─── CURSOS ───────────────────────────────────────────────────

export async function listCourses({ usuarioId = null, soloActivos = true } = {}) {
  const sb = getSupabase();

  let q = sb.from('Curso').select(`
    id, titulo, descripcion, activo, creadoEn,
    Leccion(count)
  `);

  if (soloActivos) q = q.eq('activo', true);

  const { data: cursos, error } = await q.order('creadoEn', { ascending: false });
  if (error) throw new Error(error.message);

  // Si hay usuario, agregar progreso
  if (usuarioId && cursos?.length) {
    const { data: progresos } = await sb
      .from('Progreso')
      .select('cursoId, porcentaje, completadoEn')
      .eq('usuarioId', usuarioId);

    const mapaProgreso = Object.fromEntries((progresos ?? []).map(p => [p.cursoId, p]));

    return cursos.map(c => ({
      ...c,
      progreso: mapaProgreso[c.id] ?? { porcentaje: 0, completadoEn: null },
    }));
  }

  return cursos ?? [];
}

export async function getCourseById(cursoId, usuarioId = null) {
  const sb = getSupabase();

  const { data: curso, error } = await sb
    .from('Curso')
    .select(`
      id, titulo, descripcion, activo, creadoEn,
      Leccion(id, titulo, orden, fechaLimite,
        Contenido(id, tipo, titulo, contenidoURLoTexto),
        Examen(id, titulo, puntajeMinimo, maxIntentos)
      )
    `)
    .eq('id', cursoId)
    .single();

  if (error) throw new Error(error.message);

  if (usuarioId) {
    const { data: completadas } = await sb
      .from('LeccionCompletada')
      .select('leccionId')
      .eq('usuarioId', usuarioId);

    const setCompletadas = new Set((completadas ?? []).map(l => l.leccionId));

    curso.Leccion = (curso.Leccion ?? []).map(l => ({
      ...l,
      completada: setCompletadas.has(l.id),
    }));
  }

  return curso;
}

export async function createCourse({ titulo, descripcion, creadoPor }) {
  return insert('Curso', { titulo, descripcion, creadoPor, activo: false });
}

export async function updateCourse(cursoId, fields) {
  const allowed = ['titulo', 'descripcion', 'activo'];
  const payload = {};
  for (const k of allowed) {
    if (fields[k] !== undefined) payload[k] = fields[k];
  }
  if (!Object.keys(payload).length) throw new Error('SIN_CAMPOS');
  return update('Curso', payload, 'id', cursoId);
}

export async function deleteCourse(cursoId) {
  return remove('Curso', 'id', cursoId);
}

// ─── LECCIONES ────────────────────────────────────────────────

export async function createLesson({ cursoId, titulo, orden, fechaLimite = null }) {
  return insert('Leccion', { cursoId, titulo, orden, fechaLimite });
}

export async function updateLesson(leccionId, fields) {
  const allowed = ['titulo', 'orden', 'fechaLimite'];
  const payload = {};
  for (const k of allowed) {
    if (fields[k] !== undefined) payload[k] = fields[k];
  }
  return update('Leccion', payload, 'id', leccionId);
}

export async function deleteLesson(leccionId) {
  return remove('Leccion', 'id', leccionId);
}

// ─── CONTENIDO ────────────────────────────────────────────────

export async function createContent({ leccionId, tipo, titulo, contenidoURLoTexto }) {
  return insert('Contenido', { leccionId, tipo, titulo, contenidoURLoTexto });
}

export async function deleteContent(contenidoId) {
  return remove('Contenido', 'id', contenidoId);
}

// ─── PROGRESO ────────────────────────────────────────────────

/**
 * Marca una lección como completada y recalcula el progreso del curso.
 * Retorna { leccionCompletada, cursoCompletado, porcentaje }
 */
export async function completeLesson(usuarioId, leccionId) {
  const sb = getSupabase();

  // 1. Registrar lección completada
  await sb.from('LeccionCompletada').upsert(
    { usuarioId, leccionId, completadoEn: new Date().toISOString() },
    { onConflict: 'usuarioId,leccionId' }
  );

  // 2. Obtener cursoId de esta lección
  const { data: leccion } = await sb
    .from('Leccion').select('cursoId').eq('id', leccionId).single();

  const cursoId = leccion.cursoId;

  // 3. Total de lecciones del curso
  const { count: totalLecciones } = await sb
    .from('Leccion')
    .select('*', { count: 'exact', head: true })
    .eq('cursoId', cursoId);

  // 4. Lecciones completadas por el usuario en ese curso
  const { data: completadasData } = await sb
    .from('LeccionCompletada')
    .select('leccionId, Leccion!inner(cursoId)')
    .eq('usuarioId', usuarioId)
    .eq('Leccion.cursoId', cursoId);

  const completadas = (completadasData ?? []).length;
  const porcentaje  = Math.round((completadas / totalLecciones) * 100);
  const cursoCompletado = porcentaje === 100;

  // 5. Upsert progreso
  await sb.from('Progreso').upsert({
    usuarioId,
    cursoId,
    porcentaje,
    leccionesCompletadas: completadas,
    completadoEn: cursoCompletado ? new Date().toISOString() : null,
  }, { onConflict: 'usuarioId,cursoId' });

  return { leccionCompletada: true, cursoCompletado, porcentaje };
}

export async function getUserCourseProgress(usuarioId, cursoId) {
  const sb = getSupabase();

  const { data: progreso } = await sb
    .from('Progreso')
    .select('porcentaje, leccionesCompletadas, completadoEn, iniciadoEn')
    .eq('usuarioId', usuarioId)
    .eq('cursoId', cursoId)
    .maybeSingle();

  return progreso ?? { porcentaje: 0, leccionesCompletadas: 0, completadoEn: null };
}

// Vista admin: progreso de todos los usuarios en un curso
export async function getCourseProgressForAdmin(cursoId) {
  const sb = getSupabase();

  const { data, error } = await sb
    .from('Usuario')
    .select(`
      id, nombre, correo,
      Progreso!left(porcentaje, completadoEn)
    `)
    .eq('rolId', 1)
    .eq('Progreso.cursoId', cursoId)
    .order('nombre');

  if (error) throw new Error(error.message);
  return data ?? [];
}