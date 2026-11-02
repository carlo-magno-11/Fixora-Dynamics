/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_FIXORA_AUTH_MODE?: "cloud" | "local";
  readonly VITE_FIXORA_LICENSE_ACTIVATION_ENABLED?: "true" | "false";
  readonly VITE_SUPABASE_URL?: string;
  readonly VITE_SUPABASE_PUBLISHABLE_KEY?: string;
  readonly VITE_SUPABASE_ANON_KEY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
