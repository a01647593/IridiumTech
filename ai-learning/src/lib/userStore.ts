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

      return {
        id: user.id,
        name: user.nombre || 'Sin nombre',
        email: user.email,
        area: user.departments?.name || 'General',
        role: normalizedRole,
        status: user.empleado_verificado ? 'Activo' : 'Inactivo',
      };
    });
  } catch (error) {
    console.error('Error in fetchTeamUsersFromSupabase:', error);
    return getStoredTeamUsers();
  }
}
