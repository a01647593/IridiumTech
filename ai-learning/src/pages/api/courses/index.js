import { listCourses, createCourse } from '../../../lib/courseService.js';
 
export async function GET({ locals }) {
  try {
    const usuarioId = locals?.usuario?.id ?? null;
    const cursos = await listCourses({ usuarioId });
    return new Response(JSON.stringify(cursos), { status: 200 });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500 });
  }
}
 
export async function POST({ request, locals }) {
  const rol = locals?.usuario?.Rol?.nombre;
  if (!['Administrador', 'SuperAdministrador'].includes(rol)) {
    return new Response(JSON.stringify({ error: 'Sin permiso' }), { status: 403 });
  }
  try {
    const body = await request.json();
    const curso = await createCourse({ ...body, creadoPor: locals?.usuario?.id });
    return new Response(JSON.stringify(curso), { status: 201 });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500 });
  }
}
