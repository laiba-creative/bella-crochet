import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), 'VITE_');
  const key = env.VITE_SUPABASE_PUBLISHABLE_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY || '';
  let privileged = key.startsWith('sb_secret_');
  if (key.split('.').length === 3) {
    try {
      privileged ||=
        JSON.parse(Buffer.from(key.split('.')[1], 'base64url').toString()).role === 'service_role';
    } catch {
      /* Supabase rejects invalid keys */
    }
  }
  if (privileged)
    throw new Error(
      'A private Supabase key was assigned to a public VITE_ variable. Remove it and rotate the exposed key.',
    );
  return {
    plugins: [react()],
    server: { host: '127.0.0.1', allowedHosts: ['terminal.local'] },
    build: {
      sourcemap: false,
      rollupOptions: { output: { manualChunks: { supabase: ['@supabase/supabase-js'] } } },
    },
  };
});
