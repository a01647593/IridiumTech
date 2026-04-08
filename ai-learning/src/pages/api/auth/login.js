import { findUserByEmail, updateLastActivity } from '../../../lib/userService.js';
import { verifyPassword, signToken, setAuthCookie, redirectByRole } from '../../../lib/auth.js';

export const POST = async ({ request, cookies }) => {
  const body = await request.json();
  const { correo, password } = body;

  if (!correo || !password) {
    return Response.json({ ok: false, error: 'Correo y contraseña requeridos.' }, { status: 422 });
  }

  const usuario = await findUserByEmail(correo.toLowerCase().trim()).catch(() => null);
  const ERROR = 'Credenciales incorrectas.';

  if (!usuario) {
    return Response.json({ ok: false, error: ERROR }, { status: 401 });
  }

  if (!usuario.empleadoVerificado) {
    return Response.json({ ok: false, error: 'Cuenta no verificada. Contacta a TI.' }, { status: 403 });
  }

  const passwordOk = await verifyPassword(password, usuario.passwordHash);
  if (!passwordOk) {
    return Response.json({ ok: false, error: ERROR }, { status: 401 });
  }

  const token = signToken({
    sub:    usuario.id,
    correo: usuario.correo,
    nombre: usuario.nombre,
    rol:    usuario.rolNombre,
  });

  setAuthCookie(cookies, token);
  updateLastActivity(usuario.id).catch(() => {});

  return Response.json({
    ok: true,
    redirectTo: redirectByRole(usuario.rolNombre),
  });
};