import { signToken, setAuthCookie, redirectByRole } from '../../../lib/auth.js';

// Usuarios de prueba hardcodeados 
const USUARIOS_PRUEBA = [
  {
    id: 1,
    nombre: 'Usuario Demo',
    correo: 'empleado@whirlpool.com',
    password: 'Whirlpool123',
    rol: 'Usuario',
  },
  {
    id: 2,
    nombre: 'Admin Demo',
    correo: 'admin@whirlpool.com',
    password: 'Whirlpool123',
    rol: 'Administrador',
  },
  {
    id: 3,
    nombre: 'Super Admin Demo',
    correo: 'super@whirlpool.com',
    password: 'Whirlpool123',
    rol: 'SuperAdministrador',
  },
];

export const POST = async ({ request, cookies }) => {
  const body = await request.json();
  const { correo, password } = body;

  if (!correo || !password) {
    return Response.json(
      { ok: false, error: 'Correo y contraseña requeridos.' },
      { status: 422 }
    );
  }

  // Buscar usuario hardcodeado
  const usuario = USUARIOS_PRUEBA.find(
    u => u.correo === correo.toLowerCase().trim()
  );

  if (!usuario || usuario.password !== password) {
    return Response.json(
      { ok: false, error: 'Credenciales incorrectas.' },
      { status: 401 }
    );
  }

  // Crear token JWT
  const token = signToken({
    sub:    usuario.id,
    correo: usuario.correo,
    nombre: usuario.nombre,
    rol:    usuario.rol,
  });

  setAuthCookie(cookies, token);

  return Response.json({
    ok: true,
    redirectTo: redirectByRole(usuario.rol),
  });
};


