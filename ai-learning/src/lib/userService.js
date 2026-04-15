import { query } from './db.js';

export async function findUserByEmail(correo) {
  const rows = await query(
    `SELECT u.id, u.nombre, u.correo, u.passwordHash,
            u.empleadoVerificado, r.nombre AS rolNombre
     FROM Usuario u
     JOIN Rol r ON r.id = u.rolId
     WHERE u.correo = ? LIMIT 1`,
    [correo]
  );
  return rows[0] || null;
}

export async function updateLastActivity(userId) {
  await query(
    'UPDATE Usuario SET ultimaActividad = NOW() WHERE id = ?',
    [userId]
  );
}

export async function getAllUsers() {
  return query(
    `SELECT u.id, u.nombre, u.correo, u.empleadoVerificado,
            u.ultimaActividad, r.nombre AS rolNombre
     FROM Usuario u JOIN Rol r ON r.id = u.rolId
     ORDER BY u.id DESC`
  );
}

export async function updateUserRole(userId, rolNombre) {
  await query(
    `UPDATE Usuario u
     JOIN Rol r ON r.nombre = ?
     SET u.rolId = r.id
     WHERE u.id = ?`,
    [rolNombre, userId]
  );
}