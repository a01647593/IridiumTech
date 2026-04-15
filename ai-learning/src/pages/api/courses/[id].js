import { getCourseById, updateCourse, deleteCourse } from '../../../../lib/courseService.js';
 
export async function GET({ params, locals }) {
  try {
    const curso = await getCourseById(Number(params.id), locals?.usuario?.id ?? null);
    if (!curso) return new Response(JSON.stringify({ error: 'No encontrado' }), { status: 404 });
    return new Response(JSON.stringify(curso), { status: 200 });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500 });
  }
}
 
export async function PUT({ params, request, locals }) {
  const rol = locals?.usuario?.Rol?.nombre;
  if (!['Administrador', 'SuperAdministrador'].includes(rol)) {
    return new Response(JSON.stringify({ error: 'Sin permiso' }), { status: 403 });
  }
  try {
    const body = await request.json();
    const curso = await updateCourse(Number(params.id), body);
    return new Response(JSON.stringify(curso), { status: 200 });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500 });
  }
}
 
export async function DELETE({ params, locals }) {
  const rol = locals?.usuario?.Rol?.nombre;
  if (rol !== 'Administrador' && rol !== 'SuperAdministrador') {
    return new Response(JSON.stringify({ error: 'Sin permiso' }), { status: 403 });
  }
  try {
    await deleteCourse(Number(params.id));
    return new Response(null, { status: 204 });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500 });
  }
}