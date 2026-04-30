import { supabase } from './supabaseClient'

export const loginWithGoogle = async () => {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: window.location.origin
    }
  })

  if (error) throw error
}

/*
Funcion anterior para redirigir el por rol

export function redirectByRole(rol) {
  if (rol === 'SuperAdministrador') return '/admin/super';
  if (rol === 'Administrador')      return '/admin/content';
  return '/dashboard';
}*/