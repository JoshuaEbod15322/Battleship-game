import { createClient, type SupabaseClient } from '@supabase/supabase-js';

// Environment variables
const ENV_SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const ENV_SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

const STORAGE_URL_KEY = 'battleship_supabase_url';
const STORAGE_KEY_KEY = 'battleship_supabase_anon_key';

export function getStoredSupabaseConfig(): { url: string; anonKey: string } {
  let url = (typeof window !== 'undefined' ? localStorage.getItem(STORAGE_URL_KEY) : '') || '';
  let anonKey = (typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY_KEY) : '') || '';

  if (!url && ENV_SUPABASE_URL && ENV_SUPABASE_URL.trim() !== '') {
    url = ENV_SUPABASE_URL.trim();
  }
  if (!anonKey && ENV_SUPABASE_ANON_KEY && ENV_SUPABASE_ANON_KEY.trim() !== '') {
    anonKey = ENV_SUPABASE_ANON_KEY.trim();
  }

  return { url, anonKey };
}

export function saveStoredSupabaseConfig(url: string, anonKey: string) {
  if (typeof window !== 'undefined') {
    if (url) localStorage.setItem(STORAGE_URL_KEY, url.trim());
    else localStorage.removeItem(STORAGE_URL_KEY);

    if (anonKey) localStorage.setItem(STORAGE_KEY_KEY, anonKey.trim());
    else localStorage.removeItem(STORAGE_KEY_KEY);
  }
}

let supabaseInstance: SupabaseClient | null = null;
let currentConfigKey = '';

export function getSupabaseClient(): SupabaseClient | null {
  const { url, anonKey } = getStoredSupabaseConfig();
  if (!url || !anonKey) {
    return null;
  }

  const configKey = `${url}:${anonKey}`;
  if (supabaseInstance && currentConfigKey === configKey) {
    return supabaseInstance;
  }

  try {
    supabaseInstance = createClient(url, anonKey, {
      realtime: {
        params: {
          eventsPerSecond: 10,
        },
      },
    });
    currentConfigKey = configKey;
    return supabaseInstance;
  } catch (err) {
    console.error('Failed to initialize Supabase client:', err);
    return null;
  }
}

export function isSupabaseConfigured(): boolean {
  const { url, anonKey } = getStoredSupabaseConfig();
  return Boolean(url && anonKey && url.startsWith('http'));
}
