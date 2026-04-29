import { supabase } from './supabaseClient';

interface RegisterPayload {
  name: string;
  email: string;
  password: string;
  departmentId: number;
}

export async function registerCorporateUser(payload: RegisterPayload) {
  const { data, error } = await supabase.auth.signUp({
    email: payload.email.trim().toLowerCase(),
    password: payload.password,
    options: {
      data: {
        full_name: payload.name.trim(),
      },
    },
  });

  if (error) throw new Error(error.message);
  if (!data.user) throw new Error('No se pudo crear el usuario de autenticación.');

  const userId = data.user.id;

  const { error: insertUserError } = await supabase.from('users').insert({
    id: userId,
    nombre: payload.name.trim(),
    empleado_verificado: false,
    ultima_actividad: new Date().toISOString(),
    created_at: new Date().toISOString(),
    email: payload.email.trim().toLowerCase(),
    department_id: payload.departmentId,
  });

  if (insertUserError) throw new Error(insertUserError.message);

  const { error: roleError } = await supabase.from('user_roles').insert({
    user_id: userId,
    role_id: 2,
  });

  if (roleError) throw new Error(roleError.message);

  await supabase.auth.signOut();

  return true;
}