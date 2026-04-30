
import { getSupabase } from './db.js';

export const XP_REGLAS = {
  COMPLETAR_LECCION:  20,
  EXAMEN_PERFECTO:   100,
  EXAMEN_ALTO:        60,
  COMPLETAR_CURSO:   200,
  RACHA_7_DIAS:       30,
};

// ─── XP ───────────────────────────────────────────────────────

export async function awardXP(usuarioId, cursoId = null, cantidad, fuente, referencia = null) {
  if (cantidad <= 0) return 0;
  const sb = getSupabase();

  await sb.from('XP').insert({ usuarioId, cursoId, cantidad, fuente, referencia });

  const { data } = await sb
    .from('XP').select('cantidad').eq('usuarioId', usuarioId);

  return (data ?? []).reduce((sum, r) => sum + r.cantidad, 0);
}

export async function handleLessonComplete(usuarioId, cursoId, leccionId) {
  const xp = await awardXP(usuarioId, cursoId, XP_REGLAS.COMPLETAR_LECCION, 'leccion', String(leccionId));
  await checkAchievements(usuarioId, cursoId);
  return { xpGanado: XP_REGLAS.COMPLETAR_LECCION, totalXp: xp };
}

export async function handleExamPassed(usuarioId, cursoId, examenId, puntaje) {
  let cantidad = 0;
  if (puntaje === 100)    cantidad = XP_REGLAS.EXAMEN_PERFECTO;
  else if (puntaje > 85)  cantidad = XP_REGLAS.EXAMEN_ALTO;

  let totalXp = 0;
  if (cantidad > 0) {
    totalXp = await awardXP(usuarioId, cursoId, cantidad, 'examen', String(examenId));
  }

  await checkAchievements(usuarioId, cursoId);
  return { xpGanado: cantidad, totalXp };
}

export async function handleCourseComplete(usuarioId, cursoId, iniciadoEn = null) {
  const totalXp = await awardXP(usuarioId, cursoId, XP_REGLAS.COMPLETAR_CURSO, 'curso', String(cursoId));

  // Logro Velocista: curso en menos de 72 horas
  if (iniciadoEn) {
    const horas = (Date.now() - new Date(iniciadoEn).getTime()) / 3600000;
    if (horas < 72) await grantAchievement(usuarioId, 'velocista');
  }

  await checkAchievements(usuarioId, cursoId);
  return { xpGanado: XP_REGLAS.COMPLETAR_CURSO, totalXp };
}

export async function handleStreakXP(usuarioId, racha) {
  if (racha % 7 !== 0) return { xpGanado: 0 };

  await getSupabase().from('XP').insert({
    usuarioId, cursoId: null, cantidad: XP_REGLAS.RACHA_7_DIAS, fuente: 'racha', referencia: String(racha),
  });

  if (racha >= 7) await grantAchievement(usuarioId, 'racha_7');
  return { xpGanado: XP_REGLAS.RACHA_7_DIAS };
}

// ─── LOGROS ───────────────────────────────────────────────────

export async function grantAchievement(usuarioId, logroId) {
  const sb = getSupabase();

  const { data: existing } = await sb
    .from('LogroUsuario')
    .select('logroId')
    .eq('usuarioId', usuarioId)
    .eq('logroId', logroId)
    .maybeSingle();

  if (existing) return { yaLaTenia: true };

  await sb.from('LogroUsuario').insert({ usuarioId, logroId, obtenidoEn: new Date().toISOString() });
  return { yaLaTenia: false, logroId };
}

