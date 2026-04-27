// src/lib/userService.js
import { getSupabase } from './db.js';

export async function findUserByEmail(correo) {
  const { data, error } = await getSupabase()
    .from('Usuario')
    .select('id, nombre, correo, passwordHash, empleadoVerificado, Rol(nombre)')
    .eq('correo', correo)
    .single();

  if (error) return null;
  return data ? { ...data, rolNombre: data.Rol?.nombre } : null;
}

export async function updateLastActivity(userId) {
  await getSupabase()
    .from('Usuario')
    .update({ ultimaActividad: new Date().toISOString() })
    .eq('id', userId);
}

export async function getAllUsers() {
  const { data } = await getSupabase()
    .from('Usuario')
    .select('id, nombre, correo, empleadoVerificado, ultimaActividad, Rol(nombre)')
    .order('id', { ascending: false });
  return data ?? [];
}

export async function updateUserRole(userId, rolNombre) {
  const { data: rol } = await getSupabase()
    .from('Rol')
    .select('id')
    .eq('nombre', rolNombre)
    .single();

  if (!rol) throw new Error('Rol no encontrado');

  await getSupabase()
    .from('Usuario')
    .update({ rolId: rol.id })
    .eq('id', userId);
}