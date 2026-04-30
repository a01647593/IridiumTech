import { supabase } from './supabaseClient';

export interface TeamUser {
  id: string;
  name: string;
  email: string;
  area: string;
  role: 'user' | 'content-admin' | 'super-admin';
  status: 'Activo' | 'Inactivo';
}

export function normalizeRole(value: unknown): TeamUser['role'] {
  if (typeof value !== 'string') return 'user';
  
  const v = value.trim().toLowerCase();
  if (v === 'super-admin') return 'super-admin';
  if (v === 'content-admin') return 'content-admin';
  
  return 'user';
}

export async function fetchAllUsers(): Promise<TeamUser[]> {
  const { data, error } = await supabase
    .from('users')
    .select(`
      id,
      nombre,
      email,
      empleado_verificado,
      departments ( name ),
      user_roles ( roles ( name ) )
    `);

  if (error) {
    console.error('Error obteniendo usuarios:', error.message);
    return [];
  }

  return (data || []).map((u: any) => ({
    id: u.id,
    name: u.nombre ?? 'Usuario sin nombre',
    email: u.email ?? '',
    area: u.departments?.name ?? 'General',
    role: normalizeRole(u.user_roles?.[0]?.roles?.name),
    status: u.empleado_verificado ? 'Activo' : 'Inactivo',
  }));
}

export async function updateUserRole(userId: string, rolNombre: string) {
  const { data: rol } = await supabase
    .from('roles')
    .select('id')
    .eq('name', rolNombre)
    .single();

  if (!rol) throw new Error('Rol no encontrado');

  const { error: deleteError } = await supabase
    .from('user_roles')
    .delete()
    .eq('user_id', userId);

  if (deleteError) throw new Error(`Error borrando rol anterior: ${deleteError.message}`);

  const { error: insertError } = await supabase
    .from('user_roles')
    .insert({ user_id: userId, role_id: rol.id });

  if (insertError) throw new Error(`Error asignando nuevo rol: ${insertError.message}`);
}

export async function updateUserDetails(userId: string, details: {
  name: string;
  email: string;
  area: string;
  status: 'Activo' | 'Inactivo';
}) {
  const { data: dept } = await supabase
    .from('departments')
    .select('id')
    .eq('name', details.area)
    .maybeSingle();

  const updateData = {
    nombre: details.name,
    email: details.email,
    department_id: dept?.id || null,
    empleado_verificado: details.status === 'Activo'
  };

  const { error } = await supabase
    .from('users')
    .update(updateData)
    .eq('id', userId);

  if (error) throw error;
}

export async function updateStreak(userId: string) {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();

  const { data: streakData, error } = await supabase
    .from('streaks')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) return;

  if (!streakData) {
    await supabase.from('streaks').insert({
      user_id: userId,
      current_streak: 1,
      last_login: today
    });
    return;
  }

  const lastLogin = new Date(streakData.last_login);
  const diffTime = Math.abs(now.getTime() - lastLogin.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 1) {
    await supabase
      .from('streaks')
      .update({
        current_streak: streakData.current_streak + 1,
        last_login: today
      })
      .eq('user_id', userId);
  } else if (diffDays > 1) {
    await supabase
      .from('streaks')
      .update({
        current_streak: 1,
        last_login: today
      })
      .eq('user_id', userId);
  }
}