export async function checkAchievements(usuarioId, cursoId = null) {
  const sb = getSupabase();
  const granted = [];

  // Perfeccionista: 100% en 5 exámenes
  const { count: perfectos } = await sb
    .from('IntentoExamen')
    .select('*', { count: 'exact', head: true })
    .eq('usuarioId', usuarioId)
    .eq('puntaje', 100)
    .eq('aprobado', true);

  if ((perfectos ?? 0) >= 5) {
    const r = await grantAchievement(usuarioId, 'perfeccionista');
    if (!r.yaLaTenia) granted.push('perfeccionista');
  }

  // Chambeador: 3 cursos completados
  const { count: cursosCompletados } = await sb
    .from('Progreso')
    .select('*', { count: 'exact', head: true })
    .eq('usuarioId', usuarioId)
    .not('completadoEn', 'is', null);

  if ((cursosCompletados ?? 0) >= 3) {
    const r = await grantAchievement(usuarioId, 'chambeador');
    if (!r.yaLaTenia) granted.push('chambeador');
  }

  // Top 3: verificar ranking en el curso
  if (cursoId) {
    const rank = await getUserRankInCourse(usuarioId, cursoId);
    if (rank.posicion <= 3) {
      const r = await grantAchievement(usuarioId, 'top_3');
      if (!r.yaLaTenia) granted.push('top_3');
    }
  }

  return granted;
}

export async function getUserAchievements(usuarioId) {
  const { data, error } = await getSupabase()
    .from('LogroUsuario')
    .select('logroId, obtenidoEn, CatalogoLogro(nombre, descripcion, icono)')
    .eq('usuarioId', usuarioId)
    .order('obtenidoEn', { ascending: false });

  if (error) throw new Error(error.message);
  return data ?? [];
}

// ─── LEADERBOARD ──────────────────────────────────────────────

export async function getCourseLeaderboard(cursoId, limit = 50) {
  const sb = getSupabase();

  // XP por curso
  const { data: xpData } = await sb
    .from('XP')
    .select('usuarioId, cantidad')
    .eq('cursoId', cursoId);

  // Sumar XP por usuario
  const mapaXP = {};
  for (const row of (xpData ?? [])) {
    mapaXP[row.usuarioId] = (mapaXP[row.usuarioId] ?? 0) + row.cantidad;
  }

  // Usuarios con su progreso
  const { data: usuarios } = await sb
    .from('Usuario')
    .select('id, nombre, avatarUrl, rachaActual, Progreso!left(porcentaje)')
    .eq('rolId', 1)
    .eq('Progreso.cursoId', cursoId)
    .limit(limit);

  const ranking = (usuarios ?? [])
    .map(u => ({
      usuarioId:   u.id,
      nombre:      u.nombre,
      avatarUrl:   u.avatarUrl,
      rachaActual: u.rachaActual,
      xp:          mapaXP[u.id] ?? 0,
      porcentaje:  u.Progreso?.[0]?.porcentaje ?? 0,
    }))
    .sort((a, b) => b.xp - a.xp)
    .map((u, i) => ({ ...u, posicion: i + 1 }));

  return ranking;
}

export async function getUserRankInCourse(usuarioId, cursoId) {
  const ranking = await getCourseLeaderboard(cursoId, 9999);
  const entry = ranking.find(r => r.usuarioId === usuarioId);
  return entry ?? { xp: 0, posicion: null };
}

export async function getGlobalLeaderboard(limit = 100) {
  const sb = getSupabase();

  const { data: xpData } = await sb.from('XP').select('usuarioId, cantidad');

  const mapaXP = {};
  for (const row of (xpData ?? [])) {
    mapaXP[row.usuarioId] = (mapaXP[row.usuarioId] ?? 0) + row.cantidad;
  }

  const { data: usuarios } = await sb
    .from('Usuario')
    .select('id, nombre, avatarUrl, rachaActual')
    .eq('rolId', 1)
    .limit(limit);

  return (usuarios ?? [])
    .map(u => ({ ...u, xpTotal: mapaXP[u.id] ?? 0 }))
    .sort((a, b) => b.xpTotal - a.xpTotal)
    .map((u, i) => ({ ...u, posicion: i + 1 }));
}

export async function getUserXPSummary(usuarioId) {
  const { data } = await getSupabase()
    .from('XP')
    .select('cantidad, fuente, cursoId, creadoEn')
    .eq('usuarioId', usuarioId);

  const rows = data ?? [];
  const totalXp = rows.reduce((s, r) => s + r.cantidad, 0);

  const porFuente = rows.reduce((acc, r) => {
    acc[r.fuente] = (acc[r.fuente] ?? 0) + r.cantidad;
    return acc;
  }, {});

  return { totalXp, porFuente };
}
