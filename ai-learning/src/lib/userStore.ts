import { supabase } from './supabaseClient';

export type TeamUser = {
  id: string;
  name: string;
  email: string;
  area: string;
  role: 'user' | 'content-admin' | 'super-admin';
  status: 'Activo' | 'Inactivo';
};

const USER_STORAGE_KEY = 'whirlpool_team_users';

const DEFAULT_TEAM_USERS: TeamUser[] = [
  { id: '1', name: 'Admin GIT Labs', email: 'admin@whirlpool.com', area: 'Innovación', role: 'super-admin', status: 'Activo' },
  { id: '2', name: 'Editor Contenido', email: 'editor@whirlpool.com', area: 'Recursos Humanos', role: 'content-admin', status: 'Activo' },
  { id: '3', name: 'Juan Pérez', email: 'j.perez@whirlpool.com', area: 'Ingeniería', role: 'user', status: 'Activo' },
  { id: '4', name: 'María García', email: 'm.garcia@whirlpool.com', area: 'Marketing', role: 'user', status: 'Activo' },
  { id: '5', name: 'Roberto Garza', email: 'r.garza@whirlpool.com', area: 'Operaciones', role: 'user', status: 'Inactivo' },
];

const cloneDefaults = () => DEFAULT_TEAM_USERS.map((user) => ({ ...user }));

export function getStoredTeamUsers(): TeamUser[] {
  if (typeof window === 'undefined') return cloneDefaults();

  try {
    const raw = localStorage.getItem(USER_STORAGE_KEY);
    if (!raw) {
      const defaults = cloneDefaults();
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(defaults));
      return defaults;
    }

    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : cloneDefaults();
  } catch {
    const defaults = cloneDefaults();
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(defaults));
    return defaults;
  }
}

export function saveStoredTeamUsers(users: TeamUser[]) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(users));
}

export function addStoredTeamUser(user: Omit<TeamUser, 'id'>) {
  const users = getStoredTeamUsers();
  const nextUser: TeamUser = { ...user, id: String(Date.now()) };
  const nextUsers = [nextUser, ...users];
  saveStoredTeamUsers(nextUsers);
  return nextUser;
}

export function updateStoredTeamUser(userId: string, updates: Partial<Omit<TeamUser, 'id'>>) {
  const nextUsers = getStoredTeamUsers().map((user) => (user.id === userId ? { ...user, ...updates } : user));
  saveStoredTeamUsers(nextUsers);
  return nextUsers;
}

export function deleteStoredTeamUser(userId: string) {
  const nextUsers = getStoredTeamUsers().filter((user) => user.id !== userId);
  saveStoredTeamUsers(nextUsers);
  return nextUsers;
}

export async function fetchTeamUsersFromSupabase(): Promise<TeamUser[]> {
  try {
    const { data, error } = await supabase
      .from('users')
      .select(`
        id,
        nombre,
        email,
        department_id,
        ultima_actividad,
        departments (
          name
        ),
        user_roles (
          roles (
            name
          )
        )
      `);

    if (error) {
      console.error('Error fetching users:', error);
      return getStoredTeamUsers();
    }

    if (!data) return getStoredTeamUsers();

    return data.map((user: any) => {
      const roleName = user.user_roles?.[0]?.roles?.name ?? 'user';
      const normalizedRole = roleName.toLowerCase().includes('super') 
        ? 'super-admin'
        : roleName.toLowerCase().includes('content') || roleName.toLowerCase().includes('admin')
        ? 'content-admin'
        : 'user';

      // Estado basado en última actividad (últimas 24 horas = Activo)
      const isActive = user.ultima_actividad 
        ? (Date.now() - new Date(user.ultima_actividad).getTime()) < 24 * 60 * 60 * 1000
        : false;

      return {
        id: user.id,
        name: user.nombre || 'Sin nombre',
        email: user.email,
        area: user.departments?.name || 'General',
        role: normalizedRole,
        status: isActive ? 'Activo' : 'Inactivo',
      };
    });
  } catch (error) {
    console.error('Error in fetchTeamUsersFromSupabase:', error);
    return getStoredTeamUsers();
  }
}

export async function deleteUserFromSupabase(userId: string): Promise<boolean> {
  try {
    // Marcar usuario como inactivo (soft delete)
    const { error } = await supabase
      .from('users')
      .update({ ultima_actividad: null })
      .eq('id', userId);

    if (error) {
      console.error('Error marking user as inactive:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in deleteUserFromSupabase:', error);
    return false;
  }
}

export async function reactivateUserInSupabase(userId: string): Promise<boolean> {
  try {
    // Marcar usuario como activo actualizando ultima_actividad a ahora
    const { error } = await supabase
      .from('users')
      .update({ ultima_actividad: new Date().toISOString() })
      .eq('id', userId);

    if (error) {
      console.error('Error reactivating user:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in reactivateUserInSupabase:', error);
    return false;
  }
}

export async function updateUserRoleInSupabase(userId: string, newRole: 'user' | 'content-admin' | 'super-admin'): Promise<boolean> {
  try {
    // Mapear nombres de rol a valores esperados en BD
    const roleNameMap: Record<string, string> = {
      'user': 'user',
      'content-admin': 'content-admin',
      'super-admin': 'super-admin'
    };

    const roleName = roleNameMap[newRole];

    // Obtener el role_id de la tabla roles
    const { data: roleData, error: roleError } = await supabase
      .from('roles')
      .select('id')
      .eq('name', roleName)
      .single();

    if (roleError || !roleData) {
      console.error('Error fetching role:', roleError);
      return false;
    }

    const roleId = roleData.id;

    // Eliminar rol actual
    await supabase.from('user_roles').delete().eq('user_id', userId);

    // Asignar nuevo rol
    const { error } = await supabase
      .from('user_roles')
      .insert({
        user_id: userId,
        role_id: roleId,
      });

    if (error) {
      console.error('Error updating user role:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in updateUserRoleInSupabase:', error);
    return false;
  }
}

export async function updateUserAreaInSupabase(userId: string, areaName: string): Promise<boolean> {
  try {
    // Buscar el department_id basado en el nombre (sin intentar crear)
    const { data: deptData, error: deptError } = await supabase
      .from('departments')
      .select('id')
      .eq('name', areaName)
      .single();

    if (deptError || !deptData) {
      console.error('Department not found:', areaName, deptError);
      alert(`El departamento "${areaName}" no existe en la base de datos`);
      return false;
    }

    const departmentId = deptData.id;

    // Actualizar el department_id en la tabla users
    const { error } = await supabase
      .from('users')
      .update({ department_id: departmentId })
      .eq('id', userId);

    if (error) {
      console.error('Error updating user department:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in updateUserAreaInSupabase:', error);
    return false;
  }
}
