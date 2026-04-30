import { createClient } from '@supabase/supabase-js';

const sanitizeEnvValue = (value: unknown) => {
  if (typeof value !== 'string') return '';
  return value.trim().replace(/^['"]|['"]$/g, '');
};

const supabaseUrl = sanitizeEnvValue(import.meta.env.VITE_SUPABASE_URL);
const supabaseAnonKey = sanitizeEnvValue(import.meta.env.VITE_SUPABASE_ANON_KEY);

const hasSupabaseConfig = Boolean(supabaseUrl && supabaseAnonKey);

const fallbackSupabaseClient = {
  auth: {
    async getUser() {
      return { data: { user: null }, error: null };
    },
    onAuthStateChange() {
      return {
        data: {
          subscription: {
            unsubscribe() {
              return;
            },
          },
        },
      };
    },
    async signOut() {
      return { error: null };
    },
    async signInWithOAuth() {
      return {
        error: new Error('Supabase no configurado. Define VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY.'),
      };
    },
  },
};

if (!hasSupabaseConfig) {
  console.warn('[supabase] Missing env vars: VITE_SUPABASE_URL and/or VITE_SUPABASE_ANON_KEY. Running in local fallback mode.');
}

export const supabase = hasSupabaseConfig
  ? createClient(supabaseUrl!, supabaseAnonKey!)
  : (fallbackSupabaseClient as any);

export const isSupabaseConfigured = hasSupabaseConfig;